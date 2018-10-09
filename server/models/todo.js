const mongoose = require('mongoose');

let Todo = mongoose.model('Todo', {
  text: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  }
});

module.exports = Todo;

// let theTodo = new Todo({
//   text: 'Hey ho, lets go.',
//   completed: true,
//   completedAt: 100
// });
//
// theTodo.save().then((document) => {
//   console.log(JSON.stringify(document, null, 2));
// }, (e) => console.log('Unable to save todo: ', e));
