'use strict';

const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */

router.get('/', (req, res, next) => {

  const { searchTerm } = req.query;
  let filter = {};

  if (searchTerm) {
    filter.title = { $regex: searchTerm, $options: 'i' };

    // Mini-Challenge: Search both `title` and `content`
    // const re = new RegExp(searchTerm, 'i');
    // filter.$or = [{ 'title': re }, { 'content': re }];
  }

  Note.find(filter)
    .sort({ updatedAt: 'desc' })
    .then(results => res.json(results))
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  // const noteId = req.params.id;
  const { id } = req.params;

  Note.findById(id)
    .then( result => res.json(result))
    .catch( err => next(err));

});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

  const { title, content } = req.body;

  const newNote = { title, content };

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

  // const noteId = req.params.id;
  const { id } = req.params;
  const { title, content } = req.body; //updateable fields

  /***** Never trust users - validate input *****/
  if (!title) { 
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updatedNote = { title, content };

  Note.findByIdAndUpdate(id, updatedNote, { new: true, upsert: true })
    .then(result => res.json(result))
    .catch( err => next(err));

  // /* Go over the difference: */
  // Note.findByIdAndUpdate(id, updateNote, { new: true })
  //   .then(result => {
  //     if (result) {
  //       res.json(result);
  //     } else {
  //       next();
  //     }
  //   })
  //   .catch(err => {
  //     next(err);
  //   });

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