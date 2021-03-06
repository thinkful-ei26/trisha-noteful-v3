'use strict';

const express = require('express');
const mongoose = require('mongoose');
const Tag = require('../models/tag');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */

router.get('/', (req, res, next) => {

  Tag.find()
    .sort()
    .then( results => res.json(results))
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

  Tag.findById(id)
    .then( result => {
      if (result) {
        res.status; // 200 default
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

// /* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  
  const { name } = req.body;
  const newTag = { name };

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.create(newTag)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */

router.put('/:id', (req, res, next) => {
  
  const { id } = req.params;
  const { name } = req.body;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updatedTag = { name };
  
  Tag.findByIdAndUpdate(id, updatedTag, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */

router.delete('/:id', (req, res, next) => {
  
  const { id } = req.params;

  /***** Never trust users - validate input *****/
  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  //ON DELETE SET NULL equivalent
  const tagRemovePromise = Tag.findByIdAndRemove(id);
  // ON DELETE CASCADE equivalent
  // const noteRemovePromise = Note.deleteMany({ tags: [id] });

  const noteUpdatePromise = Note.updateMany(
    { tags : id },
    { $pull: { tags: id}} //$pull from mongoDB removes all instances of value/s that match the specific condition
  );

  Promise.all([tagRemovePromise, noteUpdatePromise])
    .then( () => {
      res.sendStatus(204).end(); //end, nothing to listen for after delete
    })
    .catch( err => next(err));
});

module.exports = router;