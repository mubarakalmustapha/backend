const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Joi = require('joi');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 50,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 1024,
  },
  isAdmin: {
    type: Boolean,
    default: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  coverPicture: {
    type: String,
    default: '',
  },
  followers: {
    type: Array,
    default: [],
  },
  followings: {
    type: Array,
    default: [],
  },
  bio: {
    type: String,
    max: 50,
  },
  form: {
    type: String,
    max: 50,
  },
  city: {
    type: String,
    max: 50,
  },
  from: {
    type: String,
    max: 50,
  },
  relationship: {
    type: Number,
    enum: [1, 2, 3],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      followings: this.followings,
      followers: this.followers,
      profilePicture: this.profilePicture,
      coverPicture: this.coverPicture,
      bio: this.bio,
      from: this.from,
      form: this.form,
      city: this.city,
      relationship: this.relationship,
      isAdmin: this.isAdmin,
    },
    config.get('jwtPrivateKey')
  );
};

const User = mongoose.model('User', userSchema);

function validateUser(user) {
  const schema = {
    name: Joi.string().required().min(4).max(50),
    email: Joi.string().required().min(4).max(255).email(),
    password: Joi.string().required().min(4).max(1024),
    profilePicture: Joi.string(),
    coverPicture: Joi.string(),
    isAdmin: Joi.boolean(),
    bio: Joi.string().max(50),
    from: Joi.string(),
    city: Joi.string(),
    form: Joi.string(),
    relationship: Joi.number(),
    date: Joi.date(),
  };
  return Joi.validate(user, schema);
}

exports.User = User;
exports.validate = validateUser;
