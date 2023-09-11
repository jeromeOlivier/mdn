// Purpose: Handle requests related to BookInstance objects
//
// Methods:
//     * CREATE
//     - bookinstance_create_get: display bookinstance create form on GET
//     - bookinstance_create_post: handle bookinstance creation on POST
//     * READ
//     - bookinstance_list: display list of all bookinstances
//     - bookinstance_detail: display detail page for a specific bookinstance
//     * UPDATE
//     - bookinstance_update_get: display bookinstance update form on GET
//     - bookinstance_update_post: handle bookinstance update on POST
//     * DELETE
//     - bookinstance_delete_get: display bookinstance delete form on GET
//     - bookinstance_delete_post: handle bookinstance deletion on POST
//
// Notes:
//     - bookinstance_create_post and bookinstance_update_post are middleware
//       arrays
//     - bookinstance_create_post and bookinstance_update_post are composed
//       of three steps:
//          1. validate and sanitize the fields
//          2. process request after validation and sanitization
//          3. handle errors
//     - bookinstance_delete_post is composed of two steps:
//          1. get relevant data and bookinstance delete page
//          2. delete bookinstance

// EXTERNAL DEPENDENCIES
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// INTERNAL DEPENDENCIES
const Book = require("../models/book");
const Author = require("../models/author");
const BookInstance = require("../models/bookinstance");
const { validateBookInstance } = require("../utils/validators");
const { generateBookInstance } = require("../utils/generators");

// CREATE
// Display BookInstance create form on GET.
const bookinstance_create_get = asyncHandler(async (req, res, next) => {
    /** @type {Book[]} */
    const allBooks = await Book.find({}, "title").exec();

    res.render("bookinstance_form", {
        title: "Create BookInstance", book_list: allBooks,
    });
});

// Handle BookInstance create on POST in two steps
const bookinstance_create_post = [
    // first: validate and sanitize the data
    validateBookInstance,

    // second: process the request
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors if any
        const errors = validationResult(req);

        // Create a bookinstance object with escaped and trimmed data
        const bookInstance = generateBookInstance(req);

        // third: handle errors
        if (!errors.isEmpty()) {
            /** @type {Book[]} */
            const allBooks = await Book.find({}, "title").exec();

            res.render("bookinstance_form", {
                title: "Create BookInstance",
                book_list: allBooks,
                selected_books: bookInstance.book._id,
                errors: errors.array(),
                bookInstance: bookInstance,
            });

        } else {
            // if data is valid, save the new instance
            try {
                await bookInstance.save();
                res.redirect(bookInstance.url);
            } catch (e) {
                res.status(500).render("error_page", {
                    error: e.message, title: "Database Error",
                });
            }
        }
    }),
];

// READ
// Display list of all BookInstances.
const bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate("book").exec();

    res.render("bookinstance_list", {
        title: "Book Instance List", bookinstance_list: allBookInstances,
    });
});

// Display detail page for a specific BookInstance.
const bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
                                           .populate("book")
                                           .exec();

    console.log(bookInstance);
    if (bookInstance === null) {
        // no results
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_detail", {
        title: "Book:", bookinstance: bookInstance,
    });
});

// UPDATE
// Display BookInstance update form on GET.
const bookinstance_update_get = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
                                           .populate("book")
                                           .orFail(new Error("Book Instance not found"));
    const allBooks = await Book.find({}, "title").exec();

    res.render("bookinstance_form", {
        title: "Update BookInstance",
        bookinstance: bookInstance,
        book_list: allBooks,
    });
});

// Handle bookinstance update on POST.
const bookinstance_update_post = [
    validateBookInstance,

    asyncHandler(async (req, res, next) => {
        // extract validation errors
        const errors = validationResult(req);

        // create bookinstance object and add id
        const bookInstance = generateBookInstance(req);
        bookInstance._id = req.params.id;

        if (!errors.isEmpty()) {
            const allBooks = await Book.find({}, "title").exec();
            res.render("bookinstance_form", {
                book_list: allBooks, bookinstance: bookInstance,
            });
        } else {
            const updatedBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
            res.redirect(updatedBookInstance.url);
        }
    }),
];

// DELETE
// Display BookInstance delete form on GET.
const bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    // confirm that the sent id actually corresponds to something in the
    // database
    const bookInstance = await BookInstance.findById(req.params.id).exec();
    // if it doesn't, go back to the list of book instances
    if (bookInstance === null) res.redirect("/catalog/bookinstances");
    // if it does, go to the deletion confirmation page
    res.render("bookinstance_delete", {
        title: "Delete Book Instance", book_instance: bookInstance,
    });
});

// Handle BookInstance delete on POST.
const bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    /** @type {BookInstance} */
    const bookInstance = await BookInstance.findById(req.body.bookinstanceid);
    // if book instance no longer exists...
    if (bookInstance === null) {
        res.redirect("/catalog/bookinstances");
    } else {
        try {
            await BookInstance.findByIdAndRemove(bookInstance._id).exec();
            res.redirect("/catalog/bookinstances");
        } catch (e) {
            res.status(500).render("error_page", {
                error: e.message, title: "Database Error",
            });
        }
    }
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
