const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const Todo = require('../models/todo');
const User = require('../models/user');

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

populateToDos = (done) => {
  //Todo.remove({}).then(() => done()); //remove all documents from db and finish up the setup
  Todo.deleteMany({}).
    then(() => {
      return Todo.insertMany(todos);
    }).
    then(e => done()).
    catch(e => done(e));
};

const firstUserID = new ObjectID();
const secondUserID = new ObjectID();
const users = [{
  _id: firstUserID,
  email: 'user-one@user.com',
  password: 'abCaBc!1',
  tokens: [{
    access: 'auth',
    token: jwt.sign({
      _id: firstUserID,
      access: 'auth'
    }, 'abcabc').toString()
  }]
}, {
  _id: secondUserID,
  email: 'user-two@user.com',
  password: 'abCaBc!2',
  tokens: [{
    access: 'auth',
    token: jwt.sign({
      _id: secondUserID,
      access: 'auth'
    }, 'abcabc').toString()
  }]
}];

populateUsers = (done) => {
  //Todo.remove({}).then(() => done()); //remove all documents from db and finish up the setup
  User.deleteMany({}).
    then(() => {
      let userOne = new User(users[0]).save();
      let userTwo = new User(users[1]).save();

      return Promise.all([userOne, userTwo]);
      return User.insertMany(todos);
    }).
    then(() => done()).
    catch(e => done(e));
};

module.exports = {
  todos,
  populateToDos,
  users,
  populateUsers
};
