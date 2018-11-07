const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('../index');
const Todo = require('../models/todo');
const { todos, populateToDos, users, populateUsers } = require('./seed');


beforeEach(populateUsers); // remove all documents from db to then add dummy documents and finish setup -> users
beforeEach(populateToDos); // remove all documents from db to then add dummy documents and finish setup -> todos

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
            console.log('I\'m fucking here');
            expect(docs.length).toBe(1);
            expect(docs[0].text).toBe(text);
          }).
          catch( e => console.log );
          return done();
      });
  });

  it('should prevent save on body fail', (done) => {
    request(app).
      post('/todos').
      send({}).
      expect(400).
      end(done);
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

describe(':Testing GET .../users/me', () => {
  it('should get user info if the user is authenticated', (done) => {
    request(app).
      get('/users/me').
      set('x-auth', users[0].tokens[0].token).
      expect(200).
      expect(res => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      }).
      end(done);
  });

  it('should send a 401 error if not authenticated', (done) => {
    request(app).
      get('/users/me').
      expect(401).
      expect(res => {
        expect(res.body).toEqual({});
      }).
      end(done);
  });
});

describe(':Testing POST .../users', () => {
  it('should create a authanticated user', (done) => {
    let email = 'admin@admin.com';
    let password = 'abCaBc?';
    request(app).
      post('/users').
      send({ email, password }).
      expect(200).
      expect(res => {
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body.email).toBe(email);
        expect(res.body._id).toBeTruthy();
      }).
      end(done);
  });

  it('should not create user for existing email', (done) => {
    let email = users[0].email;
    let password = 'abcabc123!';
    request(app).
      post('/users').
      send({ email, password }).
      expect(400).
      end(done);
  });

  it('should send back an error if invalid entries', (done) => {
    let email = 'admin.com';
    let password = 'abc';
    request(app).
      post('/users').
      send({ email, password }).
      expect(400).
      end(done);
  });
});
