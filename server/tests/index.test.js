const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('../index');
const Todo = require('../models/todo');

const todos = [
  {
    _id: new ObjectID(),
    text: 'blabla bla'
  },
  {
    _id: new ObjectID(),
    text: 'haha ha'
  },
  {
    _id: new ObjectID(),
    text: 'yo yoyo'
  }
];  //dummy docsuments

beforeEach((done) => {
  //Todo.remove({}).then(() => done()); //remove all documents from db and finish up the setup
  Todo.remove({}).
    then(() => {
      return Todo.insertMany(todos);
    }).
    then( () => done() );
}); // remove all documents from db add dummy documents and finish setup

describe('POST /todos', () => {
  it('creating a new todo', (done) => {
    let text = 'Test todo text';

    request(app).
      post('/todos').
      send({ text }).
      expect(200).
      expect( res => {
        expect(res.body.text).toBe(text);
      }).
      end((e, res) => {
        if(e) {
          return done(e);
        }
        Todo.find({ text }).
          then( docs => {
            expect(docs.length).toBe(1);
            expect(docs[0].text).toBe(text);
            done();
          }).
          catch( e => done(e) );
      });
  });

  it('should prevent save on body fail', (done) => {
    request(app).
      post('/todos').
      send({}).
      expect(400).
      end((e, res) => {
        if(e) {
          return done(e);
        }
        Todo.find().
          then( docs => {
            expect(docs.length).toBe(3);
            done();
          }).
          catch( e => done(e) );
      });
  });

});

describe('GET /todos', () => {
  it('get list items', (done) => {
    request(app).
      get('/todos').
      expect(200).
      expect( res => expect(res.body.todos.length).toBe(3) ).
      end(done);
  });
});

describe('Testing GET .../todos/:id', () => {
  it('should return documents', (done) => {
    request(app).
      get(`/todos/${todos[0]._id.toHexString()}`).
      expect(200).
      expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      }).
      end(done);
  });

  it('should return 404 for non existing todo', (done) => {
    let hexID = new ObjectID().toHexString();
    request(app).
      get(`/todos/${hexID}`).
      expect(404).
      end(done);
  });

  it('should return 404 for non object id', (done) => {
    let hexID = new ObjectID().toHexString();
    request(app).
      get('/todos/qwerty').
      expect(404).
      end(done);
  });
});
