const mongoose = require('mongoose');
const Joi = require('joi');

const Post = mongoose.model(
  'Post',
  new mongoose.Schema({
    userId: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      maxLength: 1024,
    },
    image: {
      type: String,
    },
    likes: {
      type: Array,
      default: [],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  })
);

function validatePost(post) {
  const schema = {
    desc: Joi.string().max(1024),
    image: Joi.string(),
  };

  return Joi.validate(post, schema);
}

exports.Post = Post;
exports.validate = validatePost;
