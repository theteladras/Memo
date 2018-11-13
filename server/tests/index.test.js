const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('../index');
const Todo = require('../models/todo');
const User = require('../models/user');
const { todos, populateToDos, users, populateUsers } = require('./seed');


beforeEach(populateUsers); // remove all documents from db to then add dummy documents and finish setup -> users
beforeEach(populateToDos); // remove all documents from db to then add dummy documents and finish setup -> todos

describe('POST /todos', () => {

  it('creating a new todo', (done) => {
    let text = 'Test todo text';
    request(app).
      post('/todos').
      set('x-auth', users[0].tokens[0].token).
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
          }).
          catch( e => console.log );
          return done();
      });
  });

  it('should prevent save on body fail', (done) => {
    request(app).
      post('/todos').
      set('x-auth', users[0].tokens[0].token).
      send({}).
      expect(400).
      end(done);
  });

});

describe(':Testing GET .../todos', () => {
  it('get list items', (done) => {
    request(app).
      get('/todos').
      set('x-auth', users[0].tokens[0].token).
      expect(200).
      expect( res => expect(res.body.todos.length).toBe(1) ).
      end(done);
  });
});

describe(':Testing GET .../todos/:id', () => {
  it('should return document from owner', (done) => {
    request(app).
      get(`/todos/${todos[0]._id.toHexString()}`).
      set('x-auth', users[0].tokens[0].token).
      expect(200).
      expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      }).
      end(done);
  });

  it('should not return document that is not owned', (done) => {
    request(app).
      get(`/todos/${todos[1]._id.toHexString()}`).
      set('x-auth', users[0].tokens[0].token).
      expect(404).
      end(done);
  });

  it('should return 404 for non existing todo', (done) => {
    let hexID = new ObjectID().toHexString();
    request(app).
      get(`/todos/${hexID}`).
      set('x-auth', users[0].tokens[0].token).
      expect(404).
      end(done);
  });

  it('should return 404 for non object id', (done) => {
    let hexID = 'qwerty';
    request(app).
      get(`/todos/${hexID}`).
      set('x-auth', users[0].tokens[0].token).
      expect(404).
      end(done);
  });
});

describe(':Testing DELETE .../todos/:id', () => {
  it('should return the deleated object (todo), that is owned by the user', (done) => {
    let hexID = todos[2]._id.toHexString();
    request(app).
      delete(`/todos/${hexID}`).
      set('x-auth', users[2].tokens[0].token).
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

  it('should not deleated object (todo) from another user', (done) => {
    let hexID = todos[2]._id.toHexString();
    request(app).
      delete(`/todos/${hexID}`).
      set('x-auth', users[1].tokens[0].token).
      expect(404).
      end((err, res) => {
        if (err) {
          return done(err);
        }
        Todo.findById(hexID).
          then( doc => {
            expect(doc).toBeTruthy();
            done();
          }).
          catch(e => done(e));
      });
  });

  it('should return 404 if object (todo) not found', (done) => {
    let hexID = new ObjectID().toHexString();
    request(app).
      delete(`/todos/${hexID}`).
      set('x-auth', users[2].tokens[0].token).
      expect(404).
      end(done);
  });

  it('should return 404 if objectID is invalid', (done) => {
    let hexID = 'qwerty';
    request(app).
      delete(`/todos/${hexID}`).
      set('x-auth', users[2].tokens[0].token).
      expect(404).
      end(done);
  });
});

describe(':Testing PATCH .../todos/:id', () => {
  it('should update object (todo) and assign it a completedAt date that is owned by the user', (done) => {
    let hexID = todos[2]._id.toHexString();
    let text = 'Test update...first';
    request(app).
      patch(`/todos/${hexID}`).
      set('x-auth', users[2].tokens[0].token).
      send({text, completed: true}).
      expect(200).
      expect( res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        expect(typeof res.body.todo.completedAt).toBe('number');
      }).
      end(done);
  });

  it('should not update object (todo) from another user', (done) => {
    let hexID = todos[1]._id.toHexString();
    let text = 'Test update...first';
    request(app).
      patch(`/todos/${hexID}`).
      set('x-auth', users[2].tokens[0].token).
      send({text, completed: true}).
      expect(404).
      end(done);
  });

  it('should clear completedAt, if not complete', (done) => {
    let hexID = todos[2]._id.toHexString();
    let text = 'Test update...second';
    request(app).
      patch(`/todos/${hexID}`).
      set('x-auth', users[2].tokens[0].token).
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

describe(':Testing POST .../users/login', () => {
  it('should login user and return auth token', (done) =>{
    request(app).
      post('/users/login').
      send({
        email: users[1].email,
        password: users[1].password
      }).
      expect(200).
      expect(res => {
        expect(res.headers['x-auth']).toBeTruthy();
      }).
      end((e, res) => {
        if (e) {
          return done(e);
        }
        User.findById(users[1]._id).then(user => {
          expect(user.tokens[1]).toMatchObject({
            access: 'auth',
            token: res.header['x-auth']
          });
          done();
        }).
        catch(e => done(e));
      });
  });

  it('should denie login of user for false email', (done) =>{
    request(app).
      post('/users/login').
      send({
        email: 'adg@adg.com',
        password: users[1].password
      }).
      expect(400).
      end(done);
  });

  it('should denie login of user for false password', (done) =>{
    request(app).
      post('/users/login').
      send({
        email: users[1].email,
        password: 'aaaddd'
      }).
      expect(400).
      end(done);
  });
});

describe(':DELETE .../users/me/token', () => {
  it('delete auth token (logout)', (done) => {
    request(app).
      delete('/users/me/token').
      set('x-auth', users[0].tokens[0].token).
      expect(200).
      end((e, res) => {
        if(e) return done(e);
        User.findById(users[0]._id).
          then(user => {
            expect(user.tokens.length).toBe(0);
            return done();
          }).
          catch(e => done(e));
      });
  });
});
