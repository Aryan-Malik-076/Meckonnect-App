const express = require("express");
const Driver = require("../models/Driver");

const router = express.Router();

// Confirm Driver & Start Tracking
router.post("/confirm", async (req, res) => {
  try {
    const { driverId } = req.body;
    const driver = await Driver.findById(driverId);

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    res.json({ message: "Driver confirmed", driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
