const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema({
  name: String,
  currentLocation: {
    lat: Number,
    lng: Number
  },
  destination: {
    lat: Number,
    lng: Number
  }
});

module.exports = mongoose.model("Users", UsersSchema);
