const express = require('express');
const router = express.Router();
const Driver= require('../models/driver.model');
const Ride = require('../models/ride.model');

router.get('/drivers/:id', async (req, res) => {
  try {
    console.log(req.params.id,'asdas');
    const driver = await Driver.findOne({
      $or: [
        { userId: req.params.id }
      ]
    }).populate('userId');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rides history for a driver
router.get('/rides/driver/:id', async (req, res) => {
  try {
    // Find driver to get userId
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      // Try direct user ID
      const rides = await Ride.find({ driverId: req.params.id })
        .sort({ createdAt: -1 });

      return res.json(rides);
    }

    // Find all rides for this driver
    const rides = await Ride.find({ driverId: driver.userId })
      .sort({ createdAt: -1 });

    res.json(rides);
  } catch (error) {
    console.error('Error fetching ride history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update driver status (active/inactive)
router.patch('/drivers/:id/status', async (req, res) => {
  try {
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: 'Active status must be a boolean' });
    }

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check if the authenticated user is the driver or an admin
    if (driver.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this driver' });
    }

    driver.active = active;
    await driver.save();

    res.json(driver);
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get summary statistics for a driver
router.get('/drivers/:id/stats', async (req, res) => {
  try {
    // Find driver to get userId
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Find all completed rides for this driver
    const rides = await Ride.find({
      driverId: driver.userId,
      status: 'completed'
    });

    // Calculate statistics
    const totalRides = rides.length;
    const totalEarnings = rides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalDistance = rides.reduce((sum, ride) => sum + ride.distance, 0);

    // Group by last 7 days
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);

    const recentRides = rides.filter(ride => new Date(ride.createdAt) >= last7Days);
    const recentEarnings = recentRides.reduce((sum, ride) => sum + ride.fare, 0);

    res.json({
      totalRides,
      totalEarnings,
      totalDistance,
      recentRides: recentRides.length,
      recentEarnings
    });
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;