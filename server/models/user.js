const mongoose = require('mongoose');
const _ = require('lodash');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcr = require('bcryptjs');

let UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email address'
    }
  },
  password: {
    type: String,
    require: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    }
  }]
});

UserSchema.methods.generateAuthToken = function() {
  let user = this;
  let access = 'auth';
  let token = jwt.sign({ _id: user._id.toHexString(), access }, 'abcabc').toString();
  user.tokens = user.tokens.concat([{ access, token }]);
  return user.save().
    then(() => {
      return token;
    });
};

UserSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    bcr.genSalt(11, (e, salt) => {
      bcr.hash(this.password, salt, (e, hash) => {
        this.password = hash;
        next();
      });
    });
  }
  else {
    next();
  }
});

UserSchema.statics.findByToken = function(token) {
  let User = this;
  let decoded;
  try {
    decoded = jwt.verify(token, 'abcabc');
  }
  catch (e) {
    return Promise.reject();
  }
  return User.findOne({ _id: decoded._id, 'tokens.token': token, 'tokens.access': 'auth' });
};

UserSchema.methods.toJSON = function() {
  let user = this;
  let userObj = user.toObject();
  return _.pick(userObj, ['_id', 'email']);
};

let User = mongoose.model('User', UserSchema);

module.exports = User;

// let user = new User({
//   email: 'admin@admin.com'
// });
//
// user.save().then((document) => {
//   console.log(JSON.stringify(document, null, 2));
// }, (e) => console.log('Unable to save todo: ', e));
