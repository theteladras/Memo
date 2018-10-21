const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

const { mongoose } = require('./db/mongoose');
const Todo = require('./models/todo');
const User = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

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

app.listen(port, () => console.log(`Server runing on port ${port}.`));

module.exports = { app };
