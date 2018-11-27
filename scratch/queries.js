'use strict';

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

mongoose.connect(MONGODB_URI, { useNewUrlParser:true })
  .then(() => {
    const searchTerm = 'lady gaga';
    let filter = {};

    if (searchTerm) {
      filter.title = { $regex: searchTerm, $options: 'i' };
    }

    return Note.find(filter).sort({ updatedAt: 'desc' });
  })
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

/* Find note by id using Note.findById */

Note.findById('000000000000000000000003')
  .then( result => {
    console.log(result);
  })
  .catch( err => console.error(err));

/* Create a new note using Note.create */

const newNote = {
  title : 'new Title', 
  content: 'bacon ipsum'
};

Note.create(newNote)
  .then(result => console.log(result))
  .catch( err => console.error(err));

/* Update a note by id using Note.findByIdAndUpdate */

const updatedNote = {
  title: 'updated title',
  content: 'updated content'
};

Note.findByIdAndUpdate('000000000000000000000003', updatedNote, { new: true, upsert: true })
  .then(result => console.log(result))
  .catch( err => console.error(err));

/* Delete a note by id using Note.findByIdAndRemove */
Note.findByIdAndRemove('000000000000000000000003')
  .then(() => {
    console.log('Removed a note');
  })
  .catch(err => console.error(err));