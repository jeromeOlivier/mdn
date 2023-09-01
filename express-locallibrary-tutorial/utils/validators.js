const { body } = require("express-validator");

// for author
const validateAuthorName = [
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

const validateAuthorDates = [
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
];

const validateAuthor = [...validateAuthorName, ...validateAuthorDates];

// for books
const escapeButNotQuotes = (val) =>
    val.replace(
        /[&<>{}]/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "{": "&#123;",
                "}": "&#125;",
            })[char]
    );

const validateBook = [
    body("title", "Title required").trim().isLength({ min: 1 }).escape(),
    body("author", "Author required").trim().isLength({ min: 1 }).escape(),
    body("summary", "Summary required").trim().isLength({ min: 1 }).customSanitizer(escapeButNotQuotes),
    body("isbn", "ISBN required").trim().isLength({ min: 1 }).escape(),
    body("genre.*").escape(), // genre is an array
]

module.exports = { validateAuthor, validateBook }