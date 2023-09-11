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
AuthorSchema.virtual("name").get(function() {
    let fullname = "";
    if (this.first_name && this.family_name) {
        fullname = `${ this.family_name }, ${ this.first_name }`;
    }
    return fullname;
});

// Virtual for author's lifespan
AuthorSchema.virtual("lifespan").get(function() {
    // format dates, avoid date slippage
    const birth = this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth)
                                               .toUTC()
                                               .toLocaleString(DateTime.DATE_MED) : "";
    const death = this.date_of_death ? DateTime.fromJSDate(this.date_of_death)
                                               .toUTC()
                                               .toLocaleString(DateTime.DATE_MED) : "";

    if (this.date_of_birth && this.date_of_death) {
        return `${ birth } - ${ death }`;
    } else if (this.date_of_birth !== undefined) {
        return `${ birth } -`;
    } else {
        return "";
    }
});

AuthorSchema.virtual("date_of_birth_formatted").get(function() {
    return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth)
                                        .toLocaleString(DateTime.DATE_MED) : "";
});
AuthorSchema.virtual("date_of_death_formatted").get(function() {
    return this.date_of_death ? DateTime.fromJSDate(this.date_of_death)
                                        .toLocaleString(DateTime.DATE_MED) : "";
});
AuthorSchema.virtual("age").get(function() {
    const now = (this.date_of_death) ? this.date_of_death : new Date();
    if (this.date_of_birth) {
        const age = Math.floor((now - this.date_of_birth) / 1000 / 60 / 60 / 24 / 365);
        return `${ age } yrs`;
    } else return "";
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function() {
    return `/catalog/author/${ this._id }`;
});

// Export model
module.exports = mongoose.model("Author", AuthorSchema, "authors");
