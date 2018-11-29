'use strict';

const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name : { 
    type : String, 
    required: true, 
    unique: true
  } 
});

//Add `createdAt` and `updatedAt`fields
folderSchema.set('timestamps', true);

// Customize output for `res.json(data)`, `console.log(data)` etc
folderSchema.set('toJSON', {
  virtuals: true, //include built-in virtual id
  transform: (doc, ret) => { //what is ret? https://mongoosejs.com/docs/api.html#document_Document-toJSON
    delete ret._id; // delete `_id`
    delete ret.__v;
  }
});

module.exports = mongoose.model('Folder', folderSchema);