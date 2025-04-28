import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import MapView, { Marker, MapPressEvent, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import debounce from "lodash/debounce";
import { passengerStyles } from "@/styles";
import { Driver, RideRequest, RideStatus, UserLocation } from "@/@types";
import { usePassengerContext } from "@/contexts";
import { PrimaryButton } from "@/components/ui";
import { colors } from "@/constants";
import { useRouter } from "expo-router";

export const LocationSelector = () => {
  const {
    currentLocation,
    setCurrentLocation,
    startLocation,
    setStartLocation,
    destinationLocation,
    setDestinationLocation,
    setRouteCoordinates,
    routeCoordinates,
  } = usePassengerContext();

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<
    "pickup" | "destination" | null
  >(null);
  const [pickupSearchText, setPickupSearchText] = useState(
    startLocation?.address || ""
  );
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [destinationSearchText, setDestinationSearchText] = useState(
    destinationLocation?.address || ""
  );
  const [showMap, setShowMap] = useState(false);

  const mapRef = useRef<MapView | null>(null);

  // Map visibility control
  useEffect(() => {
    setShowMap(
      isSelectingOnMap ||
        (startLocation !== null && destinationLocation !== null)
    );
  }, [startLocation, destinationLocation, isSelectingOnMap]);

  const router = useRouter();
  const fitMapToMarkers = (locations: UserLocation[]) => {
    if (!mapRef.current || locations.length === 0) return;

    const edgePadding = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    };

    mapRef.current.fitToCoordinates(
      locations.filter((loc) => loc != null),
      {
        edgePadding,
        animated: true,
      }
    );
  };

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "User-Agent": "RideBookingApp/1.0",
          },
        }
      );
      return response.data.display_name;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return "Address not found";
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`,
        {
          headers: {
            "User-Agent": "RideBookingApp/1.0",
          },
        }
      );

      setSearchResults(response.data);
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = debounce(searchLocation, 500);

  const handleLocationSelect = async (item: any) => {
    const location = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: item.display_name,
    };

    if (activeInput === "pickup") {
      setStartLocation(location);
      setPickupSearchText(location.address);
    } else if (activeInput === "destination") {
      setDestinationLocation(location);
      setDestinationSearchText(location.address);
    }

    setSearchResults([]);
    setActiveInput(null);

    if (startLocation && destinationLocation) {
      getRouteCoordinates(startLocation, destinationLocation);
    }
  };

  const handleMapPress = async (event: MapPressEvent) => {
    if (!isSelectingOnMap) return;

    const { coordinate } = event.nativeEvent;
    const address = await getAddressFromCoordinates(
      coordinate.latitude,
      coordinate.longitude
    );

    const location = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      address,
    };

    if (activeInput === "pickup") {
      setStartLocation(location);
      setPickupSearchText(address);
    } else if (activeInput === "destination") {
      setDestinationLocation(location);
      setDestinationSearchText(address);
    }

    setIsSelectingOnMap(false);
    setActiveInput(null);
  };

  useEffect(() => {
    if (startLocation && destinationLocation) {
      getRouteCoordinates(startLocation, destinationLocation);
    }
  }, [
    startLocation,
    destinationLocation
  ]);

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

  const useCurrentLocation = async (type: "pickup" | "destination") => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Please enable location services");
        return;
      }
      setIsLoading(true);

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const freshLocation = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };
      setCurrentLocation(freshLocation);
      const address = await getAddressFromCoordinates(
        freshLocation.latitude,
        freshLocation.longitude
      );

      const location = {
        ...freshLocation,
        address,
      };

      if (type === "pickup") {
        setStartLocation(location);
        setPickupSearchText(address);
      } else {
        setDestinationLocation(location);
        setDestinationSearchText(address);
      }

      setActiveInput(null);
      setSearchResults([]);

      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Error", "Failed to get current location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSuggestions = () => {
    if (!activeInput || isLoading) return null;

    return (
      <View style={passengerStyles.suggestionsContainer}>
        {!searchResults.length ? (
          <>
            <TouchableOpacity
              style={passengerStyles.suggestionItem}
              onPress={() => useCurrentLocation(activeInput)}
            >
              <Image
                source={require("@/assets/images/current-pin.png")}
                style={{ width: 15, height: 15, resizeMode: "stretch" }}
                
              />
              <Text style={passengerStyles.suggestionText}>
                Use current location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                passengerStyles.suggestionItem,
                { borderTopWidth: 1, paddingLeft: 23 },
              ]}
              onPress={() => {
                setIsSelectingOnMap(true);
                setShowMap(true);
              }}
            >
              <Image
                source={require("@/assets/images/green-marker.png")}
                style={{ width: 12, height: 15, resizeMode: "stretch" }}
              />
              <Text style={passengerStyles.suggestionText}>
                Select {activeInput === "pickup" ? "pickup" : "destination"} on
                map
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <ScrollView>
            {searchResults.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={passengerStyles.suggestionItem}
                onPress={() => handleLocationSelect(item)}
              >
                <Image
                  source={require("@/assets/images/gray-marker.png")}
                  style={{ width: 15, height: 15, resizeMode: "stretch" }}
                />
                <Text style={passengerStyles.suggestionText}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={passengerStyles.container}>
      <View
        style={{
          position: "relative",
          marginTop: 0,
          padding: 0,
          width: "100%",
        }}
      >
        <View style={passengerStyles.searchBoxWrapper}>
          <View style={passengerStyles.searchContainer}>
            <View style={passengerStyles.inputWrapper}>
              <Image
                source={require("@/assets/images/red-pin.png")}
                style={{ width: 15, height: 15 }}
                resizeMode="stretch"
              />
              <TextInput
                style={passengerStyles.input}
                placeholder="Enter pickup location"
                value={
                  pickupSearchText ? pickupSearchText : startLocation?.address
                }
                onFocus={() => setActiveInput("pickup")}
                onChangeText={(text) => {
                  setPickupSearchText(text);
                  debouncedSearch(text);
                }}
              />
            </View>
            <Image
              source={require("@/assets/images/pathline.png")}
              style={{
                width: 3,
                height: 15,
                resizeMode: "stretch",
                position: "absolute",
                left: 25,
              }}
              resizeMode="stretch"
            />
            <View style={passengerStyles.inputWrapper}>
              <Image
                source={require("@/assets/images/green-pin.png")}
                style={{ width: 15, height: 15 }}
                resizeMode="stretch"
              />
              <TextInput
                style={[
                  passengerStyles.input,
                  { borderTopColor: colors.border, borderTopWidth: 1 },
                ]}
                placeholder="Enter destination"
                value={
                  destinationSearchText
                    ? destinationSearchText
                    : destinationLocation?.address
                }
                onFocus={() => setActiveInput("destination")}
                onChangeText={(text) => {
                  setDestinationSearchText(text);
                  debouncedSearch(text);
                }}
              />
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator style={passengerStyles.loader} />
          ) : (
            renderSuggestions()
          )}
        </View>
      </View>
      <MapView
        ref={mapRef}
        style={passengerStyles.map}
        onPress={handleMapPress}
        initialRegion={{
          latitude: currentLocation?.latitude || 51.5074,
          longitude: currentLocation?.longitude || -0.1278,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {routeCoordinates.length > 0 && (
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

      {isSelectingOnMap && (
        <View style={passengerStyles.mapSelectionOverlay}>
          <Text style={passengerStyles.mapSelectionText}>
            Tap on the map to select{" "}
            {activeInput === "pickup" ? "pickup" : "destination"} location
          </Text>
          <TouchableOpacity
            style={passengerStyles.cancelButton}
            onPress={() => {
              setIsSelectingOnMap(false);
              setShowMap(false);
            }}
          >
            <Text style={passengerStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      {startLocation && destinationLocation && (
        <View
          style={{
            backgroundColor: "transparent",
            position: "absolute",
            bottom: 20,
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <PrimaryButton
            title="Confirm"
            disabled={!startLocation || !destinationLocation}
            style={{ width: "100%" }}
            onPress={() => router.push({ pathname: "/", params: {} })}
          />
        </View>
      )}
    </View>
  );
};
