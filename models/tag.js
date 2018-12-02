'use strict';

const mongoose = require('mongoose');

const tagsSchema = new mongoose.Schema({
  name : {
    type: String, 
    required: true,
    unique: true
  }
});

tagsSchema.set('timestamps', true);

tagsSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Tag', tagsSchema);