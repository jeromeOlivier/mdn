// Purpose: Handle requests relating to Author model
//
// Methods:
//     * CREATE
//     - author_create_get: display author create form on GET
//     - author_create_post: handle author creation on POST
//     * READ
//     - author_list: display list of all authors
//     - author_detail: display detail page for a specific author
//     * UPDATE
//     - author_update_get: display author update form on GET
//     - author_update_post: handle author update on POST
//     * DELETE
//     - author_delete_get: display author delete form on GET
//     - author_delete_post: handle author deletion on POST
//
// Notes:
//     - author_create_post and author_update_post are middleware arrays
//     - author_create_post and author_update_post are composed of three steps:
//         1. validate and sanitize the fields
//         2. return form if errors are found
//         3. save author to database
//     - author_delete_post is composed of two steps:
//         1. get relevant data and author delete page
//         2. delete author

// EXTERNAL DEPENDENCIES
const { validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const debug = require("debug")("author");
const { DateTime } = require("luxon");

// INTERNAL DEPENDENCIES
const Author = require("../models/author");
const Book = require("../models/book");
const { generateAuthor, formatDate } = require("../utils/generators");
const {
    validateAuthor, isInTheFuture, isBirthBeforeDeath,
} = require("../utils/validators");

// CREATE
// GET Author Form
const author_create_get = asyncHandler(async (req, res, next) => {
    const newAuthor = await new Author();
    res.render("author_form",
        {
            title: "Create Author",
            author: newAuthor,
        });
});

// POST New Author
const author_create_post = [
    // 1. validate and sanitize fields
    validateAuthor,
    asyncHandler(async (req, res, next) => {
        // get validation errors from express-validator
        const formValidationErrors = validationResult(req);

        // sanity check for birth and death dates
        /** @type {String[]} */
        const dateOf = {
            birth: req.body.date_of_birth,
            death: req.body.date_of_death,
        };
        let date = isInTheFuture(dateOf.birth, "Date of birth");
        if (date.isAfterToday) formValidationErrors.errors.push(date.errorMessage);
        date = isInTheFuture(dateOf.death, "Date of death");
        if (date.isAfterToday) formValidationErrors.errors.push(date.errorMessage);
        date = isBirthBeforeDeath(dateOf.birth, dateOf.death);
        if (date.isWrongOrder) formValidationErrors.errors.push(date.errorMessage);

        // generate author object
        /** @type {Author} */
        const author = generateAuthor(req);

        // 2. if errors exist, re-render form with messages & sanitized values
        if (!formValidationErrors.isEmpty()) {
            debug(`errors on validation ${ formValidationErrors }`);
            res.status(422).render("author_form",
                {
                    title: "Create Author",
                    author: author,
                    errors: formValidationErrors.array(),
                });
            // 3. if no errors, save author to database
        } else {
            try {
                // save author to database
                await author.save();
                res.redirect(author.url);
                // if save fails, pass error to client
            } catch (e) { // if save fails...
                // Pass error to client
                res.status(500).render("error_page", {
                    error: e.message, title: "Database Error",
                });
            }
        }
    }),
];

// READ
// Display list of all authors
const author_list = asyncHandler(async (req, res, next) => {
    /** @type {Author[]} */
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
    res.render("author_list",
        {
            title: "Author List",
            author_list: allAuthors,
        });
});

// Display detail page for a specific Author.
const author_detail = asyncHandler(async (req, res, next) => {
    // get details of author and books in parallel
    /** @type {[Author, Book[]]} */
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    console.log('author object:', author);

    if (author === null) {
        // No results
        return res.status(404).render("error_page",
            {
                error: "Author not found",
                title: "Author Not Found",
            });
    }

    // Render page
    res.render("author_detail",
        {
            title: "Author Detail",
            author: author,
            author_books: allBooksByAuthor,
        });
});

// UPDATE
// Display Author update form on GET
const author_update_get = asyncHandler(async (req, res, next) => {
    const author = await Author.findById(req.params.id);
    /** @type {Author} */
    res.render("author_form",
        {
            title: "Author Form",
            author: author,
        });
});

// Handle Author update on POST
const author_update_post = [
    // 1. validate and sanitize fields
    validateAuthor,
    asyncHandler(async (req, res, next) => {
        // get validation errors from express-validator
        const formValidationErrors = validationResult(req);

        // sanity check for birth and death dates
        /** @type {String[]} */
        const dateOf = {
            birth: req.body.date_of_birth,
            death: req.body.date_of_death,
        };
        let check = isInTheFuture(dateOf.birth, "Date of birth");
        if (check.isAfterToday) formValidationErrors.errors.push(check.errorMessage);
        check = isInTheFuture(dateOf.death, "Date of death");
        if (check.isAfterToday) formValidationErrors.errors.push(check.errorMessage);
        check = isBirthBeforeDeath(dateOf.birth, dateOf.death);
        if (check.isWrongOrder) formValidationErrors.errors.push(check.errorMessage);

        // generate author object
        /** @type {Author} */
        const author = generateAuthor(req);
        // attach the author's id as this is an update
        author._id = req.params.id;

        if (!formValidationErrors.isEmpty()) {
            // if there were errors, go back to the form with the sanitized data
            res.render("author_form",
                {
                    title: "Update Author",
                    author: author,
                    errors: formValidationErrors.errors,
                });
        } else {
            // if there were no errors, update the author
            try {
                await Author.findByIdAndUpdate(req.params.id, author, {});
                console.log("author updated");
                res.redirect(author.url);
            } catch (e) {
                // if the update fails, pass the error to the client
                res.status(500).render("error_page",
                    {
                        error: e.message,
                        title: "Database Error",
                    });
            }
        }
    }),
];

// DELETE
// Display Author delete form on GET.
const author_delete_get = asyncHandler(async (req, res, next) => {
    /** @type {[Author, Book[]]} */
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
        res.redirect("/catalog/authors");
    }

    res.render("author_delete",
        {
            title: "Delete Author",
            author: author,
            author_books: allBooksByAuthor,
        });
});

// Handle Author delete on POST.
const author_delete_post = asyncHandler(async (req, res, next) => {
    /** @type {[Author, Book[]]} */
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (allBooksByAuthor.length > 0) {
        // author has books, inform user
        res.render("author_delete",
            {
                title: "Delete Author",
                author: author,
                author_books: allBooksByAuthor,
            });
    } else {
        // if author has no books, attempt deletion
        try {
            await Author.findByIdAndRemove(req.body.authorid);
            res.redirect("/catalog/authors");
        } catch (e) {
            res.status(500).render("error_page",
                {
                    error: e.message,
                    title: "Database Error",
                });
        }
    }
});

module.exports = {
    author_list,
    author_detail,
    author_create_get,
    author_create_post,
    author_delete_get,
    author_delete_post,
    author_update_get,
    author_update_post,
};
