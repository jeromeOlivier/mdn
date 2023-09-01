const { body } = require("express-validator");

const authorNameValidator = [
        body("first_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("First name required.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Family name required")
        .isAlphanumeric()
        .withMessage("Family name has non alphanumeric characters."),
];

const authorDatesValidator = [
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
];

const validateAuthorAttributes = [...authorNameValidator, ...authorDatesValidator];

module.exports = { validateAuthorAttributes, }