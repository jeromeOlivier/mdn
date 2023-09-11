const Author = require("../models/author");
const Book = require("../models/book");
const BookInstance = require("../models/bookinstance");

/**
 * Generates an author object
 * @param {Object} req - Request object containing author data
 * @returns {Author} - new author object
 */
const generateAuthor = (req) => {
    return new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
    });
};

/**
 * Formats a date object to a string
 * @param date
 * @returns {string}
 */
const formatDate = (date) => date.toISOString().split("T")[0];

/**
 * Generates a book object
 * @param {Object} req - Request object containing book data
 * @returns {Book} - new book object
 * @warning - method does not generate ids
 */
const generateBook = (req) => {
    return new Book({
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: req.body.genre,
    });
};

/**
 * Generates a book instance object
 * @param {Object} req - Request object containing book instance data
 * @returns {BookInstance} - new book object
 * @warning - method does not generate ids
 */
const generateBookInstance = (req) => {
    return new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
    });
};

// const generateGenre = (req) => {};

module.exports = {
    generateAuthor,
    formatDate,
    generateBook,
    generateBookInstance,
};