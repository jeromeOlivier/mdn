const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Schema = mongoose.Schema;

// Define schema for author
const AuthorSchema = new Schema({
    first_name: { type: String, required: true, max: 100 },
    family_name: { type: String, required: true, max: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date },
});

// Virtual for author's full name
AuthorSchema.virtual("name").get(function () {
    let fullname = "";
    if (this.first_name && this.family_name) {
        fullname = `${this.family_name}, ${this.first_name}`;
    }
    return fullname;
});

// Virtual for author's lifespan
AuthorSchema.virtual("lifespan").get(function () {
    if (this.date_of_birth && this.date_of_death) {
        const death = DateTime.fromJSDate(this.date_of_death);
        const birth = DateTime.fromJSDate(this.date_of_birth);
        return death.diff(birth, ["years", "months", "days"]).toObject();
    } else if (this.date_of_birth !== undefined) {
        const now = DateTime.now();
        const birth = DateTime.fromJSDate(this.date_of_birth);
        return now.diff(birth, ["years", "months", "days"]).toObject();
    } else {
        return "data missing";
    }
});

AuthorSchema.virtual("date_of_birth_formatted").get(function () {
    return DateTime.fromJSDate(this.date_of_birth).toLocaleString(
        DateTime.DATE_MED
    );
});

AuthorSchema.virtual("date_of_death_formatted").get(function () {
    return DateTime.fromJSDate(this.date_of_death).toLocaleString(
        DateTime.DATE_MED
    );
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function () {
    return `/catalog/author/${this._id}`;
});

// Export model
module.exports = mongoose.model("Author", AuthorSchema, "authors");
