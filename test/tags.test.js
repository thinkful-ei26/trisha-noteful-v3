'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tag');

const { tags } = require('../db/seed/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Tags API resources', () => {
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
      Tag.insertMany(tags),
      Tag.createIndexes()
    ]);
  });

  afterEach(() => {
    return mongoose.connection.db.dropDatabase();
  });

  after( () => {
    return mongoose.disconnect();
  });

  describe('GET /api/tags',  () => {

    it('should return all tags', () => {
      return Promise.all([
        Tag.find(),
        chai.request(app).get('/api/tags')
      ])
      // Compare database results to API response
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
        Tag.find(),
        chai.request(app).get('/api/tags')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          // console.log('this is data', data);
          res.body.forEach( (item, i) => {

            // console.log('this is item', item);
            
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

  describe('GET /api/tags/:id',  () => {

    it('should return correct tag', () => {
      let data;
      // 1) First, call the database
      return Tag.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).get(`/api/tags/${data.id}`);
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
        .get('/api/tags/NOT-A-VALID-ID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid'); //.eq is a chai method you can also use .equal
        });
    });

    // 
    /*  {
      "status": 404,
      "message": "Not Found"
    } */
    it('should respond with 404 for an ID not existing', () => {
      return chai.request(app)
        .get('/api/tagss/DOESNOTEXIST') 
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.eq('Not Found');
        });
    });
  });

  describe('POST /api/tags', () => {
    it('should create and return a new tag when provided valid data', () => {
      const newTag = { 'name': 'newTagName' };

      let body;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .then((res) => {
          body = res.body; 
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Tag.findById(body.id); //return this so it's accessible for the next promise
        })
        // 3) then compare the API response to the database results
        .then(data => {  //data comes from database from previous promise .then
          expect(body.id).to.equal(data.id);
          expect(body.name).to.equal(data.name);
          expect(new Date(body.createdAt)).to.eql(data.createdAt);
          expect(new Date(body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    // ADD ERROR TESTS
    /* 
    1) missing name 
      {
        "status": 400,
        "message": "Missing `name` in request body"
      }
    2) duplicate name
      {
        "status": 400,
        "message": "The tag name already exists"
      }
    */
    
    it('should return 400 error if missing name in request body', () => {
      const newTag = { 'notValid': 'POST tag test' };
      return chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return 400 error if duplicate folder name', () => {
      //you need a series of .then 
      return Tag.findOne()
        .then( data => {
          const newTag = { 'name' : data.name };
          return chai.request(app)
            .post('/api/tags')
            .send(newTag);
        })
        .then( res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });
  });

  describe('PUT /api/tags', () => {

    it('should update fields you send over', () => {
      const updateData = {
        // 'id': '5c00680530cf5324df8ffa71',
        'name': 'updated name'
      };

      let res;
      // 1) First, call the API
      return Tag
        .findOne()
        .then((_tag) => {
          updateData.id = _tag.id;

          // make request then inspect it to make sure it reflects data we sent
          return chai.request(app)
            .put(`/api/tags/${_tag.id}`)
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
          return Tag.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(res.body.content).to.equal(data.content);
          // console.log(res.body);
          // console.log(data);
          expect(new Date(res.body.createdAt)).to.deep.equal(data.createdAt);
          // expect item to have been updated
          // expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
          //this should work though:
          expect(new Date(res.body.updatedAt)).to.deep.equal(data.updatedAt);
        });
    });

    it('should return 400 error when missing "name" field', () => {
      const updateData = {}; //send an empty req.body
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/tags/${data.id}`)
            .send(updateData);
        })
        .then( res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return 400 error when given duplicate name', () => {
      // 1) Find two tags and set one tag name to the other to create a duplicate name
      return Tag.find().limit(2)
        .then( results => {
          const [tag1, tag2] = results;
          tag1.name = tag2.name;
          // 2) make a put request to deliberately get an error
          // Note: please return this so it's accessible for next promise
          return chai.request(app)
            .put(`/api/tags/${tag1.id}`)
            .send(tag1);
        })
        .then( res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });

  });

  describe('DELETE /api/tags', () => {

    it('should delete note by id and respond with 204 status', () => {
      let tag;

      return Tag
        .findOne()
        .then((_tag) => {
          tag = _tag;
          return chai.request(app).delete(`/api/tags/${tag.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty; //added this
          return Tag.findById(tag.id);

          //alternatively, you could return the count 
          /* 
          return Tag.countDocuments({ _id: data.id });
          */
        })
        .then((_tag) => {
          expect(_tag).to.be.null;
        });
      /* if you returned the count then test it:
        .then(count => {
          expect(count).to.equal(0);
        });
      */
    });
  });

});