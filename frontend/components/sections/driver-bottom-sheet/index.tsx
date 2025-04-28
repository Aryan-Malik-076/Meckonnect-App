import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Socket } from "socket.io-client";
import { RideStatus, User, UserLocation } from "@/@types";
import { driverBottomSheetStyles } from "./styles";
import axios from "axios";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Geolocation from "react-native-geolocation-service";
import * as Location from "expo-location";
import { useDriverContext } from "@/contexts/driver-context";

interface PassengerRideRequest {
  passengerId: string;
  startLocation: UserLocation;
  destinationLocation: UserLocation;
  rideId: string;
}

export const DriverBottomSheet = ({
  socket,
  userAuth,
  rideStatus,
  setRideStatus,
  currentLocation,
  setCurrentLocation,
  setDestinationLocation
}: {
  socket: Socket;
  userAuth: User | null;
  rideStatus: RideStatus | null;
  setRideStatus: (status: RideStatus) => void;
  currentLocation: UserLocation | null;
  setCurrentLocation: (location: UserLocation | null) => void;
  setDestinationLocation: (location: UserLocation | null) => void;
}) => {
  const {
    currentRide,
    handleAcceptRide: contextHandleAcceptRide,
    setCurrentRide,
  } = useDriverContext();

  // Modify the fetchCurrentLocation function
  const fetchCurrentLocation = async (
    setCurrentLocation: (location: UserLocation | null) => void
  ) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      Alert.alert("Permission Denied", "Location permission is required.");
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Failed to fetch location.");
    }
  };

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const [currentRideRequests, setCurrentRideRequests] = useState<PassengerRideRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PassengerRideRequest | null>(null);
  const [viewRouteCoordinates, setViewRouteCoordinates] = useState<any[]>([]);
  const snapPoints = useMemo(() => ["5%", "50%", "90%"], []);
  const [loading, setLoading] = useState(false);

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
      }
    }, 30000); // 30-second interval

    return () => clearInterval(locationInterval);
  }, [currentRide, userAuth?.id, socket, rideStatus]);

  useEffect(() => {
    // Start location updates when the component mounts or ride status changes
    const stopLocationUpdates = startLocationUpdates();

    return () => {
      stopLocationUpdates(); // Cleanup on unmount
    };
  }, [startLocationUpdates, rideStatus]);

  useEffect(() => {
    fetchCurrentLocation(setCurrentLocation);
    socket.emit("register_user", {
      userId: userAuth?.id,
      type: userAuth?.role,
    });

    const handleRideRequest = (rideRequest: PassengerRideRequest) => {
      console.log("Ride request:", rideRequest);
      setCurrentRideRequests((prev) => [...prev, rideRequest]);
    };

    const handlePassengerConfirmed = (confirmData: any) => {
      setRideStatus(RideStatus.pickingUp);
      setCurrentRide(confirmData);
      getRouteCoordinates(currentLocation!, confirmData.startLocation);
    };

    const handleRideCreated = (rideData: any) => {
      setRideStatus(RideStatus.pickingUp);
      setCurrentRideRequests([]);
      setSelectedRequest(null);
      setCurrentRide(rideData);
      if (rideData.startLocation && rideData.destinationLocation) {
        getRouteCoordinates(rideData.startLocation, rideData.destinationLocation);
      }
    };

    const handleLocationUpdate = (locationData: any) => {
      if (currentRide && locationData.role === 'passenger') {
        // Update passenger marker on map
        if (mapRef.current && locationData.location) {
          mapRef.current.animateToRegion({
            latitude: locationData.location.latitude,
            longitude: locationData.location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
      }
    };

    const handleRideCompleted = () => {
      setRideStatus(RideStatus.idle);
      setCurrentRide(null);
      setViewRouteCoordinates([]);
      bottomSheetRef.current?.snapToIndex(1);
    };

    const handleRideCancelled = (rideId: string) => {
      setCurrentRideRequests((prev) =>
        prev.filter((request) => request.rideId !== rideId)
      );
      if (selectedRequest?.rideId === rideId) {
        setSelectedRequest(null);
        setViewRouteCoordinates([]);
      }
    };

    socket.on("passenger_ride_request", handleRideRequest);
    socket.on("passenger_confirmed", handlePassengerConfirmed);
    socket.on("ride_created", handleRideCreated);
    socket.on("location_update", handleLocationUpdate);
    socket.on("ride_completed", handleRideCompleted);
    socket.on("ride_cancelled", handleRideCancelled);

    return () => {
      socket.off("passenger_ride_request", handleRideRequest);
      socket.off("passenger_confirmed", handlePassengerConfirmed);
      socket.off("ride_created", handleRideCreated);
      socket.off("location_update", handleLocationUpdate);
      socket.off("ride_completed", handleRideCompleted);
      socket.off("ride_cancelled", handleRideCancelled);
    };
  }, [socket, setRideStatus, currentLocation, selectedRequest, currentRide]);

  const onAcceptRide = useCallback(async () => {
    try {
      if (!selectedRequest) {
        Alert.alert("Error", "No ride request selected");
        return;
      }

      if (!userAuth?.id || !userAuth?.username) {
        Alert.alert("Error", "Driver information not available");
        return;
      }

      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to accept rides");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('Accepting ride with request:', selectedRequest);

      const acceptData = {
        ...selectedRequest,
        driverId: userAuth.id,
        username: userAuth.username,
        driverLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };

      console.log('Sending acceptance data:', acceptData);
      await contextHandleAcceptRide(acceptData);

      // Remove the accepted request from the list
      setCurrentRideRequests(prev =>
        prev.filter(request => request.rideId !== selectedRequest.rideId)
      );
      setSelectedRequest(null);

    } catch (error) {
      console.error("Error accepting ride:", error);
      Alert.alert("Error", "Failed to accept ride. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [contextHandleAcceptRide, selectedRequest, userAuth]);

  const handleRejectRide = useCallback(() => {
    if (!selectedRequest) return;

    socket.emit("driver_reject_ride", {
      rideId: selectedRequest.rideId,
      driverId: userAuth?.id,
      passengerId: selectedRequest.passengerId,
    });

    setSelectedRequest(null);
    setViewRouteCoordinates([]);
  }, [selectedRequest, socket, userAuth]);

  const getRouteCoordinates = useCallback(async (start: UserLocation, end: UserLocation) => {
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

        setViewRouteCoordinates(coordinates);

        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error("Routing error:", error);
      Alert.alert("Error", "Failed to get route");
    }
  }, []);

  const handleRideRequestView = async (rideRequest: PassengerRideRequest) => {
    setLoading(true);
    setSelectedRequest(rideRequest);
    const { startLocation, destinationLocation } = rideRequest;
    await getRouteCoordinates(startLocation, destinationLocation);
    setLoading(false);
  };

  const renderRideRequests = () => (
    <View style={driverBottomSheetStyles.requestsContainer}>
      {currentRideRequests.map((request) => (
        <TouchableOpacity
          key={request.rideId}
          style={[
            driverBottomSheetStyles.requestItem,
            selectedRequest?.rideId === request.rideId &&
            driverBottomSheetStyles.selectedRequest,
          ]}
          onPress={() => handleRideRequestView(request)}
        >
          <Text style={driverBottomSheetStyles.requestText}>
            Ride Request from {request.passengerId}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCurrentRide = () => {
    if (!currentRide) return null;

    return (
      <View style={driverBottomSheetStyles.currentRideContainer}>
        <Text style={driverBottomSheetStyles.currentRideTitle}>Current Ride</Text>
        <Text>Passenger: {currentRide.passengerDetails.name}</Text>
        <Text>Status: {currentRide.status}</Text>
        <Text>Fare: ${currentRide.fare.toFixed(3)}</Text>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
    >
      <BottomSheetView style={driverBottomSheetStyles.container}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#0000ff" />
            <TouchableOpacity onPress={() => setLoading(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>

            {currentRide ? (
              renderCurrentRide()
            ) : (
              <>
                {renderRideRequests()}
                {selectedRequest && (
                  <View style={driverBottomSheetStyles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        driverBottomSheetStyles.button,
                        driverBottomSheetStyles.acceptButton,
                      ]}
                      onPress={onAcceptRide}
                    >
                      <Text style={driverBottomSheetStyles.buttonText}>
                        Accept Ride
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        driverBottomSheetStyles.button,
                        driverBottomSheetStyles.rejectButton,
                      ]}
                      onPress={handleRejectRide}
                    >
                      <Text style={driverBottomSheetStyles.buttonText}>
                        Reject
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};