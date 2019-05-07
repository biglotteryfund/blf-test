'use strict';
const { concat, has, head, flatMap } = require('lodash');
const { filter, getOr, uniqBy } = require('lodash/fp');

/**
 * Find suitable errors
 * 1. Find messages which either have a key **and** type or **only** a type
 *    Allows us to scope errors messages to specific keys in groups of fields (e.g. addresses, dates of birth)
 * 2. If no matching messages are found then look for a type of 'base'
 *    Allows us to show a generic message for any unmatched error type e.g. "Please enter your name"
 */
function messagesForError(detail, messages) {
    const filterKeyAndType = filter(function(message) {
        return (
            message.key === detail.context.key && message.type === detail.type
        );
    });

    const filterTypeOnly = filter(function(message) {
        return has(message, 'key') === false && message.type === detail.type;
    });

    const filterBase = filter(function(message) {
        return has(message, 'key') === false && message.type === 'base';
    });

    const matches = concat(
        filterKeyAndType(messages),
        filterTypeOnly(messages)
    );

    return matches.length ? matches : filterBase(messages);
}

/**
 * Normalise errors for use in views
 * - Maps raw joi error objects to a simplified format and
 * - In order to avoid showing multiple validation errors per field we find the first error per field name
 * - Determines the appropriate translated error message to use based on current error type.
 *
 * @param {Object} options
 * @param {Object} options.errorDetails
 * @param {Object} options.errorMessages
 */
module.exports = function normaliseErrors({ errorDetails, errorMessages }) {
    const uniqueErrorsDetails = uniqBy(detail => head(detail.path))(
        errorDetails
    );

    return flatMap(uniqueErrorsDetails, function(detail) {
        const name = head(detail.path);
        const fieldMessages = getOr([], name)(errorMessages);
        const matchingMessages = messagesForError(detail, fieldMessages);

        return matchingMessages.map(function(match) {
            return {
                param: name,
                msg: match.message
            };
        });
    });
};
