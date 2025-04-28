import { Driver, RideStatus, UserLocation } from "@/@types";
import { DEFAULT_URL } from "@/lib/constants";
import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../auth-context";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import Geolocation from "react-native-geolocation-service";
import * as Location from "expo-location";
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';


type PassengerContextType = {
  currentLocation: UserLocation | null;
  startLocation: UserLocation | null;
  destinationLocation: UserLocation | null;
  routeCoordinates: UserLocation[];
  rideStatus: RideStatus;
  driver: Driver | null;
  isLoading: { [key: string]: boolean } | null;
  driverLocation: UserLocation | null;
  availableDrivers: AvailableDrivers[];
  currentRide: CurrentRide | null;
  setCurrentLocation: (location: UserLocation | null) => void;
  setStartLocation: (location: UserLocation | null) => void;
  setDestinationLocation: (location: UserLocation | null) => void;
  setRouteCoordinates: (coordinates: UserLocation[]) => void;
  setRideStatus: (status: RideStatus) => void;
  setDriver: (driver: Driver | null) => void;
  setIsLoading: (loading: { [key: string]: boolean } | null) => void;
  setDriverLocation: (location: UserLocation | null) => void;
  setAvailableDrivers: (drivers: any[]) => void;
  setCurrentRide: (ride: any) => void;
  handleRequestRide: () => void;
  handleCancelRide: () => void;
  handleAcceptDriver: (driver: any) => void;
  socket: Socket;
};

export interface AvailableDrivers {
  driverId: string;
  driverDistance: number;
  driverLocation: UserLocation;
  name: string;
}

export interface CurrentRide {
  rideId: string;
  driverId: string;
  driverName: string;
  passengerId: string;
  startLocation: UserLocation;
  destinationLocation: UserLocation;
  status: RideStatus;
  fare?: number;
}

const PassengerContext = createContext<PassengerContextType | undefined>(undefined);

