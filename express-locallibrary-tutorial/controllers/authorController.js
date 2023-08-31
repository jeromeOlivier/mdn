// external
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
// internal
const Author = require("../models/author");
const Book = require("../models/book");

// Display list of all authors
const author_list = asyncHandler(async (req, res, next) => {
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
    res.render("author_list", {
        title: "Author List",
        author_list: allAuthors,
    });
});

// Display detail page for a specific Author.
const author_detail = asyncHandler(async (req, res, next) => {
    // get details of author and books in parallel
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
        // No results
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    res.render("author_detail", {
        title: "Author Detail",
        author: author,
        author_books: allBooksByAuthor,
    });
});

// Display Author create form on GET.
const author_create_get = asyncHandler(async (req, res, next) => {
    res.render("author_form", { title: "Create Author" });
});

// Handle Author create on POST.
const author_create_post = [
    body("first_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("First name required.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Family name required")
        .isAlphanumeric()
        .withMessage("Family name has non alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    // process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);

        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.ody.date_of_birth,
            date_of_death: req.body.date_of_death,
        });

        if (!errors.isEmpty()) {
            // if there are errors, re-render form with sanitized values &
            // error messages
            res.render("author_form", {
                title: "Create Author",
                author: author,
                errors: errors.array(),
            });
        } else {
            try {
                // if form data is valid save author
                await author.save();
            } catch (e) {
                // if save fails for whatever reason
                throw new Error(e);
            }
        }
    }),
];

// Display Author delete form on GET.
const author_delete_get = asyncHandler(async (req, res, next) => {
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (author === null) {
        // no results
        res.redirect("/catalog/authors");
    }

    res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: allBooksByAuthor,
    });
});

// Handle Author delete on POST.
const author_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    if (allBooksByAuthor.length > 0) {
        // author has books, send user back
        res.render("author_delete", {
            title: "Delete Author",
            author: author,
            author_books: allBooksByAuthor,
        });
    } else {
        // if author has no books, attempt deletion
        try {
            console.log("request:", req.body);
            await Author.findByIdAndRemove(req.body.authorid);
        } catch (e) {
            throw new Error(e);
        }
        res.redirect("/catalog/authors");
    }
});

// Display Author update form on GET
const author_update_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Author update GET");
});

// Handle Author update on POST
const author_update_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Author update POST");
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
