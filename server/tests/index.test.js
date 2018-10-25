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
    text: 'yo yoyo',
    completed: true,
    completedAt: 123
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

describe(':Testing GET .../todos', () => {
  it('get list items', (done) => {
    request(app).
      get('/todos').
      expect(200).
      expect( res => expect(res.body.todos.length).toBe(3) ).
      end(done);
  });
});

describe(':Testing GET .../todos/:id', () => {
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
    let hexID = 'qwerty';
    request(app).
      get(`/todos/${hexID}`).
      expect(404).
      end(done);
  });
});

describe(':Testing DELETE .../todos/:id', () => {
  it('should return the deleated object (todo)', (done) => {
    let hexID = todos[0]._id.toHexString();
    request(app).
      delete(`/todos/${hexID}`).
      expect(200).
      expect( res => {
        expect(res.body.todo._id).
          toBe(hexID);
      }).
      end((err, res) => {
        if (err) {
          return done(err);
        }
        Todo.findById(hexID).
          then( doc => {
            expect(doc).toBeFalsy();
            done();
          }).
          catch( e => done(e) );
      });

  });

  it('should return 404 if object (todo) not found', (done) => {
    let hexID = new ObjectID().toHexString();
    request(app).
      delete(`/todos/${hexID}`).
      expect(404).
      end(done);
  });

  it('should return 404 if objectID is invalid', (done) => {
    let hexID = 'qwerty';
    request(app).
      delete(`/todos/${hexID}`).
      expect(404).
      end(done);
  });
});

describe(':Testing PATCH .../todos/:id', () => {
  it('should update object (todo) and assign it a completedAt date', (done) => {
    let hexID = todos[0]._id.toHexString();
    let text = 'Test update...first';
    request(app).
      patch(`/todos/${hexID}`).
      send({text, completed: true}).
      expect(200).
      expect( res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        expect(typeof res.body.todo.completedAt).toBe('number');
      }).
      end(done);
  });
  it('should clear completedAt, if not complete', (done) => {
    let hexID = todos[2]._id.toHexString();
    let text = 'Test update...second';
    request(app).
      patch(`/todos/${hexID}`).
      send({text, completed: false}).
      expect(200).
      expect( res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toBeFalsy();
      }).
      end(done);
  });
});
