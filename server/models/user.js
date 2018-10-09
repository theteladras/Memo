const mongoose = require('mongoose');

let User = mongoose.model('User', {
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  }
});

module.exports = User;

// let user = new User({
//   email: 'admin@admin.com'
// });
//
// user.save().then((document) => {
//   console.log(JSON.stringify(document, null, 2));
// }, (e) => console.log('Unable to save todo: ', e));
