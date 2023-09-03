// external
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
// internal
const Book = require("../models/book");
const BookInstance = require("../models/bookinstance");

/** CREATE **/
// Display BookInstance create form on GET.
const bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title").exec();

    res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
    });
});

// Handle BookInstance create on POST in two steps
const bookinstance_create_post = [
    // first: validate and sanitize the data
    body("book", "Book required").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint required").trim().isLength({ min: 1 }).escape(),
    body("status").escape(),
    body("due back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    // second: process the request
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors if any
        const errors = validationResult(req);

        // Create a bookinstance object with escaped and trimmed data
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            // If there are errors, render form again with sanitized values and error messages
            const allBooks = await Book.find({}, "title").exec();

            res.render("bookinstance_form", {
                title: "Create BookInstance",
                book_list: allBooks,
                selected_books: bookInstance.book._id,
                errors: errors.array(),
                bookInstance: bookInstance,
            });
            return;
        } else {
            // if data is valid, save the new instance
            try {
                await bookInstance.save();
                res.redirect(bookInstance.url);
            } catch (e) {
                throw new Error(e);
            }
        }
    }),
];

/** READ **/
// Display list of all BookInstances.
const bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate("book").exec();

    res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: allBookInstances,
    });
});

// Display detail page for a specific BookInstance.
const bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();

    if (bookInstance === null) {
        // no results
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_detail", {
        title: "Book:",
        bookinstance: bookInstance,
    });
});

/** UPDATE **/
// todo: Display BookInstance update form on GET.
const bookinstance_update_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance update GET");
});

// todo: Handle bookinstance update on POST.
const bookinstance_update_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance update POST");
});

/** DELETE **/
// todo: Display BookInstance delete form on GET.
const bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance delete GET");
});

// todo: Handle BookInstance delete on POST.
const bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: BookInstance delete POST");
});

module.exports = {
    bookinstance_list,
    bookinstance_detail,
    bookinstance_create_get,
    bookinstance_create_post,
    bookinstance_delete_get,
    bookinstance_delete_post,
    bookinstance_update_get,
    bookinstance_update_post,
};
