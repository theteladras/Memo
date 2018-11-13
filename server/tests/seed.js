const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const Todo = require('../models/todo');
const User = require('../models/user');

const firstUserID = new ObjectID();
const secondUserID = new ObjectID();
const thirdUserID = new ObjectID();

const todos = [
  {
    _id: new ObjectID(),
    text: 'blabla bla',
    _owner: firstUserID
  },
  {
    _id: new ObjectID(),
    text: 'haha ha',
    _owner: secondUserID
  },
  {
    _id: new ObjectID(),
    text: 'yo yoyo',
    completed: true,
    completedAt: 123,
    _owner: thirdUserID
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

const users = [{
  _id: firstUserID,
  email: 'user-one@user.com',
  password: 'abCaBc!1',
  tokens: [{
    access: 'auth',
    token: jwt.sign({
      _id: firstUserID,
      access: 'auth'
    }, process.env.secret).toString()
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
    }, process.env.secret).toString()
  }]
}, {
  _id: thirdUserID,
  email: 'user-three@user.com',
  password: 'abCaBc!3',
  tokens: [{
    access: 'auth',
    token: jwt.sign({
      _id: thirdUserID,
      access: 'auth'
    }, process.env.secret).toString()
  }]
}];

populateUsers = (done) => {
  //Todo.remove({}).then(() => done()); //remove all documents from db and finish up the setup
  User.deleteMany({}).
    then(() => {
      let userOne = new User(users[0]).save();
      let userTwo = new User(users[1]).save();
      let userThree = new User(users[2]).save();

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
