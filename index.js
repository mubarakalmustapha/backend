const express = require('express');
const winston = require('winston');
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL)
.then(() => console.log("Connected to MongoDB..."))
.catch((err) => console.log("Could not connect to MongoDB", err));

require('./startup/routes')(app);
require('./startup/validation')();

const port = process.env.PORT || 8000;
const server = app.listen(port, () =>
  winston.info(`Listening on port ${port}...`)
);

module.exports = server;
