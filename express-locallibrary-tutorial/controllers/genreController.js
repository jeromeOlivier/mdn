const Genre = require("../models/genre");
const Book = require("../models/book");
const Mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
const genre_list = asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find().sort({ name: 1 }).exec();
    res.render("genre_list", { title: "Genre List", genre_list: allGenres });
});

// Display detail page for a specific Genre.
const genre_detail = asyncHandler(async (req, res, next) => {
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, "title summary").exec(),
    ]);
    if (genre === null) {
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
    }
    res.render("genre_detail", {
        title: `Genre: ${genre.name}`,
        genre: genre,
        genre_books: booksInGenre,
    });
});

// Display Genre create form on GET.
const genre_create_get = asyncHandler(async (req, res, next) => {
    res.render("genre_form", { title: "Create Genre" });
});

// Handle Genre create on POST.
const genre_create_post = [
    // Validate and sanitize the name field.
    body("name", "Genre must be at least 3 characters")
        .trim()
        .isLength({ min: 3 })
        .escape(),
    // Process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        const genre = new Genre({ name: req.body.name });

        // if there are errors, render the form again with sanitized values & error messages
        if (!errors.isEmpty()) {
            res.render("genre_form", {
                title: "Create Genre",
                genre: genre,
                errors: errors.array(),
            });
            return;
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

// Display Genre delete form on GET.
const genre_delete_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Genre delete GET");
});

// Handle Genre delete on POST.
const genre_delete_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Genre delete POST");
});

// Display Genre update form on GET.
const genre_update_get = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Genre update GET");
});

// Handle Genre update on POST.
const genre_update_post = asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: Genre update POST");
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
