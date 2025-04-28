import { RideStatus } from "@/@types";
import { DriverAppBar, DriverBottomSheet, DriverMapView } from "@/components/sections";
import { useAuth, useDriverContext } from "@/contexts";
import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const DriverMain = () => {
  const { userAuth } = useAuth();
  const {
    socket,
    currentLocation,
    rideStatus,
    setRideStatus,
    destinationLocation,
    routeCoordinates,
    startLocation,
    setCurrentLocation,
    setRouteCoordinates,
    setDestinationLocation
  } = useDriverContext();
  return (
    <View style={{ flex: 1 }}>
      <GestureHandlerRootView>
        <DriverAppBar />
        <DriverMapView
          setRideStatus={setRideStatus}
          driverLocation={currentLocation}
          setRouteCoordinates={setRouteCoordinates}
          rideStatus={rideStatus}
          currentLocation={currentLocation}
          destinationLocation={destinationLocation}
          routeCoordinates={routeCoordinates}
          startLocation={startLocation}
          setCurrentLocation={setCurrentLocation}
        />
        <DriverBottomSheet
          setCurrentLocation={setCurrentLocation}
          currentLocation={currentLocation}
          rideStatus={rideStatus}
          setRideStatus={setRideStatus}
          socket={socket}
          setDestinationLocation={setDestinationLocation}
          userAuth={userAuth}
          
        />
      </GestureHandlerRootView>
    </View>
  );
};

export default DriverMain;
