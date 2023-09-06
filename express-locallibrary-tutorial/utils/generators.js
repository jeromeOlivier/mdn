const Author = require("../models/author");
const Book = require("../models/book");

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

// const generateBook = (req) => {
//     return new Book({});
// };
//
// const generateBookInstance = (req) => {};
//
// const generateGenre = (req) => {};

module.exports = { generateAuthor };