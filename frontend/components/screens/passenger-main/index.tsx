import {
  PassengerAppBar,
  UserMapView,
  PassengerBottomSheet,
} from "@/components/sections";
import { useAuth, usePassengerContext } from "@/contexts";
import React from "react";

import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const PassengerMain = () => {
  const { userAuth } = useAuth();
  const {
    destinationLocation,
    currentLocation,
    driver,
    driverLocation,
    isLoading,
    rideStatus,
    routeCoordinates,
    setRideStatus,
    startLocation,
    setDriverLocation,
    setCurrentLocation,
    setDriver,
    setDestinationLocation,
    setIsLoading,
    setRouteCoordinates,
    setStartLocation,
    socket,
  } = usePassengerContext();
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <GestureHandlerRootView>
        <PassengerAppBar
          startLocation={startLocation}
          destinationLocation={destinationLocation}
        />
        <UserMapView
          setCurrentLocation={setCurrentLocation}
          setRouteCoordinates={setRouteCoordinates}
          driverLocation={driverLocation}
          currentLocation={currentLocation}
          startLocation={startLocation}
          destinationLocation={destinationLocation}
          routeCoordinates={routeCoordinates}
          rideStatus={rideStatus}
        />
        <PassengerBottomSheet
          setDestinationLocation={setDestinationLocation}
          setStartLocation={setStartLocation}
          destinationLocation={destinationLocation}
          rideStatus={rideStatus}
          setRideStatus={setRideStatus}
          startLocation={startLocation}
          userAuth={userAuth}
          socket={socket}
        />

        {/* <PassengerSockets
          newSocket={newSocket}
          setDriver={setDriver}
          setDestinationLocation={setDestinationLocation}
          setDriverLocation={setDriverLocation}
          setIsLoading={setIsLoading}
          setRideStatus={setRideStatus}
          setRouteCoordinates={setRouteCoordinates}
          setStartLocation={setStartLocation}
          userAuth={userAuth}
          destinationLocation={destinationLocation}
          rideStatus={rideStatus}
          setCurrentLocation={setCurrentLocation}
          startLocation={startLocation}
        /> */}
      </GestureHandlerRootView>
    </View>
  );
};
