const { body } = require("express-validator");

// for author
const validateAuthorName = [
    body("first_name", "First name required.")
        .trim()
        .isLength({ min: 1 })
        .escape(), body("family_name", "Family name required")
        .trim()
        .isLength({ min: 1 })
        .escape(),
];

const validateAuthorDates = [
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(), body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
];

const validateAuthor = [...validateAuthorName, ...validateAuthorDates];

// for books, genres
const escapeButNotQuotes = (val) => val.replace(/[&<>{}]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "{": "&#123;", "}": "&#125;",
})[char]);

const validateBook = [
    body("title", "Title required").trim().isLength({ min: 1 }).escape(), body("author", "Author required").trim().isLength({ min: 1 }).escape(), body("summary", "Summary required").trim().isLength({ min: 1 }).customSanitizer(escapeButNotQuotes), body("isbn", "ISBN required").trim().isLength({ min: 1 }).escape(), body("genre.*").escape(), // genre is an array
];

const validateGenre = [
    body("name", "Genre must be at least 3 characters")
        .trim()
        .isLength({ min: 3 })
        .customSanitizer(escapeButNotQuotes),
];

const validateBookInstance = [
    body("book", "Book required").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint required")
        .trim()
        .isLength({ min: 1 })
        .escape(), body("status").escape(),
    body("due back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
];

module.exports = { validateAuthor, validateBook, validateGenre, validateBookInstance };