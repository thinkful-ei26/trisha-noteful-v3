'use strict';

const express = require('express');
const mongoose = require('mongoose');
const Folder = require('../models/folder');
const Note = require('../models/note');
const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */

router.get('/', (req, res, next) => {

  Folder.find()
    .sort() //ascending is the default sort
    .then( results => {
      res.json(results);
    })
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE FOLDER ========== */

router.get('/:id', (req, res, next) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findById(id)
    .then( result => {
      if (result) {
        res.status; // 200 is default status
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE A FOLDER ========== */

router.post('/', (req, res, next) => {
 
  const { name } = req.body;
  const newFolder = { name };

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder.create(newFolder)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
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

  const updatedFolder = { name };
  
  Folder.findByIdAndUpdate(id, updatedFolder, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */

router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  // this will unset the notes to go back to folders 'All'
  Folder.findByIdAndRemove(id)
    .then(() => {
      return Note.updateMany(
        {folderId : id},
        { $unset : { folderId : ''}}
      );
    })
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => next(err));

  //if you want to delete the notes inside the folder
  // Folder.findByIdAndRemove(id)
  //   .then(() => {
  //     return Note.deleteMany(
  //       {folderId : id}
  //     );
  //   })
  //   .then(() => {
  //     res.sendStatus(204);
  //   })
  //   .catch(err => next(err));

});

module.exports = router;