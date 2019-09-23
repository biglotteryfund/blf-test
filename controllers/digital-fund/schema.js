'use strict';

const Joi = require('@hapi/joi16');

function validateAssistance(data) {
    const schema = Joi.object({
        email: Joi.string()
            .email()
            .required()
    });

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
}

module.exports = { validateAssistance };