const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

require('./db/config');
const { mongoose } = require('./db/mongoose');
const Todo = require('./models/todo');
const User = require('./models/user');
const auth = require('./middleware/auth');


const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/users', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);
  let user = new User(body);

  user.save().
    then(() => {
      return user.generateAuthToken();
    }).
    then(token => {
      res.header('x-auth', token).send(user);
    }).
    catch(e => res.status(400).send(e));
});

app.get('/users/me', auth, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);
  User.findUser(body.email, body.password).
    then(user => {
      return user.generateAuthToken().then(token => {
        res.header('x-auth', token).send(user);
      });
    }).
    catch(e => {
      res.status(400).send(e);
    });
});

app.delete('/users/me/token', auth, (req, res) => {
  req.user.removeToken(req.token).
    then(() => {
      res.status(200).send();
    }).
    catch(e => {
      res.status(400).send(e);
    });
});

app.post('/todos', auth, (req, res) => {
  let todo = new Todo({
    text: req.body.text,
    _owner: req.user._id
  });
  todo.save().then((document) => {
    res.send(document);  //returning the saved body to the client
  }, e => res.status(400).send(e));
});

app.get('/todos', auth, (req, res) => {
  Todo.find({ _owner: req.user._id }).then( docs => {
    res.send({ todos: docs });  //returning all db results to the client
  }).
  catch( e => res.status(400).send(e));
});

app.get('/todos/:clientId', auth, (req, res) => {
  let id = req.params.clientId;
  if (!ObjectID.isValid(id)) return res.status(404).send();
  Todo.findOne({
    _id: id,
    _owner: req.user._id
  }).
    then( doc => {
      if (!doc) return res.status(404).send();  //success, with no docs
      res.send({ todo: doc });
    }).
    catch( e => res.status(400).send() );
});

app.delete('/todos/:todoId', auth, (req, res) => {
  let id = req.params.todoId;
  if (!ObjectID.isValid(id)) return res.status(404).send();
  Todo.findOneAndRemove({
    _id: id,
    _owner: req.user._id
  }).
    then( doc => {
      if (!doc) return res.status(404).send();  //false success, with no docs
      res.send({ todo: doc });
    }).
    catch( e => res.status(400).send() ); // connection with database failed
});

app.patch('/todos/:todoId', auth, (req, res) => {
  let id = req.params.todoId;
  if (!ObjectID.isValid(id)) return res.status(404).send();
  let body = _.pick(req.body, ['text', 'completed']);
  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  }
  else {
    body.completed = false;
    body.completedAt = null;
  }
  Todo.findOneAndUpdate({ _id: id, _owner: req.user._id }, {$set: body}, {new: true}).
    then( doc => {
      if (!doc) return res.status(404).send();
      res.send({todo: doc});
    }).
    catch( e => {console.log(e); res.status(400).send()} );
});

app.listen(port, () => console.log(`Server runing on port ${port}.`));

module.exports = { app };
