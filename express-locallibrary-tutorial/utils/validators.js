const { body } = require("express-validator");

/* AUTHOR */
// validation rule for author names
/** @type {Object} */
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
/** @type {Object} */
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

/** @type {Object}
 *  @summary syntactic validation for author name and dates using
 *  express-validator
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

/** syntactic validation for book using express-validator
 * */
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
 * Check if a date is in the future.
 *
 * @param {string | number | Date} date - The input date as a string in a
 *     format accepted by the JavaScript `Date` constructor, a timestamp, or a
 *     `Date` instance.
 * @param {string} type - The type of date, used for error messaging.
 * @returns {object} An object with 'isAfterToday' boolean and 'message'
 *     string.
 */
const isInTheFuture = (date, type) => {
    const receivedDate = new Date(date);
    const now = new Date();
    const check = {
        isAfterToday: false,
        errorMessage: "",
    };
    if (isValidDate(receivedDate) && receivedDate > now) {
        check.isAfterToday = true;
        check.errorMessage = `${ type } cannot be in the future`;
        return check;
    }
    return check;

};

/**
 * Check if birth was before death. If either date is missing, assume true.
 * @param {string} birth - first date to check
 * @param {string} death - second date to check
 * @returns {Object} - An object with 'isWrong' boolean and 'message' string.
 * */
const isBirthBeforeDeath = (birth, death) => {
    const birthDate = new Date(birth);
    const deathDate = new Date(death);
    const check = {
        isWrong: false,
        message: "",
    };
    if (
        isValidDate(birthDate)
        && isValidDate(deathDate)
        && (birthDate > deathDate)
    ) {
        check.isWrong = true;
        check.message = "Date of birth cannot be after date of death";
        return check;
    }
    return check;
};

/**
 * Checks if a date is valid
 * @param date
 * @returns {boolean}
 */
const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.valueOf());
};

module.exports = {
    validateAuthor,
    validateBook,
    validateGenre,
    validateBookInstance,
    isInTheFuture,
    isBirthBeforeDeath,
};