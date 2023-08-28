const mongoose = require('mongoose');

const GenreSchema = new mongoose.Schema({
  name: { type: String, required: true, min: 3, max: 100 }
});

GenreSchema.virtual('url').get(function () {
  return `/catalog/genre/${ this._id }`;
});

// export model
module.exports = mongoose.model('Genre', GenreSchema, 'genres');
