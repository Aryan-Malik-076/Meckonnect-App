// test-ride-flow.js
const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5001';
const driverSocket = io(SOCKET_URL);
const passengerSocket = io(SOCKET_URL);

// Test data
const testData = {
    driverId: '678ccdbd7cafc32a7ec69a8e',  // Your test user ID
    passengerId: '678ccdbd7cafc32a7ec69a8e',  // Your test user ID
    startLocation: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: "Test Start Location"
    },
    destinationLocation: {
        latitude: 37.7858,
        longitude: -122.4064,
        address: "Test Destination"
    },
    driverLocation: {
        latitude: 37.7750,
        longitude: -122.4180
    }
};

let currentRideId = null;
let driverLocationInterval;
let passengerLocationInterval;

// Driver Socket Events
driverSocket.on('connect', () => {
    console.log('Driver socket connected');
    
    // Register driver
    driverSocket.emit('register_user', {
        userId: testData.driverId,
        type: 'verified-driver'
    });
});

driverSocket.on('passenger_ride_request', (request) => {
    console.log('Driver received ride request:', request);
    
    // Simulate driver accepting the ride
    setTimeout(() => {
        const acceptData = {
            driverId: testData.driverId,
            passengerId: testData.passengerId,
            username: 'Test Driver',
            driverLocation: testData.driverLocation,
            startLocation: testData.startLocation
        };
        console.log('Driver sending accept data:', acceptData);
        driverSocket.emit('driver_accept_ride', acceptData);
    }, 1000);
});

driverSocket.on('ride_created', (rideData) => {
    console.log('Driver received ride creation confirmation:', rideData);
    currentRideId = rideData.rideId;
    startDriverLocationUpdates();
});

driverSocket.on('location_update', (locationData) => {
    console.log('Driver received location update:', locationData);
});

driverSocket.on('ride_completed', (completionData) => {
    console.log('Driver received ride completion notification:', completionData);
    // Stop sending location updates
    if (driverLocationInterval) {
        clearInterval(driverLocationInterval);
        console.log('Driver location updates stopped');
    }
});

// Passenger Socket Events
passengerSocket.on('connect', () => {
    console.log('Passenger socket connected');
    
    // Register passenger
    passengerSocket.emit('register_user', {
        userId: testData.passengerId,
        type: 'verified-passenger'
    });
    
    // Start the test flow after a short delay
    setTimeout(startTestFlow, 2000);
});

passengerSocket.on('driver_request', (driverData) => {
    console.log('Passenger received driver request:', driverData);
    
    // Simulate passenger accepting the driver
    setTimeout(() => {
        const acceptData = {
            passengerId: testData.passengerId,
            driverId: testData.driverId,
            startLocation: testData.startLocation,
            destinationLocation: testData.destinationLocation,
            driverLocation: testData.driverLocation
        };
        console.log('Passenger sending accept data:', acceptData);
        passengerSocket.emit('passenger_accept_driver', acceptData);
    }, 1000);
});

passengerSocket.on('ride_created', (rideData) => {
    console.log('Passenger received ride creation confirmation:', rideData);
    currentRideId = rideData.rideId;
    startPassengerLocationUpdates();
});

passengerSocket.on('location_update', (locationData) => {
    console.log('Passenger received location update:', locationData);
});

passengerSocket.on('ride_completed', (completionData) => {
    console.log('Passenger received ride completion notification:', completionData);
    // Stop sending location updates
    if (passengerLocationInterval) {
        clearInterval(passengerLocationInterval);
        console.log('Passenger location updates stopped');
    }
});

// Helper Functions
function startTestFlow() {
    console.log('Starting test flow...');
    passengerSocket.emit('passenger_ride_request', {
        passengerId: testData.passengerId,
        startLocation: testData.startLocation,
        destinationLocation: testData.destinationLocation
    });
}

function startDriverLocationUpdates() {
    let currentLat = testData.driverLocation.latitude;
    let currentLng = testData.driverLocation.longitude;
    const destinationLat = testData.destinationLocation.latitude;
    const destinationLng = testData.destinationLocation.longitude;
    
    // Calculate step size to reach destination in approximately 30 seconds
    const steps = 30;
    const latStep = (destinationLat - currentLat) / steps;
    const lngStep = (destinationLng - currentLng) / steps;
    
    driverLocationInterval = setInterval(() => {
        // Update current position
        currentLat += latStep;
        currentLng += lngStep;
        
        // Check if we've reached destination (with some tolerance)
        if (Math.abs(currentLat - destinationLat) < 0.0001 && 
            Math.abs(currentLng - destinationLng) < 0.0001) {
            // Set exact destination coordinates for final update
            currentLat = destinationLat;
            currentLng = destinationLng;
        }
        
        const location = {
            latitude: currentLat,
            longitude: currentLng
        };
        
        driverSocket.emit('update_location', {
            userId: testData.driverId,
            role: 'driver',
            location: location
        });
        
        console.log('Driver location updated:', location);
        
        // If we've reached destination, clear interval
        if (currentLat === destinationLat && currentLng === destinationLng) {
            clearInterval(driverLocationInterval);
            console.log('Driver reached destination');
        }
    }, 1000); // Update every second
}

function startPassengerLocationUpdates() {
    let currentLat = testData.startLocation.latitude;
    let currentLng = testData.startLocation.longitude;
    const destinationLat = testData.destinationLocation.latitude;
    const destinationLng = testData.destinationLocation.longitude;
    
    // Calculate step size to reach destination in approximately 30 seconds
    const steps = 30;
    const latStep = (destinationLat - currentLat) / steps;
    const lngStep = (destinationLng - currentLng) / steps;
    
    passengerLocationInterval = setInterval(() => {
        // Update current position
        currentLat += latStep;
        currentLng += lngStep;
        
        // Check if we've reached destination (with some tolerance)
        if (Math.abs(currentLat - destinationLat) < 0.0001 && 
            Math.abs(currentLng - destinationLng) < 0.0001) {
            // Set exact destination coordinates for final update
            currentLat = destinationLat;
            currentLng = destinationLng;
        }
        
        const location = {
            latitude: currentLat,
            longitude: currentLng
        };
        
        passengerSocket.emit('update_location', {
            userId: testData.passengerId,
            role: 'passenger',
            location: location
        });
        
        console.log('Passenger location updated:', location);
        
        // If we've reached destination, clear interval
        if (currentLat === destinationLat && currentLng === destinationLng) {
            clearInterval(passengerLocationInterval);
            console.log('Passenger reached destination');
        }
    }, 1000); // Update every second
}

// Error handling
driverSocket.on('error', (error) => {
    console.error('Driver socket error:', error);
});

passengerSocket.on('error', (error) => {
    console.error('Passenger socket error:', error);
});

// Cleanup
process.on('SIGINT', () => {
    console.log('Cleaning up...');
    if (driverLocationInterval) clearInterval(driverLocationInterval);
    if (passengerLocationInterval) clearInterval(passengerLocationInterval);
    driverSocket.disconnect();
    passengerSocket.disconnect();
    process.exit();
});