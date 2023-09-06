const { body } = require("express-validator");

/* AUTHOR */
// validation rule for author names
const validateAuthorName = [
    body("first_name", "First name required.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("family_name", "Family name required")
        .trim()
        .isLength({ min: 1 })
        .escape(),
];

// validation rule for author dates
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

/** syntactic validation for author name and dates using express-validator
 * */
const validateAuthor = [
    ...validateAuthorName,
    ...validateAuthorDates,
];

/* BOOK */
// sanitization rule for books, genres to replace <, >, &, {, }
const escapeButNotQuotes = (val) => val.replace(/[&<>{}]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "{": "&#123;", "}": "&#125;",
})[char]);

// validation rule for books
const validateBook = [
    body("title", "Title required")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "Author required")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("summary", "Summary required")
        .trim()
        .isLength({ min: 1 })
        .customSanitizer(escapeButNotQuotes),
    body("isbn", "ISBN required")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("genre.*")
        .escape(), // genre is an array
];

/* GENRE */
// validation rule for genres
const validateGenre = [
    body("name", "Genre must be at least 3 characters")
        .trim()
        .isLength({ min: 3 })
        .customSanitizer(escapeButNotQuotes),
];

/* BOOK INSTANCE */
// validation rule for book instances
const validateBookInstance = [
    body("book", "Book required")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("imprint", "Imprint required")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status")
        .escape(),
    body("due back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
];

/* HELPERS */
/**
 * Checks to see if a date is in the future
 * @param {string} date - takes a date string
 * @returns {Boolean} - true if date is in the future
 * */
const isInTheFuture = (date) => {
    const currentDate = new Date();
    return new Date(date) > currentDate;
};

/**
 * Check if birth was before death. If either date is missing, assume true.
 * @param {string} birth - first date to check
 * @param {string} death - second date to check
 * @returns {Boolean} - true if birth < death
 * */
const isBirthBeforeDeath = (birth, death) => {
    if (!birth || !death) return true;
    return new Date(birth) < new Date(death);
};

module.exports = {
    validateAuthor,
    validateBook,
    validateGenre,
    validateBookInstance,
    isInTheFuture,
    isBirthBeforeDeath,
};