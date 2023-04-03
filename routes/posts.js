const validateObjectId = require("../middleware/validateObjectId");
const { Post, validate } = require("../models/post");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/admin");
const mongoose = require("mongoose");
const express = require("express");
const { User } = require("../models/user");
const router = express.Router();

router.get("/:id", [auth, validateObjectId], async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) res.status(404).json("The post with the giving ID was not found");

  res.json(post);
});

router.post("/", [auth, isAdmin], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const post = new Post(req.body);
  await post.save();

  res.json(post);
});

router.put("/:id", [auth, isAdmin, validateObjectId], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const post = await Post.findById(req.params.id);
  if (!post) res.status(404).send("The post with the giving ID was not found");
  await post.updateOne({ $set: req.body });
  await post.save();

  res.json("The post was updated");
});

router.delete("/:id", [auth, isAdmin, validateObjectId], async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) res.status(404).json("The post with the giving ID was not found");

  res.json("The post was deleted");
});

router.put("/:id/like", [auth, validateObjectId], async (req, res) => {
  const currentUser = await User.findById(req.body.userId);
  if (!currentUser) return res.status(404).send("Invalid UserId");

  const post = await Post.findById(req.params.id);

  if (!post.likes.includes(req.body.userId)) {
    await post.updateOne({ $push: { likes: req.body.userId } });
    res.json("The post has been like");
  } else await post.updateOne({ $pull: { likes: req.body.userId } });
  await post.save();

  res.json("The post has been dislike");
});

router.get("/timeline/:userId", auth,  async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.userId))
    return res.status(400).send("Invalid user ID");

  const currentUser = await User.findById(req.params.userId).select(
    "-password"
  );
  if (!currentUser)
    return res.status(404).send("The post with the giving ID was not found");

  const userPost = await Post.find({ userId: currentUser._id });

  const friendsPost = await Promise.all(
    currentUser.followers.map((friendId) => {
      return Post.find({ userId: friendId });
    })
  );

  res.send(userPost.concat(...friendsPost));
});

router.get("/profile/:username", auth,  async (req, res) => {
  const user = await User.findOne({ name: req.params.username }).select(
    "-password"
  );
  if (!user) return res.status(404).send("User not found");

  const posts = await Post.find({ userId: user._id });
  res.json(posts);
});

module.exports = router;
