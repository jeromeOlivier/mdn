const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define schema for author
const AuthorSchema = new Schema({
  first_name: {type: String, required: true, max: 100},
  family_name: {type: String, required: true, max: 100},
  date_of_birth: {type: Date},
  date_of_death: {type: Date},
});

// Virtual for author's full name
AuthorSchema.virtual('name').get(function () {
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = `${this.family_name}, ${this.first_name}`;
  }
  return fullname;
});

// Virtual for author's lifespan
AuthorSchema.virtual('lifespan').get(function () {
  let lifespan = "";
  if (this.date_of_birth && this.date_of_death) {
    lifespan = `${this.date_of_birth.toLocaleDateString()} - ${this.date_of_death.toLocaleDateString()}`;
  }
  return lifespan;
});

// Virtual for author's URL
AuthorSchema.virtual('url').get(function () {
  return `/catalog/author/${this._id}`;
});

// Export model
module.exports = mongoose.model('Author', AuthorSchema, 'authors');
