// external
const asyncHandler = require("express-async-handler");
// internal
const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { isLength } = require("validator");
const { body, validationResult } = require("express-validator");

const index = asyncHandler(async (req, res, next) => {
    const [
        numBooks,
        numBookInstances,
        numAvailableBookInstances,
        numAuthors,
        numGenres,
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
            .exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ]);

    if (book === null) {
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
    }

    res.render("book_detail", {
        title: book.title,
        book: book,
        book_instances: bookInstances,
    });
});

// Display book create form on GET.
const book_create_get = asyncHandler(async (req, res, next) => {
    // get all authors and genres to add them to books
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().exec(),
        Genre.find().exec(),
    ]);
    res.render("book_form", {
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
    });
});

// Handle book creation in three steps
const book_create_post = [
    // first, convert genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") req.body.genre = [];
            else req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // second, validate and sanitize the fields
    body("title")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Title required"),
    body("author", "Author required").trim().isLength({ min: 1 }).escape(),
    body("summary", "Summary required").trim().isLength({ min: 1 }).escape(),
    body("isbn", "ISBN required").trim().isLength({ min: 1 }).escape(),
    body("genre.*").escape(), // genre is an array

    // third, process the request
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

        // if errors exist, re-render form with sanitized values + error message(s)
        if (!errors.isEmpty()) {
            // get author and genre
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

// Display book delete form on GET.
const book_delete_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Book delete GET");
});

// Handle book delete on POST.
const book_delete_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Book delete POST");
});

// Display book update form on GET.
const book_update_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Book update GET");
});

// Handle book update on POST.
const book_update_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Book update POST");
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
