'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');
const { notes, folders } = require('../db/seed/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Notes API resource', function (){

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedNotesData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      Note.insertMany(notes),
      Folder.insertMany(folders)
    ])
      .then(() => {
        return Note.createIndexes();
      });
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function () {

    it('should return all notes', () => {
      // 1) Call the database **and** the API
    // 2) Wait for both promises to resolve using `Promise.all`
      return Promise.all([
        Note.find(),
        chai.request(app).get('/api/notes')
      ])
      // 3) then compare database results to API response
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });


    it('should return a list with correct fields', () => {
      return Promise.all(
        [
          Note.find(),
          chai.request(app).get('/api/notes')
        ]
      )
        .then(([data, res]) => {
          //console.log('this is data', data);
          /* data consist of an array of objects representing a note
          [ 
            { 
              _id: 000000000000000000000000,
              title: '5 life lessons learned from cats',
              content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
              folderId: 111111111111111111111100,
              __v: 0,
              createdAt: 2018-11-30T10:57:05.977Z,
              updatedAt: 2018-11-30T10:57:05.977Z 
            },
            {...}, 
            {...}
          ] 
          */
          // console.log('this is res', res);
          /* res is metadata an object that has many properties like:
            text: [{"title:" "5 lessons..."}, ] which is the json array obj of all notes
            body: [{}, {}] corresponds to req.body
            headers: an obj that tells you the content-type (application/json), character set, etc
            very useful if you want to know under the hood stuff and how many eventlisteners are listed or redirects
          */

          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length); //data.length should equal length of res.body
          res.body.forEach((item, index) => {
            expect(item).to.be.a('object');
            expect(item).to.include.all.keys('title', 'content', 'folderId', 'createdAt', 'updatedAt', 'id');
            //the value from the response body should equal value of the object from the database
            expect(item.title).to.equal(data[index].title);
            expect(item.content).to.equal(data[index].content);
            expect(item.id).to.equal(data[index].id);
          });
        });
    });

  });
   
  describe('GET /api/notes/:id', function () {
    it('should return correct note', function () {
      let data;
      // 1) First, call the database
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'folderId','updatedAt');

          // 3) then compare database results to API response
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  // describe('POST /api/notes', function () {
  //   it('should create and return a new item when provided valid data', function () {
  //     const newItem = {
  //       'title': 'The best article about cats ever!',
  //       'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
  //     };

  //     let res;
  //     // 1) First, call the API
  //     return chai.request(app)
  //       .post('/api/notes')
  //       .send(newItem)
  //       .then(function (_res) {
  //         res = _res;
  //         expect(res).to.have.status(201);
  //         expect(res).to.have.header('location');
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.a('object');
  //         expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt');
  //         // 2) then call the database
  //         return Note.findById(res.body.id);
  //       })
  //       // 3) then compare the API response to the database results
  //       .then(data => {
  //         expect(res.body.id).to.equal(data.id);
  //         expect(res.body.title).to.equal(data.title);
  //         expect(res.body.content).to.equal(data.content);
  //         expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
  //         expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
  //       });
  //   });
  // });

  describe('POST /api/notes', function () {

    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };
      let res;
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          return Note.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.deep.equal(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.deep.equal(data.updatedAt);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = {
        'content': 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });


  describe('PUT /api/notes', function () {
    it('should update fields you send over', function () {
      const updateData = {
        'id': '000000000000000000000000',
        'title': 'updated title',
        'content': 'updated content.',
        'folderId': '111111111111111111111100'
      };

      let res;
      // 1) First, call the API
      return Note
        .findOne()
        .then(function(_note) {
          updateData.id = _note.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/api/notes/${_note.id}`)
            .send(updateData);
        })
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(200);
          // console.log(res);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'folderId','updatedAt');
          // 2) then call the database
          return Note.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          // expect(res.body.folderId).to.equal(data.folderId);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  describe('DELETE /api/notes', () => {

    it('should delete note by id', () => {

      let note;

      return Note
        .findOne()
        .then((_note) => {
          note = _note;
          return chai.request(app).delete(`/api/notes/${note.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
          return Note.findById(note.id);
        })
        .then((_note) => {
          expect(_note).to.be.null;
        });
    });
  });

 
});