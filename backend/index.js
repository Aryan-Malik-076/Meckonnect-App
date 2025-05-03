const express = require('express');
const bodyParser = require('express').json; // No need for body-parser
const connectDB = require('./lib/db');
const cors = require('cors');
require('dotenv').config();
const Stripe = require('stripe');

const { Ride, User, DriverDocuments } = require('./models');
const http = require('http'); // Import http module
const socketIO = require('socket.io'); // Import socket.io
const app = express();
const dotenv = require('dotenv').config();
const { documentController, driverController } = require('./controllers');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const profileRoutes= require('./router/profile.router');
// File: app.js or index.js (add this to your main server file)
const driverRoutes = require('./router/upload.router');
app.use(express.json()); // This enables JSON body parsing
app.use(express.urlencoded({ extended: true })); // Optional: for form-urlencoded data
const mongoose = require('mongoose');



connectDB();

app.use(
  cors({
    origin: ['http://localhost:8081', 'https://production-url.com', 'exp://192.168.228.39:8081', 'exp://192.168.99.139:8081', '*', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.options('*', cors());

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field for security
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});
app.use('/api/profile',profileRoutes);
app.use('/api/driver-profile', driverController)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Accessing the Stripe secret key from environment variables

// Endpoint to create a Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  try {
    // Convert the fare to cents (Stripe requires amounts in cents)
    const amountInCents = Math.round(amount * 100); // Round to avoid decimal issues

    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents, // Amount in cents
      currency: 'usd', // Currency
    });

    // Send the client secret to the frontend
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating Payment Intent:", error);
    res.status(400).send({ error: error.message });
  }
});
// API Route 2: Get driver documents by user ID
app.get('/api/driver-documents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Find the driver documents
    const documents = await DriverDocuments.findOne({ userId });

    if (!documents) {
      return res.status(404).json({ success: false, message: 'No documents found for this user' });
    }

    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching driver documents:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to GoHer API');
});// Document upload routes

