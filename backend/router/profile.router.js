const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Ride = require('../models/ride.model');

/**
 * @route   POST /api/users/user
 * @desc    Get user profile and ride history
 * @access  Private
 */
router.post('/user', async (req, res) => {
  console.log(req.body);
  try {
    // Get user ID from request body
    const userId = req.body.id;

    // Find user without returning password
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Get user's ride history - fixed to use find() instead of findOne()
    const rides = await Ride.find({ passengerId: userId })
      .sort({ createdAt: -1 }) // Sort by most recent first
      .lean(); // Convert to plain JavaScript objects

    // Calculate statistics
    const completedRides = rides.filter(ride => ride.status === 'completed');
    const totalSpent = completedRides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalDistance = completedRides.reduce((sum, ride) => sum + ride.distance, 0);

    // Map rides to include only necessary information
    const rideHistory = rides.map(ride => ({
      id: ride._id,
      date: ride.createdAt,
      startAddress: ride.startLocation.address,
      destinationAddress: ride.destinationLocation.address,
      fare: ride.fare,
      status: ride.status,
      distance: ride.distance,
      driverName: ride.driverDetails?.name || 'N/A',
      driverRating: ride.driverDetails?.rating || 0
    }));

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rating: user.rating,
        wallet: user.money,
        verificationStatus: user.verificationStatus,
        joinedDate: user.createdAt
      },
      statistics: {
        totalRides: rides.length,
        completedRides: completedRides.length,
        cancelledRides: rides.filter(ride => ride.status === 'cancelled').length,
        totalSpent,
        totalDistance
      },
      rideHistory
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;