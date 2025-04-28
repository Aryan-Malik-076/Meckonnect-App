const express = require("express");
const Driver = require("../models/Driver");

const router = express.Router();

// Get Nearby Drivers
router.get("/", async (req, res) => {
  try {
    const drivers = await Driver.find({ availability: true });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
