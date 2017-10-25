const createFormModel = require('./form-model');
const { check } = require('express-validator/check');
const validator = require('validator');

const formModel = createFormModel({
    id: 'example-form',
    title: 'Example Form'
});

formModel.registerStep({
    name: 'Your Details',
    fieldsets: [
        {
            legend: 'Your Details',
            fields: [
                {
                    type: 'text',
                    name: 'first-name',
                    label: 'First Name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .escape()
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('First-name must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'last-name',
                    label: 'Last Name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .escape()
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Last-name must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'organisation',
                    label: 'Organisation',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Organisation must be provided');
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Pick a colour any colour',
    fieldsets: [
        {
            legend: 'Pick a colour any colour',
            fields: [
                {
                    type: 'radio',
                    options: [
                        {
                            label: 'Red',
                            value: 'red'
                        },
                        {
                            label: 'Green',
                            value: 'green'
                        },
                        {
                            label: 'Blue',
                            value: 'blue'
                        },
                        {
                            label: 'Other',
                            value: 'other'
                        }
                    ],
                    name: 'colour',
                    label: 'Name A Colour',
                    validator: function(field) {
                        return check(field.name)
                            .isIn(field.options.map(_ => _.value))
                            .withMessage('Must select a colour');
                    }
                },
                {
                    type: 'text',
                    name: 'other-colour',
                    label: 'Other Colour',
                    conditionalOn: {
                        name: 'colour',
                        value: 'other',
                        fallbackText: 'Only fill this in if you have selected ‘other’ for colour'
                    },
                    validator: function(field) {
                        return check(field.name).custom((val, { req }) => {
                            const conditionalField = req.body[field.conditionalOn.name];
                            if (conditionalField === field.conditionalOn.value && validator.isEmpty(val)) {
                                throw new Error('Must give us the name of a colour');
                            }

                            return true;
                        });
                    }
                }
            ]
        }
    ]
});

formModel.registerSuccessStep({
    title: 'Success',
    processor: function(data) {
        // Do something with the data
        console.log(data);
    }
});

module.exports = formModel;
