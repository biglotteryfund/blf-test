'use strict';
const path = require('path');
const express = require('express');
const concat = require('lodash/concat');
const findIndex = require('lodash/findIndex');
const get = require('lodash/get');
const keyBy = require('lodash/keyBy');
const mapValues = require('lodash/mapValues');
const Sentry = require('@sentry/node');

const { PendingApplication } = require('../../../db/models');

const s3Uploads = require('./lib/s3-uploads');

module.exports = function(formId, formBuilder) {
    const router = express.Router();

    function renderStepFor(sectionSlug, stepNumber) {
        return function(req, res, data, errors = []) {
            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: data
            });

            const sectionIndex = findIndex(
                form.sections,
                s => s.slug === sectionSlug
            );

            const section = form.sections[sectionIndex];

            if (section) {
                const sectionShortTitle = section.shortTitle
                    ? section.shortTitle
                    : section.title;

                const sectionUrl = `${res.locals.formBaseUrl}/${section.slug}`;

                if (stepNumber) {
                    const stepIndex = parseInt(stepNumber, 10) - 1;
                    const step = section.steps[stepIndex];

                    if (step) {
                        const { nextPage, previousPage } = form.pagination({
                            baseUrl: res.locals.formBaseUrl,
                            sectionSlug: req.params.section,
                            currentStepIndex: stepIndex
                        });

                        if (step.isRequired) {
                            const viewData = {
                                csrfToken: req.csrfToken(),
                                breadcrumbs: concat(
                                    res.locals.breadcrumbs,
                                    {
                                        label: sectionShortTitle,
                                        url: sectionUrl
                                    },
                                    { label: step.title }
                                ),
                                section: section,
                                step: step,
                                stepIsMultipart: step.isMultipart,
                                stepNumber: stepNumber,
                                totalSteps: section.steps.length,
                                previousPage: previousPage,
                                nextPage: nextPage,
                                errors: errors
                            };

                            res.render(
                                path.resolve(__dirname, './views/step'),
                                viewData
                            );
                        } else {
                            res.redirect(nextPage.url);
                        }
                    } else {
                        res.redirect(res.locals.formBaseUrl);
                    }
                } else if (section.introduction) {
                    const { nextPage, previousPage } = form.pagination({
                        baseUrl: res.locals.formBaseUrl,
                        sectionSlug: req.params.section
                    });

                    const viewData = {
                        section: section,
                        breadcrumbs: concat(res.locals.breadcrumbs, {
                            label: sectionShortTitle,
                            url: sectionUrl
                        }),
                        nextPage: nextPage,
                        previousPage: previousPage
                    };

                    res.render(
                        path.resolve(__dirname, './views/section-introduction'),
                        viewData
                    );
                } else {
                    res.redirect(`${sectionUrl}/1`);
                }
            } else {
                res.redirect(res.locals.formBaseUrl);
            }
        };
    }

    router
        .route('/:section/:step?')
        .get((req, res) => {
            const renderStep = renderStepFor(
                req.params.section,
                req.params.step
            );
            renderStep(req, res, res.locals.currentApplicationData);
        })
        .post(async (req, res, next) => {
            const {
                copy,
                currentlyEditingId,
                currentApplicationData
            } = res.locals;

            const applicationData = {
                ...currentApplicationData,
                ...req.body
            };

            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: applicationData
            });

            const stepIndex = parseInt(req.params.step, 10) - 1;
            const step = form.getStep(req.params.section, stepIndex);
            const stepFields = form.getCurrentFieldsForStep(
                req.params.section,
                stepIndex
            );

            /**
             * Determine files to upload
             * - Retrieve the file from Formidable's parsed data
             * - Guard against empty files (eg. ignore empty file inputs when one already exists)
             */
            function determineFilesToUpload(fields, files) {
                const validFileFields = fields
                    .filter(field => field.type === 'file')
                    .filter(field => get(files, field.name).size > 0);

                return validFileFields.map(field => {
                    return {
                        fieldName: field.name,
                        fileData: get(files, field.name)
                    };
                });
            }

            const filesToUpload = determineFilesToUpload(stepFields, req.files);

            /**
             * Normalise file data for storage in validation object
             * This is the metadata submitted as part of JSON data
             * which joi validations run against.
             */
            function fileValues() {
                const keyedByFieldName = keyBy(filesToUpload, 'fieldName');

                return mapValues(keyedByFieldName, function({ fileData }) {
                    return {
                        filename: fileData.name,
                        size: fileData.size,
                        type: fileData.type
                    };
                });
            }

            /**
             * Re-validate form against combined application data
             * currentApplication data with req.body
             * and file metadata mixed in.
             */
            const validationResult = form.validate({
                ...applicationData,
                ...fileValues()
            });

            const errorsForStep = validationResult.messages.filter(item =>
                stepFields.map(f => f.name).includes(item.param)
            );

            try {
                /**
                 * Store the form's current state (errors and all) in the database
                 */
                await PendingApplication.saveApplicationState(
                    currentlyEditingId,
                    validationResult.value
                );

                /**
                 * If there are errors re-render the step with errors
                 * - Pass the full data object from validationResult to the view. Including invalid values.
                 * Otherwise, find the next suitable step and redirect there.
                 */
                if (errorsForStep.length > 0) {
                    const renderStep = renderStepFor(
                        req.params.section,
                        req.params.step
                    );

                    renderStep(req, res, validationResult.value, errorsForStep);
                } else {
                    // Run any pre-flight checks for this step
                    // (eg. custom validations which don't run in Joi)
                    if (step.preflightCheck) {
                        try {
                            await step.preflightCheck();
                        } catch (errors) {
                            // There was a validation error, so return users to the form
                            const renderStep = renderStepFor(
                                req.params.section,
                                req.params.step
                            );
                            return renderStep(
                                req,
                                res,
                                validationResult.value,
                                errors
                            );
                        }
                    }

                    try {
                        const uploadPromises = filesToUpload.map(file =>
                            s3Uploads.uploadFile({
                                formId: formId,
                                applicationId: currentlyEditingId,
                                fileMetadata: file
                            })
                        );

                        await Promise.all(uploadPromises);

                        const { nextPage } = form.pagination({
                            baseUrl: res.locals.formBaseUrl,
                            sectionSlug: req.params.section,
                            currentStepIndex: stepIndex
                        });
                        res.redirect(nextPage.url);
                    } catch (rejection) {
                        Sentry.captureException(rejection.error);

                        const uploadError = {
                            msg: copy.common.errorUploading,
                            param: rejection.fieldName
                        };

                        const renderStep = renderStepFor(
                            req.params.section,
                            req.params.step
                        );

                        return renderStep(req, res, validationResult.value, [
                            uploadError
                        ]);
                    }
                }
            } catch (storageError) {
                next(storageError);
            }
        });

    return router;
};
