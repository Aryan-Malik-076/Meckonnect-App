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
import { PermissionsAndroid, Platform, Alert } from "react-native";
import Geolocation from "react-native-geolocation-service";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../auth-context";
import * as Location from "expo-location";


interface CurrentRide {
  rideId: string;
  passengerDetails: {
    name: string;
    rating: number;
  };
  passengerLocation: UserLocation;
  startLocation: UserLocation;
  destinationLocation: UserLocation;
  status: RideStatus;
  fare: number;
}

type DriverContextType = {
  currentLocation: UserLocation | null;
  startLocation: UserLocation | null;
  destinationLocation: UserLocation | null;
  routeCoordinates: UserLocation[];
  rideStatus: RideStatus;
  driver: Driver | null;
  isLoading: boolean;
  driverLocation: UserLocation | null;
  currentRide: CurrentRide | null;
  setCurrentLocation: (location: UserLocation | null) => void;
  setStartLocation: (location: UserLocation | null) => void;
  setDestinationLocation: (location: UserLocation | null) => void;
  setRouteCoordinates: (coordinates: UserLocation[]) => void;
  setRideStatus: (status: RideStatus) => void;
  setDriver: (driver: Driver | null) => void;
  setIsLoading: (loading: boolean) => void;
  setDriverLocation: (location: UserLocation | null) => void;
  setCurrentRide: (ride: CurrentRide | null) => void;
  handleAcceptRide: (rideRequest: any) => void;
  socket: Socket;
};

const DriverContext = createContext<DriverContextType | undefined>(undefined);

export const DriverContextProvider = ({
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [driverLocation, setDriverLocation] = useState<UserLocation | null>(null);
  const [currentRide, setCurrentRide] = useState<CurrentRide | null>(null);

  // const requestPermissions = async () => {
  //   if (Platform.OS === "android") {
  //     const granted = await PermissionsAndroid.request(
  //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //       {
  //         title: "Location Access Permission",
  //         message: "This app needs access to your location.",
  //         buttonPositive: "OK",
  //       }
  //     );
  //     return granted === PermissionsAndroid.RESULTS.GRANTED;
  //   }
  //   return true;
  // };

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
            role: 'driver', // Assuming the role is always 'driver' in this context
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

  const handleAcceptRide = useCallback(async (acceptData: any) => {
    console.log('Driver Context - Accepting ride:', acceptData);
    if (!socket) {
      console.error('No socket connection available');
      return;
    }

    try {
      const emitData = {
        passengerId: acceptData.passengerId,
        driverId: acceptData.driverId,
        username: acceptData.username,
        driverLocation: acceptData.driverLocation,
        startLocation: acceptData.startLocation,
        destinationLocation: acceptData.destinationLocation,
      };
      setStartLocation(acceptData.startLocation);
      setDestinationLocation(acceptData.destinationLocation);
      setRideStatus(RideStatus.pickingUp);

      console.log('Emitting driver_accept_ride with data:', emitData);
      socket.emit('driver_accept_ride', emitData);

    } catch (error) {
      console.error('Error in handleAcceptRide:', error);
      throw error; // Re-throw to be handled by the component
    }
  }, [socket]);

  const fetchCurrentLocation = async () => {
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
    // const fetchCurrentLocation = async () => {
    //   const hasPermission = await requestPermissions();
    //   if (!hasPermission) {
    //     Alert.alert(
    //       "Permission Denied",
    //       "Location permission is required to use this feature."
    //     );
    //     return;
    //   }

    //   Geolocation.getCurrentPosition(
    //     (position) => {
    //       setCurrentLocation({
    //         latitude: position.coords.latitude,
    //         longitude: position.coords.longitude,
    //       });
    //     },
    //     (error) => {
    //       console.error(error);
    //       Alert.alert("Error", "Unable to fetch location. Please try again.");
    //     },
    //     { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    //   );
    // };

    fetchCurrentLocation();
    socket.emit("register_user", {
      userId: userAuth?.id,
      type: "verified-driver",
    });

    const handlePassengerRideRequest = (rideRequest: any) => {
      Alert.alert(
        "New Ride Request",
        `Passenger needs a ride from ${rideRequest.startLocation.address || 'pickup location'} to ${rideRequest.destinationLocation.address || 'destination'}`,
        [
          {
            text: "Decline",
            style: "cancel"
          },
          {
            text: "Accept",
            onPress: () => handleAcceptRide(rideRequest)
          }
        ]
      );
    };

    const handleRideCreated = (rideData: any) => {
      setCurrentRide({
        rideId: rideData.rideId,
        passengerDetails: {
          name: rideData.passengerDetails?.name || 'Unknown Passenger',
          rating: rideData.passengerDetails?.rating || 0
        },
        passengerLocation: rideData.passengerLocation || null,
        startLocation: rideData.startLocation,
        destinationLocation: rideData.destinationLocation,
        status: rideData.status,
        fare: rideData.fare || 0
      });
      setRideStatus(RideStatus.pickingUp);
      startLocationUpdates();
    };

    const handleLocationUpdate = (locationData: any) => {
      if (locationData.role === 'passenger' && currentRide?.rideId === locationData.rideId) {
        setCurrentRide(prev => prev ? {
          ...prev,
          passengerLocation: locationData.location
        } : null);
      }
    };

    const handleRideCompleted = (completionData: any) => {
      setRideStatus(RideStatus.completed);
      Alert.alert(
        "Ride Completed",
        `Ride completed successfully. Fare: $${completionData.fare}`
      );
      setCurrentRide(null);
    };

    socket.on("passenger_ride_request", handlePassengerRideRequest);
    socket.on("ride_created", handleRideCreated);
    socket.on("location_update", handleLocationUpdate);
    socket.on("ride_completed", handleRideCompleted);

    return () => {
      socket.off("passenger_ride_request", handlePassengerRideRequest);
      socket.off("ride_created", handleRideCreated);
      socket.off("location_update", handleLocationUpdate);
      socket.off("ride_completed", handleRideCompleted);
    };
  }, [socket, userAuth, handleAcceptRide, startLocationUpdates]);

  return (
    <DriverContext.Provider
      value={{
        currentLocation,
        startLocation,
        destinationLocation,
        routeCoordinates,
        rideStatus,
        driver,
        isLoading,
        driverLocation,
        currentRide,
        setCurrentLocation,
        setStartLocation,
        setDestinationLocation,
        setRouteCoordinates,
        setRideStatus,
        setDriver,
        setIsLoading,
        setDriverLocation,
        setCurrentRide,
        handleAcceptRide,
        socket,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
};

export const useDriverContext = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error(
      "useDriverContext must be used within a DriverContextProvider"
    );
  }
  return context;
};