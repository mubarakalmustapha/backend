const validateObjectId = require("../middleware/validateObjectId");
const mongoose = require("mongoose");
const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/admin");
const _ = require("lodash");
const express = require("express");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;

  const user = userId
    ? await User.findById(userId).select("-password")
    : await User.findOne({ name: username }).select("-password");
  res.send(user);
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already register");

  user = new User(
    _.pick(req.body, [
      "name",
      "email",
      "password",
      "isAdmin",
      "profilePicture",
      "coverPicture",
      "followers",
      "pollowings",
      "form",
      "from",
      "relatioship",
      "city",
      "bio",
    ])
  );
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(user, ["name", "email", "isAdmin", "_id"]));
});

router.put("/:id", [auth, isAdmin, validateObjectId], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let { password } = req.body;
  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      password,
      profilePicture: req.body.profilePicture,
      coverPicture: req.body.coverPicture,
      city: req.body.city,
      bio: req.body.bio,
      from: req.body.from,
      relatioship: req.body.relatioship,
      isAdmin: req.body.isAdmin,
    },
    { new: true }
  );
  await user.save();
  if (!user)
    return res.status(404).send("The user with the giving Id was not found");

  res.send("The user was updated");
});

router.put("/:id/follow", auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json("Invalid ID");

  const currentUser = await User.findById(req.body.userId);
  if (!currentUser) return res.status(404).send("Invalid user");

  const user = await User.findById(req.params.id);

  if (!user.followers.includes(req.body.userId)) {
    await user.updateOne({ $push: { followers: req.body.userId } });
    await currentUser.updateOne({ $push: { followings: req.params.id } });
  } else return res.status(400).send("You already follow this user");
  await user.save();

  res.json("You has following this user");
});

router.put("/:id/unfollow", auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json("Invalid ID");

  const currentUser = await User.findById(req.body.userId);
  if (!currentUser) return res.status(404).send("Invalid user");

  const user = await User.findById(req.params.id);

  if (user.followers.includes(req.body.userId)) {
    await user.updateOne({ $pull: { followers: req.body.userId } });
    await currentUser.updateOne({ $pull: { followings: req.params.id } });
    return res.json("You has unfollowed this user");
  } else res.status(400).send("You can't follow this user");
  await user.save();

  res.send("You has unfollowed this user");
});

router.get("/friends/:userId", auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.userId))
    return res.status(404).send("Invalid user ID");

  const user = await User.findById(req.params.userId);

  const friends = await Promise.all(
    user.followings.map((friendId) => User.findById(friendId))
  );

  const friendList = [];
  friends.map((friend) => {
    const { _id, name, profilePicture } = friend;
    friendList.push({ _id, name, profilePicture });
  });

  res.send(friendList);
});

module.exports = router;
