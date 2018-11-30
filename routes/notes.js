'use strict';

const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */

router.get('/', (req, res, next) => {

  //add tags to the response
  const { searchTerm, folderId, tags } = req.query;
  let filter = {};

  if (searchTerm) {
    filter.title = { $regex: searchTerm, $options: 'i' };

    // Mini-Challenge: Search both `title` and `content`
    // const re = new RegExp(searchTerm, 'i');
    // filter.$or = [{ 'title': re }, { 'content': re }];
  }

  if (folderId) {
    filter.folderId =  folderId;
  }

  //Capture the incoming tags (tag id) and conditionally add it to the database query filter
  if (tags) {
    filter.tags = tags;
  }

  Note.find(filter)
  //use mongoose populate method to give all property of tags array:
    .populate('tags') // https://courses.thinkful.com/node-001v5/assignment/2.2.4
    .sort({ updatedAt: 'desc' })
    .then(results => res.json(results))
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findById(id)
    .populate('folderId tags')
    .then( result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch( err => next(err));

});

// /* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }  

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  tags.forEach( (tag) => {
    if(tag && !mongoose.Types.ObjectId.isValid(tag)) {
      const err = new Error('The `tags` id is not valid');
      err.status = 400;
      return next(err);
    }
  });

  const newNote = { title, content, folderId, tags };

  /* 
  body you POST in POSTMAN: 
  NOTE HERE THAT TAGS IS JUST AN ARRAY OF STRINGS
    {
    "tags": [
        "222222222222222222222200",
        "222222222222222222222201",
        "222222222222222222222202"
    ],
    "title": "new post",
    "content": "bacon ipsum",
    "folderId": "111111111111111111111100"
}
  */

  //this checks that if folderId exists then make the newId = folderId , if you didn't require the folderId on the noteSchema
  // if(folderId) {
  //   newNote.folderId = folderId;
  // }

  if(folderId === '') {
    newNote.folderId = null;
    // delete newNote.folderId;
  }

  Note.create(newNote)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  // const noteId = req.params.id;
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body; //updateable fields

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!title) { 
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  tags.forEach( (tag) => {
    if(tag && !mongoose.Types.ObjectId.isValid(tag)) {
      const err = new Error('The `tags` id is not valid');
      err.status = 400;
      return next(err);
    }
  });

  const updatedNote = { title, content, folderId, tags };

  if(folderId === '') {
    delete updatedNote.folderId;
    updatedNote.$unset = {folderId : ''};
  }

  Note.findByIdAndUpdate(id, updatedNote, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  // const noteId = req.params.id;
  const { id } = req.params;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findByIdAndRemove(id)
    .then(() => {
      res.sendStatus(204).end(); 
    })
    .catch(err => next(err));
});

module.exports = router;