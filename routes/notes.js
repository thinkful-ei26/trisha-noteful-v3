'use strict';

const express = require('express');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
// router.get('/', (req, res, next) => {

//   console.log('Get All Notes');
//   res.json([
//     { id: 1, title: 'Temp 1' },
//     { id: 2, title: 'Temp 2' },
//     { id: 3, title: 'Temp 3' }
//   ]);

// });

router.get('/', (req, res, next) => {

  const { searchTerm } = req.query;
  let filter = {};

  if (searchTerm) {
    filter.title = { $regex: searchTerm, $options: 'i' };
  }

  Note.find(filter)
    .sort({ updatedAt: 'desc' })
    .then(results => res.json(results))
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  // console.log('Get a Note');
  // res.json({ id: 1, title: 'Temp 1' });

  const noteId = req.params.id;

  Note.findById(noteId)
    .then( result => res.json(result))
    .catch( err => next(err));

});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

  // console.log('Create a Note');
  // res.location('path/to/new/document').status(201).json({ id: 2, title: 'Temp 2' });

  const { title, content } = req.body;

  const newNote = {
    title,
    content
  };

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  Note.create(newNote)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  // console.log('Update a Note');
  // res.json({ id: 1, title: 'Updated Temp 1' });

  const notesId = req.params.id;
  const { title, content } = req.body; //updateable fields

  /***** Never trust users - validate input *****/
  if (!title) { 
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updatedNote = {
    title,
    content
  };

  Note.findByIdAndUpdate(notesId, updatedNote, { new: true, upsert: true })
    .then(result => res.json(result))
    .catch( err => next(err));

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  const noteId = req.params.id;

  Note.findByIdAndRemove(noteId)
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => next(err));
});

module.exports = router;