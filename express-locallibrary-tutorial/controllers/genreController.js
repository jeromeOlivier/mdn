// Purpose: Handle requests relating to Genre model
//
// Methods:
//     * CREATE
//     - genre_create_get: display genre create form on GET
//     - genre_create_post: handle genre creation on POST
//     * READ
//     - genre_list: display list of all genres
//     - genre_detail: display detail page for a specific genre
//     * UPDATE
//     - genre_update_get: display genre update form on GET
//     - genre_update_post: handle genre update on POST
//     * DELETE
//     - genre_delete_get: display genre delete form on GET
//     - genre_delete_post: handle genre deletion on POST
//
// Notes:
//     - genre_create_post and genre_update_post are middleware arrays
//     - genre_create_post and genre_update_post are composed of three steps:
//         1. validate and sanitize the fields
//         2. process request after validation and sanitization
//         3. update req object: convert genre field to an array of genres
//     - genre_delete_post is composed of two steps:
//         1. get relevant data and genre delete page
//         2. delete genre

// EXTERNAL DEPENDENCIES
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// INTERNAL DEPENDENCIES
const Genre = require("../models/genre");
const Book = require("../models/book");
const { validateGenre } = require("../utils/validators");

// CREATE
// Display Genre create form on GET.
const genre_create_get = asyncHandler(async (req, res, next) => {
    res.render("genre_form", { title: "Create Genre" });
});

// Handle Genre create on POST.
const genre_create_post = [
    // Validate and sanitize the name field.
    validateGenre, // Process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        const genre = new Genre({ name: req.body.name });

        // if there are errors, render the form again with sanitized values & error messages
        if (!errors.isEmpty()) {
            res.render("genre_form", {
                title: "Create Genre", genre: genre, errors: errors.array(),
            });
        } else {
            // data is valid
            // check if genre with same name already exists...
            const genreExists = await Genre.findOne({ name: req.body.name })
                .collation({ locale: "en", strength: 2 })
                .exec();
            if (genreExists) {
                // Genre exists, redirect to its details page
                res.redirect(genreExists.url);
            } else {
                try {
                    await genre.save();
                    // New genre saved. Redirect to genre detail page.
                    res.redirect(genre.url);
                } catch (e) {
                    throw new Error(e);
                }
            }
        }
    }),
];

// READ
// Display list of all Genre.
const genre_list = asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find().sort({ name: 1 }).exec();
    res.render("genre_list", { title: "Genre List", genre_list: allGenres });
});

// Display detail page for a specific Genre.
const genre_detail = asyncHandler(async (req, res, next) => {
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(), Book.find({ genre: req.params.id }, "title summary").exec(),
    ]);
    if (genre === null) {
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
    }
    res.render("genre_detail", {
        title: `Genre: ${ genre.name }`, genre: genre, genre_books: booksInGenre,
    });
});

// UPDATE
// Display Genre update form on GET.
const genre_update_get = asyncHandler(async (req, res, next) => {
    // get all books associated with the genre if there are any
    const genre = await Genre.findById(req.params.id).orFail(new Error("Genre not found"));
    res.render("genre_form", {
        title: "Update Genre", genre: genre,
    });
});

// Handle Genre update on POST.
const genre_update_post = [
    validateGenre, asyncHandler(async (req, res, next) => {
        // extract validation errors from request if any
        const errors = validationResult(req);
        // create new genre object with fresh data
        const genre = new Genre({
            name: req.body.name, _id: req.params.id,
        });
        // throw form back if validation failed
        if (!errors.isEmpty()) {
            res.render("genre_form", {
                title: "Update Genre", genre: genre, errors: errors.array(),
            });
        } else {
            // if update is valid
            const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
            // redirect to book detail page
            res.redirect(updatedGenre.url);
        }
    }),

];

// DELETE
// Display Genre delete form on GET.
const genre_delete_get = asyncHandler(async (req, res, next) => {
    // find related books
    const [books, genre] = await Promise.all([
        Book.find({ genre: req.params.id }).populate("author").exec(), Genre.findById(req.params.id).exec(),
    ]);
    // if there are no results
    if (genre === null) res.redirect("/catalog/genres");

    res.render("genre_delete", {
        title: "Delete Genre", genre: genre, books: books,
    });
});

// Handle Genre delete on POST.
const genre_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of genre and all book instances (in parallel)
    const [genre, books] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }).exec(),
    ]);

    if (books.length > 0) {
        // genre still has books associated to it
        res.render('genre_delete', {
            title: 'Delete Genre',
            genre: genre,
            books: books,
        });
    } else {
        // if genre has no books associated with it
        try {
            await Genre.findByIdAndRemove(req.body.genreid);
        } catch (e) {
            throw new Error(e);
        }
        res.redirect('/catalog/genres');
    }
});

module.exports = {
    genre_list,
    genre_detail,
    genre_create_get,
    genre_create_post,
    genre_delete_get,
    genre_delete_post,
    genre_update_get,
    genre_update_post,
};
