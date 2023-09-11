// Purpose: Handle book-related requests
//
// Methods:
//     - index: display home page
//     * CREATE
//     - book_create_get: display book create form on GET
//     - book_create_post: handle book creation on POST
//     * READ
//     - book_list: display list of all books
//     - book_detail: display detail page for a specific book
//     * UPDATE
//     - book_update_get: display book update form on GET
//     - book_update_post: handle book update on POST
//     * DELETE
//     - book_delete_get: display book delete form on GET
//     - book_delete_post: handle book deletion on POST
//
// Notes:
//     - book_create_post and book_update_post are middleware arrays
//     - book_create_post and book_update_post are composed of three steps:
//         1. update req object: convert genre field to an array of genres
//         2. validate and sanitize the fields
//         3. process request after validation and sanitization
//     - book_delete_post is composed of two steps:
//         1. get relevant data and book delete page
//         2. delete book
//
// EXTERNAL DEPENDENCIES
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// INTERNAL DEPENDENCIES
const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { validateBook } = require("../utils/validators");
const { generateBook } = require("../utils/generators");

// INDEX PAGE
const index = asyncHandler(async (req, res, next) => {
    /** @type {Number[]} */
    const [
        numBooks, numBookInstances, numAvailableBookInstances, numAuthors, numGenres,
    ] = await Promise.all([
        Book.countDocuments({}).exec(),
        BookInstance.countDocuments({}).exec(),
        BookInstance.countDocuments({ status: "Available" }).exec(),
        Author.countDocuments({}).exec(),
        Genre.countDocuments({}).exec(),
    ]);
    res.render("index", {
        title: "Local Library Home",
        book_count: numBooks,
        book_instance_count: numBookInstances,
        book_instance_available_count: numAvailableBookInstances,
        author_count: numAuthors,
        genre_count: numGenres,
    });
});

// CREATE
// Display book create form on GET.
const book_create_get = asyncHandler(async (req, res, next) => {
    /** @type {Author[], Genre[]} */
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().exec(),
        Genre.find().exec(),
    ]);
    res.render("book_form", {
        title: "Create Book", authors: allAuthors, genres: allGenres,
    });
});

// Handle book creation in three steps
const book_create_post = [
    (req, res, next) => {
        // first, if genre is not an array, convert it to one
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") req.body.genre = [];
        } else {
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // second, validate and sanitize all fields
    validateBook,

    // third, process the request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const book = generateBook(req);

        // if there are errors, re-render form with sanitized values & error
        // messages
        if (!errors.isEmpty()) {
            /** @type {Author[], Genre[]} */
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().exec(),
                Genre.find().exec(),
            ]);

            // Mark selected genres as checked.
            for (const genre of allGenres) {
                if (book.genre.includes(genre._id)) {
                    genre.checked = "true";
                }
            }
            res.render("book_form", {
                title: "Create Book",
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            });
            await book.save();
            res.redirect(book.url);
        } else {
            // if data is valid, save the book
            await book.save();
            res.redirect(book.url);
        }
    }),
];

// READ
// Display list of all books.
const book_list = asyncHandler(async (req, res, next) => {
    /** @type {Book[]} */
    const allBooks = await Book.find({}, "title author")
                               .sort({ title: 1 })
                               .populate("author")
                               .exec();

    res.render("book_list", { title: "Book List", book_list: allBooks });
});

// Display detail page for a specific book.
const book_detail = asyncHandler(async (req, res, next) => {
    /** @type {[Book, BookInstance[]]} */
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id)
            .populate("author")
            .populate("genre")
            .exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ]);

    if (book === null) {
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
    }

    res.render("book_detail", {
        title: book.title, book: book, book_instances: bookInstances,
    });
});

// UPDATE
// GET book update form
const book_update_get = asyncHandler(async (req, res, next) => {
    /** @type {[Book, Author[], Genre[]]} */
    const [book, author, allGenres] = await Promise.all([
        Book.findById(req.params.id)
            .populate("author")
            .populate("genre")
            .orFail(new Error("Book not found")),
        Author.find().orFail(new Error("Author not found")),
        Genre.find().orFail(new Error("Genre not found")),
    ]);

    // loop through genres and check book genres
    for (const genre of allGenres) {
        for (const g of book.genre) {
            if (genre._id.toString() === g._id.toString()) {
                genre.checked = "true";
            }
        }
    }
    console.log(book);
    res.render("book_form", {
        title: "Update Book",
        authors: author,
        genres: allGenres,
        book: book,
    });
});

// POST book update
const book_update_post = [
    // update req object: convert genre field to an array of genres
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    // validate and sanitize the fields
    validateBook,
    // process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);
        // create new book object with escaped / trimmed data and old id
        const book = generateBook(req);
        book._id = req.params.id;
        // if there are errors, resend form w/ sanitized values & error messages
        // or else update the record
        if (!errors.isEmpty()) {
            const [author, allGenres] = await Promise.all([
                Author.find().exec(),
                Genre.find().exec(),
            ]);

            // loop and check selected genres
            for (const genre of allGenres) {
                if (book.genre.indexOf(genre._id) > -1) {
                    genre.checked = "true";
                }
            }
            console.log(book);
            res.render("book_form", {
                title: "Update Book",
                authors: author,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            });
        } else {
            /** @type {Book} */
            const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
            res.redirect(updatedBook.url);
        }
    }),
];

// DELETE
// GET relevant data and book delete page
const book_delete_get = asyncHandler(async (req, res, next) => {
    /** @type {[Book, BookInstance[]]} */
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }, "imprint status").exec(),
    ]);
    // if book not found, redirect to book list
    if (book === null) res.redirect("/catalog/books");
    // else render book delete page
    res.render("book_delete", {
        title: "Delete Book", book: book, book_instances: bookInstances,
    });
});

// POST book delete
const book_delete_post = asyncHandler(async (req, res, next) => {
    /** @type {[Book, BookInstance[]]} */
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }, "imprint, status").exec(),
    ]);
    // if book has book instances, render book delete page
    // else delete book
    if (bookInstances.length > 0) {
        res.render("book_delete", {
            title: "Delete Book", book: book, book_instances: bookInstances,
        });
    } else {
        try {
            await Book.findByIdAndRemove(req.body.bookid);
            res.redirect("/catalog/books");
        } catch (e) {
            res.status(500).render("error_page", {
                error: e.message, title: "Database Error",
            });
        }
    }
});

module.exports = {
    index,
    book_list,
    book_detail,
    book_create_get,
    book_create_post,
    book_delete_get,
    book_delete_post,
    book_update_get,
    book_update_post,
};
