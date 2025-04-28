const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema({
  name: String,
  location: {
    lat: Number,
    lng: Number
  },
  availability: { type: Boolean, default: true },
  cost: Number
});

module.exports = mongoose.model("Driver", DriverSchema);
