'use strict';

const express = require('express');
const mongoose = require('mongoose');
const Folder = require('../models/folder');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */

router.get('/', (req, res, next) => {

  Folder.find()
    .sort({ name : 'asc'})
    .then( (results) => 
    {res.json(results);})
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */

router.get('/:id', (req, res, next) => {

  const { id } = req.params;

  //validate user input
  if(id)
});

/* ========== POST/CREATE AN ITEM ========== */

// router.post();

/* ========== PUT/UPDATE A SINGLE ITEM ========== */

//router.put();

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */

// router.delete();

module.exports = router;