export const PassengerContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { userAuth } = useAuth();
  const socket = useMemo(() => io(DEFAULT_URL), []);
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [startLocation, setStartLocation] = useState<UserLocation | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<UserLocation | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<UserLocation[]>([]);
  const [rideStatus, setRideStatus] = useState<RideStatus>(RideStatus.idle);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean } | null>(null);
  const [driverLocation, setDriverLocation] = useState<UserLocation | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDrivers[]>([]);
  const [currentRide, setCurrentRide] = useState<CurrentRide | null>(null);

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  };
  
  const startLocationUpdates = useCallback(() => {
    const locationInterval = setInterval(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          console.warn('Location permission not granted');
          return;
        }
  
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        // Update current location
        setCurrentLocation(userLocation);
        
        // Validate ride context before emitting
        if (currentRide?.rideId) {
          const updatePayload = {
            userId: userAuth?.id,
            location: userLocation,
            role: 'passenger', // Assuming the role is always 'passenger' in this context
            rideId: currentRide.rideId
          };
  
          // Emit location update only if ride is active
          if (rideStatus !== RideStatus.completed && rideStatus !== RideStatus.idle) {
            socket.emit('update_location', updatePayload);
          }
        }
      } catch (error) {
        console.error('Location update error:', error);
        // Optional: Add more granular error handling or user notification
      }
    }, 30000); // 30-second interval
    return () => clearInterval(locationInterval);
  }, [currentRide, userAuth?.id, socket, rideStatus]);
  
  const getCurrentLocation = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Permission Denied",
        "Location permission is required to use this feature."
      );
      return;
    }
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to fetch location. Please try again.");
    }
  };

  useEffect(() => {

    getCurrentLocation();
    socket.emit("register_user", {
      userId: userAuth?.id,
      type: "verified-passenger",
    });

    const handlePassengerRideRequest = (rideRequest: any) => {
      setAvailableDrivers(rideRequest.nearbyDrivers || []);
      setRideStatus(RideStatus.driverFound);
    };

    const handleDriverRequest = (driverData: AvailableDrivers) => {
      setRideStatus(RideStatus.driverFound);
      const driversRequest = [...availableDrivers];
      driversRequest.push(driverData);
      setAvailableDrivers(driversRequest);
    };

    const handleRideCreated = (rideData: any) => {
      setCurrentRide({
        rideId: rideData.rideId,
        driverId: rideData.driverDetails?.id || '',
        driverName: rideData.driverDetails?.name || 'Unknown Driver',
        passengerId: userAuth?.id || '',
        startLocation: rideData.startLocation,
        destinationLocation: rideData.destinationLocation,
        status: rideData.status,
        fare: rideData.fare || 0
      });
      setRideStatus(RideStatus.pickingUp);
      startLocationUpdates();
    };

    const handleLocationUpdate = (locationData: any) => {
      if (locationData.role === 'driver') {
        setDriverLocation(locationData.location);
      }
    };

    const handleRideCompleted = (completionData: any) => {
      setRideStatus(RideStatus.completed);
      Alert.alert(
        "Ride Completed",
        `Your ride has been completed. Total fare: $${completionData.fare}`
      );
      setCurrentRide(null);
      setDriverLocation(null);
    };

    socket.on("passenger_ride_request", handlePassengerRideRequest);
    socket.on("driver_request", handleDriverRequest);
    socket.on("ride_created", handleRideCreated);
    socket.on("location_update", handleLocationUpdate);
    socket.on("ride_completed", handleRideCompleted);

    return () => {
      socket.off("passenger_ride_request", handlePassengerRideRequest);
      socket.off("driver_request", handleDriverRequest);
      socket.off("ride_created", handleRideCreated);
      socket.off("location_update", handleLocationUpdate);
      socket.off("ride_completed", handleRideCompleted);
    };
  }, [socket, userAuth, availableDrivers, startLocationUpdates]);

  const handleRequestRide = useCallback(() => {
    if (!startLocation || !destinationLocation) return;
    setRideStatus(RideStatus.searching);
    socket.emit("passenger_ride_request", {
      passengerId: userAuth?.id,
      startLocation,
      destinationLocation,
    });
  }, [startLocation, destinationLocation, socket, userAuth]);

  const handleCancelRide = useCallback(() => {
    socket.emit("passenger_cancel_ride", {
      passengerId: userAuth?.id,
    });
    setRideStatus(RideStatus.idle);
    setAvailableDrivers([]);
    setCurrentRide(null);
  }, [socket, userAuth]);

  const handleAcceptDriver = useCallback(
    (acceptData: any) => {
      if (!socket) {
        console.error('No socket connection available');
        return;
      }
  
      try {
        // Include driverLocation from the available drivers data
        const selectedDriver = availableDrivers.find(
          driver => driver.driverId === acceptData.driverId
        );
  
        if (!selectedDriver) {
          console.error('Selected driver not found in available drivers');
          return;
        }
  
        console.log('Emitting passenger_accept_driver with data:', acceptData);
        socket.emit('passenger_accept_driver', {
          passengerId: acceptData.passengerId,
          driverId: acceptData.driverId,
          startLocation: acceptData.startLocation,
          destinationLocation: acceptData.destinationLocation,
          driverLocation: selectedDriver.driverLocation // Add this
        });
        
        setRideStatus(RideStatus.pickingUp);
      } catch (error) {
        console.error('Error in handleAcceptDriver:', error);
        Alert.alert('Error', 'Failed to accept driver. Please try again.');
      }
    },
    [socket, setRideStatus, availableDrivers] // Add availableDrivers to dependencies
  );

  return (
    <PassengerContext.Provider
      value={{
        currentLocation,
        startLocation,
        destinationLocation,
        routeCoordinates,
        rideStatus,
        driver,
        isLoading,
        driverLocation,
        availableDrivers,
        currentRide,
        setCurrentLocation,
        setStartLocation,
        setDestinationLocation,
        setRouteCoordinates,
        setRideStatus,
        setDriver,
        setIsLoading,
        setDriverLocation,
        setAvailableDrivers,
        setCurrentRide,
        handleRequestRide,
        handleCancelRide,
        handleAcceptDriver,
        socket,
      }}
    >
      {children}
    </PassengerContext.Provider>
  );
};

export const usePassengerContext = () => {
  const context = useContext(PassengerContext);
  if (!context) {
    throw new Error(
      "usePassengerContext must be used within a PassengerContextProvider"
    );
  }
  return context;
};