app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Validate the role
    const validRoles = ['user', 'passenger', 'driver', 'verified-passenger', 'driver-status-1', 'driver-status-2', 'verified-driver', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be one of: ' + validRoles.join(', ')
      });
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update the verification status if the role is related to verification
    let verificationStatus = updatedUser.verificationStatus;
    if (role === 'verified-driver') {
      verificationStatus = 'email-verified';
    } else if (role === 'driver-status-1' || role === 'driver-status-2' || role === 'driver') {
      // Keep the existing status or set to email-verified if it's not-verified
      verificationStatus = updatedUser.verificationStatus === 'email-verified' ? 'email-verified' : updatedUser.verificationStatus;
    }

    // Update verification status if it changed
    if (verificationStatus !== updatedUser.verificationStatus) {
      updatedUser.verificationStatus = verificationStatus;
      await updatedUser.save();
    }

    // If user becomes a verified driver, update their documents status
    if (role === 'verified-driver') {
      await DriverDocuments.findOneAndUpdate(
        { userId },
        { overallStatus: 'approved' },
        { new: true }
      );
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

app.use('/api/auth', require('./controllers/auth.controller'));
app.use('/api/driver', driverRoutes);
app.use(bodyParser());
const server = http.createServer(app); // Create server using express app

const io = socketIO(server);


const activeUsers = {};
const activeDrivers = {};

function calculateDistance(loc1, loc2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Add this helper function at the top of index.js with other utility functions
function isNearLocation(currentLoc, targetLoc, threshold = 0.1) {
  // threshold in kilometers (100 meters default)
  const distance = calculateDistance(currentLoc, targetLoc);
  return distance <= threshold;
}

// Calculate fare based on distance
function calculateFare(distance) {
  const BASE_FARE = 5;
  const PER_KM_RATE = 2;
  return BASE_FARE + (distance * PER_KM_RATE);
}

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);

  socket.on('register_user', async (userData) => {
    console.log('User Data:', userData);
    try {
      if (userData.type === 'verified-driver') {
        activeDrivers[userData.userId] = {
          socketId: socket.id,
          status: 'available',
        };
        console.log('driver registered')
      } else if (userData.type === 'verified-passenger') {
        activeUsers[userData.userId] = socket.id;
        console.log('passenger registered')
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  });

  socket.on('passenger_ride_request', async (rideRequest) => {
    console.log('Ride Request:', rideRequest, activeDrivers);
    try {
      Object.values(activeDrivers)
        .filter(driver => driver.status === 'available')
        .forEach(driver => {
          io.to(driver.socketId).emit('passenger_ride_request', rideRequest);
        });
      console.log('Ride Request Created');
    } catch (error) {
      console.error('Ride Request Error:', error);
    }
  });

  socket.on('driver_accept_ride', async (acceptedData) => {
    console.log('asd', acceptedData)
    try {
      console.log(activeUsers)
      if (acceptedData && activeUsers[acceptedData.passengerId]) {
        console.log('s')
        io.to(activeUsers[acceptedData.passengerId]).emit('driver_request', {
          driverId: acceptedData.driverId,
          name: acceptedData.username,
          driverDistance: calculateDistance(acceptedData.driverLocation, acceptedData.startLocation),
          driverLocation: acceptedData.driverLocation,
        });
        console.log('Ride Accepted');

      }
    } catch (error) {
      console.error('Driver Accept Ride Error:', error);
    }
  });

  socket.on('passenger_accept_driver', async (acceptedData) => {
    try {
      console.log('Received passenger_accept_driver data:', acceptedData); // Debug log

      if (acceptedData && activeDrivers[acceptedData.driverId]) {
        // Fetch driver and passenger details
        const driver = await User.findById(acceptedData.driverId);
        const passenger = await User.findById(acceptedData.passengerId);

        if (!driver || !passenger) {
          console.error('Driver or passenger not found');
          return;
        }

        // Calculate distance and fare
        const distance = calculateDistance(
          acceptedData.startLocation,
          acceptedData.destinationLocation
        );
        const fare = calculateFare(distance);

        const ride = new Ride({
          passengerId: acceptedData.passengerId,
          driverId: acceptedData.driverId,
          startLocation: acceptedData.startLocation,
          destinationLocation: acceptedData.destinationLocation,
          status: 'picking_up',
          distance: distance,
          fare: fare,
          driverDetails: {
            name: driver.username,
            rating: driver.rating
          },
          passengerDetails: {
            name: passenger.username,
            rating: passenger.rating
          },
          currentLocations: {
            driver: {
              latitude: acceptedData.driverLocation.latitude,
              longitude: acceptedData.driverLocation.longitude,
              lastUpdated: new Date()
            },
            passenger: {
              latitude: acceptedData.startLocation.latitude,
              longitude: acceptedData.startLocation.longitude,
              lastUpdated: new Date()
            }
          }
        });

        await ride.save();
        console.log('Ride created successfully:', ride); // Debug log

        // Update driver status and store ride ID
        activeDrivers[acceptedData.driverId].status = 'occupied';
        activeDrivers[acceptedData.driverId].currentRideId = ride._id;

        // Update passenger socket info
        const passengerSocketId = activeUsers[acceptedData.passengerId];
        activeUsers[acceptedData.passengerId] = {
          socketId: passengerSocketId,
          currentRideId: ride._id
        };

        // Emit to passenger
        if (activeUsers[acceptedData.passengerId]) {
          io.to(typeof activeUsers[acceptedData.passengerId] === 'string'
            ? activeUsers[acceptedData.passengerId]
            : activeUsers[acceptedData.passengerId].socketId
          ).emit('ride_created', {
            rideId: ride._id,
            driverDetails: ride.driverDetails,
            driverLocation: ride.currentLocations.driver,
            fare: ride.fare,
            status: ride.status,
            startLocation: ride.startLocation,
            destinationLocation: ride.destinationLocation
          });
        }

        // Emit to driver
        if (activeDrivers[acceptedData.driverId]) {
          io.to(activeDrivers[acceptedData.driverId].socketId).emit('ride_created', {
            rideId: ride._id,
            passengerDetails: ride.passengerDetails,
            passengerLocation: ride.currentLocations.passenger,
            fare: ride.fare,
            status: ride.status,
            startLocation: ride.startLocation,
            destinationLocation: ride.destinationLocation
          });
        }

        console.log('Ride details emitted to both parties');
      } else {
        console.error('Invalid accept data or driver not available');
      }
    } catch (error) {
      console.error('Passenger Accept Driver Error:', error);
    }
  });

  socket.on('update_location', async (locationData) => {
    try {
      const { userId, location, role } = locationData;

      // Find active ride for the user
      let currentRideId;
      let userActiveEntry;

      if (role === 'driver') {
        userActiveEntry = activeDrivers[userId];
      } else {
        userActiveEntry = activeUsers[userId];
      }

      // Ensure user is part of an active ride
      if (!userActiveEntry || !userActiveEntry.currentRideId) {
        console.log('No active ride for user');
        return;
      }

      currentRideId = userActiveEntry.currentRideId;

      const ride = await Ride.findById(currentRideId);
      if (!ride || ['completed', 'cancelled'].includes(ride.status)) {
        console.log('Ride not active or found');
        return;
      }

      // Determine update logic based on ride status
      const updateField = role === 'driver' ? 'currentLocations.driver' : 'currentLocations.passenger';
      const locationUpdate = {
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: new Date()
      };

      // Update ride document with new location
      const updatedRide = await Ride.findByIdAndUpdate(
        currentRideId,
        {
          [updateField]: locationUpdate,
          ...(ride.status === 'picking_up' && role === 'driver' &&
            isNearLocation(location, ride.startLocation)
            ? { status: 'in_progress' }
            : {})
        },
        { new: true }
      );

      // Transition ride status if needed
      if (updatedRide.status === 'in_progress') {
        const driverAtDestination = isNearLocation(
          updatedRide.currentLocations.driver,
          updatedRide.destinationLocation
        );
        const passengerAtDestination = isNearLocation(
          updatedRide.currentLocations.passenger,
          updatedRide.destinationLocation
        );

        if (driverAtDestination && passengerAtDestination) {
          // Complete the ride
          updatedRide.status = 'completed';
          await updatedRide.save();

          // Notify parties
          const notifyParties = async (userId, socketMap) => {
            const userEntry = socketMap[userId];
            if (userEntry) {
              const socketId = typeof userEntry === 'string'
                ? userEntry
                : userEntry.socketId;

              io.to(socketId).emit('ride_completed', {
                rideId: updatedRide._id,
                finalLocation: updatedRide.destinationLocation,
                fare: updatedRide.fare
              });
            }
          };

          await notifyParties(updatedRide.passengerId, activeUsers);
          await notifyParties(updatedRide.driverId, activeDrivers);

          // Clean up active ride references
          if (activeDrivers[updatedRide.driverId]) {
            activeDrivers[updatedRide.driverId].status = 'available';
            delete activeDrivers[updatedRide.driverId].currentRideId;
          }
          if (activeUsers[updatedRide.passengerId]) {
            delete activeUsers[updatedRide.passengerId].currentRideId;
          }

          console.log(`Ride ${updatedRide._id} completed successfully`);
          return;
        }
      }

      // Broadcast location update to the other party
      const broadcastLocation = (recipientMap, recipientId) => {
        const recipientEntry = recipientMap[recipientId];
        if (recipientEntry) {
          const socketId = typeof recipientEntry === 'string'
            ? recipientEntry
            : recipientEntry.socketId;

          io.to(socketId).emit('location_update', {
            role: role,
            location: location,
            rideId: currentRideId,
            status: updatedRide.status
          });
        }
      };

      if (role === 'driver') {
        broadcastLocation(activeUsers, ride.passengerId);
      } else {
        broadcastLocation(activeDrivers, ride.driverId);
      }

    } catch (error) {
      console.error('Location Update Error:', error);
    }
  });

  socket.on('get_ride_details', async (data) => {
    try {
      const ride = await Ride.findById(data.rideId);
      if (!ride) {
        socket.emit('ride_details_error', { message: 'Ride not found' });
        return;
      }

      const isDriver = ride.driverId.toString() === data.userId;
      const isPassenger = ride.passengerId.toString() === data.userId;

      if (!isDriver && !isPassenger) {
        socket.emit('ride_details_error', { message: 'Unauthorized' });
        return;
      }

      socket.emit('ride_details', {
        rideId: ride._id,
        status: ride.status,
        fare: ride.fare,
        startLocation: ride.startLocation,
        destinationLocation: ride.destinationLocation,
        currentLocations: ride.currentLocations,
        ...(isDriver ? {
          passengerDetails: ride.passengerDetails,
          passengerLocation: ride.currentLocations.passenger
        } : {}),
        ...(isPassenger ? {
          driverDetails: ride.driverDetails,
          driverLocation: ride.currentLocations.driver
        } : {})
      });
    } catch (error) {
      console.error('Get Ride Details Error:', error);
      socket.emit('ride_details_error', { message: 'Server error' });
    }
  });


  socket.on('disconnect', () => {
    for (const [userId, socketId] of Object.entries(activeUsers)) {
      if (socketId === socket.id) {
        delete activeUsers[userId];
        delete activeDrivers[userId];
        break;
      }
    }
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
