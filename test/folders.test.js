'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Folder = require('../models/folder');

const { folders } = require('../db/seed/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Folder API resources', () => {
  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedFolderData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(() => {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true})
      .then(() => mongoose.connection.db.dropDatabase());
  });

  // beforeEach(function () {
  //   return Folder.insertMany(folders);
  // });

  //createIndex is a method from Mongo library, creates indexes on collections
  beforeEach( () => {
    return Promise.all([
      Folder.insertMany(folders),
      Folder.createIndexes()
    ]);
  });

  afterEach(() => {
    return mongoose.connection.db.dropDatabase();
  });

  after( () => {
    return mongoose.disconnect();
  });

  describe('GET /api/folders',  () => {

    it('should return all folders', () => {
      // 1) Call the database **and** the API
      // 2) Wait for both promises to resolve using `Promise.all`
      return Promise.all([
        Folder.find(),  // you could sort all folders by name Folder.find.sort(name)
        chai.request(app).get('/api/folders')
      ])
      // 3) then compare database results to API response
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });
    
    // Must verify that the list has correct fields and value

    it('should return a list with the correct fields and values', () => {
      return Promise.all([
        Folder.find().sort('name'),
        chai.request(app).get('/api/folders')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach( (item, i) => {
            expect(item).to.be.a('object');
            expect(item).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(data[i].id);
            expect(item.name).to.equal(data[i].name);
            expect(new Date(item.createdAt)).to.deep.equal(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.deep.equal(data[i].updatedAt);
          });
        });
    });


  });

  describe('GET /api/folders/:id',  () => {

    it('should return correct folder', () => {
      let data;
      // 1) First, call the database
      return Folder.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).get(`/api/folders/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt','updatedAt');

          // 3) then compare database results to API response
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    //add useful errors

    it('should respond with a 400 for an invalid id', () => {
      return chai.request(app)
        .get('/api/folders/NOT-A-VALID-ID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid'); //.eq is a chai method you can also use .equal
        });
    });

    // as shown in postman, you need to make a 404 error for an ID not existing, to test this, you need to have the same length ID. In our app, Mongo creates 27 digit folder id so if folderId = 111111111111111111111100, to test an error replace one character: folderId = A11111111111111111111100
    /*  {
      "status": 404,
      "message": "Not Found"
    } */
    it('should respond with 404 for an ID not existing', () => {
      return chai.request(app)
        .get('/api/folders/A11111111111111111111100')
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.eq('Not Found');
        });
    });

  });

  describe('POST /api/folders', function () {
    it('should create and return a new folder when provided valid data', function () {
      const newFolder = {
        'name': 'newFolderName'
      };

      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/folders')
        .send(newFolder)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Folder.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.content).to.equal(data.content);
        });
    });
  });

  describe('PUT /api/folders', function () {
    it('should update fields you send over', function () {
      const updateData = {
        'id': '5c00680530cf5324df8ffa71',
        'name': 'updated name'
      };

      let res;
      // 1) First, call the API
      return Folder
        .findOne()
        .then(function(_folder) {
          updateData.id = _folder.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/api/folders/${_folder.id}`)
            .send(updateData);
        })
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(200);
          // console.log(res);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'createdAt', 'name','updatedAt');
          // 2) then call the database
          return Folder.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(res.body.content).to.equal(data.content);
        });
    });
  });

  describe('DELETE /api/notes', () => {

    it('should delete note by id', () => {

      let folder;

      return Folder
        .findOne()
        .then((_folder) => {
          folder = _folder;
          return chai.request(app).delete(`/api/folders/${folder.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
          return Folder.findById(folder.id);
        })
        .then((_folder) => {
          expect(_folder).to.be.null;
        });
    });
  });

});