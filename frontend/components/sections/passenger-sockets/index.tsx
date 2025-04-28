import { Driver, RideRequest, RideStatus, User, UserLocation } from "@/@types";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { io, Socket } from "socket.io-client";
import { DEFAULT_URL } from "@/lib/constants";

export const PassengerSockets = ({
  startLocation,
  destinationLocation,
  userAuth,
  setRideStatus,
  setRouteCoordinates,
  setDriver,
  setIsLoading,
  setDriverLocation,
  rideStatus,
  setCurrentLocation,
  setStartLocation,
  setDestinationLocation,
  newSocket
}: {
  startLocation: UserLocation | null;
  destinationLocation: UserLocation | null;
  userAuth: User | null;
  setRideStatus: (status: RideStatus) => void;
  setRouteCoordinates: (coordinates: UserLocation[]) => void;
  setDriver: (driver: Driver | null) => void;
  setIsLoading: (loading: boolean) => void;
  setDriverLocation: (location: UserLocation | null) => void;
  rideStatus: RideStatus;
  setCurrentLocation: (location: UserLocation) => void;
  setStartLocation: (location: UserLocation | null) => void;
  setDestinationLocation: (location: UserLocation | null) => void;
  newSocket: Socket;
}) => {
  if (!userAuth) return null;
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (startLocation && destinationLocation) {
      initializeSocket();
      getRouteCoordinates(startLocation, destinationLocation);
    }
  }, [startLocation, destinationLocation]);

  useEffect(() => {
    initializeSocket();
    setupLocationTracking();
    return () => {
      socket?.disconnect();
    };
  }, []);

  const initializeSocket = () => {
    newSocket.on("connect", () => {
      console.log("Socket connected");
      newSocket.emit("register_user", { userId: '234234', type: 'verified-passenger' });
    });
    // newSocket.on("rideAccepted", handleRideAccepted);
    // newSocket.on("rideStarted", handleRideStarted);
    // newSocket.on("rideCompleted", handleRideCompleted);
    // newSocket.on(`driverLocation:${userAuth.id}`, handleDriverLocationUpdate);

    newSocket.on("error", (error: any) => {
      console.error("Socket error:", error);
      Alert.alert("Connection Error", "Failed to connect to the service");
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setTimeout(() => {
        initializeSocket();
      }, 5000);
    });

    setSocket(newSocket);
  };
  const handleRideAccepted = (ride: RideRequest & { driver: Driver }) => {
    setRideStatus(RideStatus.pickingUp);
    setDriver(ride.driver);

    // Get route from driver to pickup location
    if (ride.driver.location && startLocation && ride.driver.location) {
      getRouteCoordinates(ride.driver.location, startLocation);
    }

    Alert.alert(
      "Ride Accepted",
      `${ride.driver.username} is coming to pick you up`,
      [
        {
          text: "Cancel Ride",
          style: "destructive",
          onPress: () => cancelRide(ride.id),
        },
        { text: "OK" },
      ],
      { cancelable: false }
    );
  };

  const handleRideStarted = (ride: RideRequest) => {
    setRideStatus(RideStatus.inProgress);

    if (startLocation && destinationLocation) {
      getRouteCoordinates(startLocation, destinationLocation);
    }

    Alert.alert("Ride Started", "You are now on your way to the destination", [
      { text: "OK" },
    ]);
  };

  const handleRideCompleted = (ride: RideRequest) => {
    setRideStatus(RideStatus.completed);

    Alert.alert("Ride Completed", `Total fare: £${ride.fare.toFixed(2)}`, [
      {
        text: "Rate Driver",
        onPress: () => handleRateDriver(ride.driverId as string),
      },
      {
        text: "OK",
        onPress: resetRide,
      },
    ]);
  };

  const handleDriverLocationUpdate = (location: UserLocation) => {
    setDriverLocation(location);

    if (rideStatus === RideStatus.pickingUp && startLocation) {
      getRouteCoordinates(location, startLocation);
    } else if (rideStatus === RideStatus.inProgress && destinationLocation) {
      getRouteCoordinates(location, destinationLocation);
    }
  };

  const handleRateDriver = async (driverId: string) => {
    Alert.prompt(
      "Rate Driver",
      "Please rate your driver (1-5 stars)",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit",
          onPress: async (rating) => {
            if (!socket) return;

            try {
              socket.emit("rateDriver", {
                driverId,
                rating: parseInt(rating as string, 10),
                customerId: userAuth.id,
              });

              Alert.alert("Thank You", "Your rating has been submitted");
              resetRide();
            } catch (error) {
              console.error("Rating error:", error);
              Alert.alert("Error", "Failed to submit rating");
            }
          },
        },
      ],
      "plain-text",
      "5"
    );
  };

  const requestRide = async () => {
    if (!startLocation || !destinationLocation || !socket) {
      Alert.alert(
        "Error",
        "Please select both pickup and destination locations"
      );
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${startLocation.longitude},${startLocation.latitude};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full`
      );

      const distance = response.data.routes[0].distance / 1000; // Convert to km
      const estimatedFare = calculateEstimatedFare(distance);

      Alert.alert(
        "Confirm Ride Request",
        `Estimated fare: £${estimatedFare.toFixed(
          2
        )}\nDistance: ${distance.toFixed(1)}km`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Confirm",
            onPress: () => {
              socket.emit("requestRide", {
                customerId: userAuth.id,
                startLocation,
                destinationLocation,
                estimatedFare,
                estimatedDistance: distance,
              });

              Alert.alert(
                "Finding Driver",
                "Please wait while we find a driver for you",
                [{ text: "OK" }]
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error("Route calculation error:", error);
      Alert.alert("Error", "Failed to calculate route");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEstimatedFare = (distanceKm: number): number => {
    const BASE_FARE = 2.5;
    const PER_KM_RATE = 1.5;
    const MIN_FARE = 5;

    const calculatedFare = BASE_FARE + distanceKm * PER_KM_RATE;
    return Math.max(calculatedFare, MIN_FARE);
  };

  const cancelRide = (rideId: string) => {
    if (!socket) return;

    Alert.alert("Cancel Ride", "Are you sure you want to cancel this ride?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => {
          socket.emit("cancelRide", {
            rideId,
            customerId: userAuth.id,
            reason: "Customer cancelled",
          });
          resetRide();
        },
      },
    ]);
  };

  const resetRide = () => {
    setStartLocation(null);
    setDestinationLocation(null);
    setDriver(null);
    setRideStatus(RideStatus.searching);
    setDriverLocation(null);
    setRouteCoordinates([]);
  };

  const getRouteCoordinates = async (
    start: UserLocation,
    end: UserLocation
  ) => {
    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
      );

      if (response.data.routes && response.data.routes[0]) {
        const coordinates = response.data.routes[0].geometry.coordinates.map(
          ([longitude, latitude]: number[]) => ({
            latitude,
            longitude,
          })
        );

        setRouteCoordinates(coordinates);
      }
    } catch (error) {
      console.error("Routing error:", error);
      Alert.alert("Error", "Failed to get route");
    }
  };

  const setupLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Please enable location services");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(currentLoc);

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
    }
  };

  return <></>;
};
