import { RideStatus, UserLocation } from "@/@types";
import { colors } from "@/constants";
import { passengerStyles } from "@/styles";
import axios from "axios";
import React, { useEffect, useRef } from "react";
import { Alert, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
export const UserMapView = ({
  currentLocation,
  routeCoordinates,
  startLocation,
  destinationLocation,
  setRouteCoordinates,
  driverLocation,
  rideStatus,
  setCurrentLocation
}: {
  currentLocation: UserLocation | null;
  routeCoordinates: UserLocation[] | null;
  startLocation: UserLocation | null;
  destinationLocation: UserLocation | null;
  setRouteCoordinates: (coordinates: UserLocation[]) => void;
  driverLocation: UserLocation | null;
  rideStatus: RideStatus;
  setCurrentLocation: (location: UserLocation) => void;
}) => {
  const mapRef = useRef<MapView | null>(null);
  useEffect(() => {
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
        console.error("Routing error:", error);      }
    };
    if(rideStatus === RideStatus.pickingUp && driverLocation && currentLocation) {
      getRouteCoordinates(currentLocation, driverLocation);
    }
    else if(rideStatus === RideStatus.inProgress && currentLocation && destinationLocation) {
      getRouteCoordinates(currentLocation, destinationLocation);
    }
    if(startLocation && destinationLocation) {
      getRouteCoordinates(startLocation, destinationLocation);
    }
  }, [])
  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={passengerStyles.map}
        showsCompass={false}
        initialRegion={{
          latitude: currentLocation?.latitude || 51.5074,
          longitude: currentLocation?.longitude || -0.1278,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.status}
            strokeWidth={3}
          />
        )}
        {startLocation && (
          <Marker coordinate={startLocation} title="Pickup" pinColor="blue" />
        )}
        {destinationLocation && (
          <Marker
            coordinate={destinationLocation}
            title="Destination"
            pinColor={colors.status}
          // image={require("@/assets/images/green-pin.png")}
          />
        )}
      </MapView>
    </View>
  );
};
