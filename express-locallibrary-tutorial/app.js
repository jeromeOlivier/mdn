// Purpose: Main entry point for the application.
//
// Notes:
//     - This file is the main entry point for the application.
//     - It sets up the Express application, connects to MongoDB using Mongoose,
//       and establishes the routes.

// EXTERNAL DEPENDENCIES
const createError = require("http-errors");
const express = require("express");
const favicon = require("serve-favicon");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const env = require("dotenv");
const compression = require("compression");
const helmet = require("helmet");

// INTERNAL DEPENDENCIES
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const catalogRouter = require("./routes/catalog");

// Fetch ENV variables for MongoDB
env.config();
const MONGO_HOST = process.env.MONGO_HOST;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_USER = process.env.MONGO_USER;

if (!MONGO_HOST || !MONGO_PASSWORD || !MONGO_USER) {
    console.error("MongoDB environment variables not set!");
    process.exit(-1);
}

// Database: MongoDB
mongoose.set("strictQuery", false);
const mongoDB = `mongodb+srv://${ MONGO_USER }:${ MONGO_PASSWORD }@${ MONGO_HOST }/?retryWrites=true&w=majority`;

let mongooseConnectionAttempts = 0;

// Mongooose connection using an IIFE with a recursive retry set to 5 attempts
(async function connectWithRetry () {
    try {
        await mongoose.connect(mongoDB, {
            useNewUrlParser: true, useUnifiedTopology: true,
        });
    } catch (err) {
        mongooseConnectionAttempts++;
        if (mongooseConnectionAttempts < 5) {
            console.log(`Failed to connect to MongoDB on startup - retrying in 5 sec. ${ err }`);
            setTimeout(connectWithRetry, 5000);
        } else {
            console.log(`Failed to connect to MongoDB on startup. ${ err }`);
            process.exit(-1);
        }
    }
    console.log(`Connected to MongoDB v${ mongoose.version }`);
})();

// Express app
const app = express();

// View engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Rate limiter: max of fifty requests per minute
const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50,
});
app.use(limiter);

// Middlewares and static files
app.use(favicon(path.join(__dirname, "public/images", "fav.png")));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(compression());
// Add helmet to the middleware chain.
// Set CSP headers to allow our Bootstrap and Jquery to be served.
app.use(helmet.contentSecurityPolicy({
    directives: {
        "script-src": [
            "'self'",
            "code.jquery.com",
            "cdn.jsdelivr.net",
        ],
    },
}));

// establish routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/catalog", catalogRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)));

// centralized error handler (middleware)
app.use((err, req, res, next) => {
    // // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    console.log(err.stack);
    // render the error page
    res.status(err.status || 500);
    res.render("error_page");
});

module.exports = app;
