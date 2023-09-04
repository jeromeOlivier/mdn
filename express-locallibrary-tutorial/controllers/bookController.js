// external
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
// internal
const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { validateBook } = require("../utils/validators");

const index = asyncHandler(async (req, res, next) => {
    const [
        numBooks, numBookInstances, numAvailableBookInstances, numAuthors, numGenres,
    ] = await Promise.all([
        Book.countDocuments({}).exec(), BookInstance.countDocuments({}).exec(), BookInstance.countDocuments({ status: "Available" }).exec(), Author.countDocuments({}).exec(), Genre.countDocuments({}).exec(),
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

/** CREATE **/
// Display book create form on GET.
const book_create_get = asyncHandler(async (req, res, next) => {
    // get all authors and genres to add them to books
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().exec(), Genre.find().exec(),
    ]);
    res.render("book_form", {
        title: "Create Book", authors: allAuthors, genres: allGenres,
    });
});

// Handle book creation in three steps
const book_create_post = [
    // first, convert genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") req.body.genre = []; else req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // second, validate and sanitize the fields
    validateBook, // third, process the request
    asyncHandler(async (req, res, next) => {
        // extract errors from step two if there are any
        const errors = validationResult(req);
        // create a new book object (valid or not, doesn't matter)
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });

        // if errors exist, re-render form with sanitized values + error
        // message(s)
        if (!errors.isEmpty()) {
            // get author and genre
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().exec(), Genre.find().exec(),
            ]);

            // Mark selected genres as checked.
            for (const genre of allGenres) {
                if (book.genre.includes(genre._id)) {
                    genre.checked = "true";
                }
            }
            res.render("book_form", {
                title: "Create Book", authors: allAuthors, genres: allGenres, book: book, errors: errors.array(),
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

/** READ **/
// Display list of all books.
const book_list = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title author")
        .sort({ title: 1 })
        .populate("author")
        .exec();

    res.render("book_list", { title: "Book List", book_list: allBooks });
});

// Display detail page for a specific book.
const book_detail = asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id)
            .populate("author")
            .populate("genre")
            .exec(), BookInstance.find({ book: req.params.id }).exec(),
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

/** UPDATE **/
// Display book update form on GET.
const book_update_get = asyncHandler(async (req, res, next) => {
    // get book and associated author and genres
    const [book, allAuthors, allGenres] = await Promise.all([
        Book.findById(req.params.id)
            .populate("author")
            .populate("genre")
            .orFail(new Error("Book not found")), Author.find().orFail(new Error("Author not found")), Genre.find().orFail(new Error("Genre not found")),
    ]);

    // loop through genres and check book genres
    for (const genre of allGenres) {
        for (const book_g of book.genre) {
            if (genre._id.toString() === book_g._id.toString()) {
                genre.checked = "true";
            }
        }
    }

    res.render("book_form", {
        title: "Update Book", authors: allAuthors, genres: allGenres, book: book,
    });
});

// Handle book update on POST.
const book_update_post = [
    // convert genre field to an array of genres
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

        // create a book object with escaped / trimmed data and old id
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
            _id: req.params.id, // required, or new id assigned
        });

        if (!errors.isEmpty()) {
            // if there are errors, repopulate form with sanitized values
            // and error messages
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().exec(), Genre.find().exec(),
            ]);

            // loop and check selected genres
            for (const genre of allGenres) {
                if (book.genre.indexOf(genre._id) > -1) {
                    genre.checked = "true";
                }
            }
            res.render("book_form", {
                title: "Update Book", authors: allAuthors, genres: allGenres, book: book, errors: errors.array(),
            });
        } else {
            // data from form is valid, update the record
            const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
            // redirect to book detail page
            res.redirect(updatedBook.url);
        }
    }),
];

/** DELETE **/
// Display book delete form on GET.
const book_delete_get = asyncHandler(async (req, res, next) => {
    // find related book instances
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(), BookInstance.find({ book: req.params.id }, "imprint status").exec(),
    ]);

    if (book === null) res.redirect("/catalog/books"); // no results

    res.render("book_delete", {
        title: "Delete Book", book: book, book_instances: bookInstances,
    });
});

// Handle book delete on POST.
const book_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of book and all book instances (in parallel)
    const [bookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }, "imprint, status").exec(),
    ]);

    if (bookInstances.length > 0) {
        // book has book instances, inform user
        res.render("book_delete", {
            title: "Delete Book", book: book, book_instances: bookInstances,
        });
    } else {
        // if book has no book instances, attempt deletion
        try {
            console.log("book id:", req.body.bookid);
            await Book.findByIdAndRemove(req.body.bookid);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
        res.redirect("/catalog/books");
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
