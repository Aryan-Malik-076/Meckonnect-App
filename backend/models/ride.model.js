const mongoose = require('mongoose');
const RideSchema = new mongoose.Schema({
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startLocation: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    destinationLocation: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    currentLocations: {
        driver: {
            latitude: Number,
            longitude: Number,
            lastUpdated: Date
        },
        passenger: {
            latitude: Number,
            longitude: Number,
            lastUpdated: Date
        }
    },
    status: {
        type: String,
        enum: ['searching', 'driver_found', 'picking_up', 'in_progress', 'completed', 'cancelled'],
        default: 'searching'
    },
    distance: Number,
    fare: Number,
    driverDetails: {
        name: String,
        rating: Number
    },
    passengerDetails: {
        name: String,
        rating: Number
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', RideSchema);