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

app.post('/todos', (req, res) => {
  let todo = new Todo({
    text: req.body.text
  });
  todo.save().then((document) => {
    res.send(document);  //returning the saved body to the client
  }, e => res.status(400).send(e));
});

app.get('/todos', (req, res) => {
  Todo.find().then( docs => {
    res.send({ todos: docs });  //returning all db results to the client
  }).
  catch( e => res.status(400).send(e));
});

app.get('/todos/:clientId', (req, res) => {
  let id = req.params.clientId;
  if (!ObjectID.isValid(id)) return res.status(404).send();
  Todo.findById(id).
    then( doc => {
      if (!doc) return res.status(404).send();  //success, with no docs
      res.send({ todo: doc });
    }).
    catch( e => res.status(400).send() );
});

app.delete('/todos/:clientId', (req, res) => {
  let id = req.params.clientId;
  if (!ObjectID.isValid(id)) return res.status(404).send();
  Todo.findOneAndRemove({_id: id}).
    then( doc => {
      if (!doc) return res.status(404).send();  //success, with no docs
      res.send({ todo: doc });
    }).
    catch( e => res.status(400).send() );
});

app.patch('/todos/:clientId', (req, res) => {
  let id = req.params.clientId;
  if (!ObjectID.isValid(id)) return res.status(404).send();
  let body = _.pick(req.body, ['text', 'completed']);
  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  }
  else {
    body.completed = false;
    body.completedAt = null;
  }
  Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).
    then( doc => {
      if (!doc) return res.status(404).send();
      res.send({todo: doc});
    }).
    catch( e => {console.log(e); res.status(400).send()} );
});

app.listen(port, () => console.log(`Server runing on port ${port}.`));

module.exports = { app };
