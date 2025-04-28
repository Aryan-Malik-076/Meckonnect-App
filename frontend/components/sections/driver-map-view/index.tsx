import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Alert, TouchableOpacity, ActivityIndicator, Linking, Platform, Text, Animated } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { colors } from "@/constants";
import { passengerStyles } from "@/styles";
import { RideStatus, UserLocation } from "@/@types";

export const DriverMapView = ({
  currentLocation,
  routeCoordinates,
  startLocation,
  destinationLocation,
  setRouteCoordinates,
  driverLocation,
  rideStatus,
  setRideStatus,
  setCurrentLocation,
}: {
  currentLocation: UserLocation | null;
  routeCoordinates: UserLocation[] | null;
  startLocation: UserLocation | null;
  destinationLocation: UserLocation | null;
  setRouteCoordinates: (coordinates: UserLocation[]) => void;
  driverLocation: UserLocation | null;
  rideStatus: RideStatus;
  setRideStatus: (status: RideStatus) => void;
  setCurrentLocation: (location: UserLocation) => void;
}) => {
  const mapRef = useRef<MapView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRouteFetching, setIsRouteFetching] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  
  // State for collapsible buttons
  const [pickupButtonExpanded, setPickupButtonExpanded] = useState(false);
  const [destinationButtonExpanded, setDestinationButtonExpanded] = useState(false);
  
  // Animation values
  const pickupTextWidth = useRef(new Animated.Value(0)).current;
  const destinationTextWidth = useRef(new Animated.Value(0)).current;

  // Function to collapse all buttons
  const collapseAllButtons = () => {
    setPickupButtonExpanded(false);
    setDestinationButtonExpanded(false);
    Animated.parallel([
      Animated.timing(pickupTextWidth, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(destinationTextWidth, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();
  };

  // Function to toggle pickup button expansion
  const togglePickupButton = () => {
    if (pickupButtonExpanded) {
      // If already expanded, open Google Maps
      if (startLocation) {
        openGoogleMapsDirections(startLocation);
      }
    } else {
      // Collapse the other button if it's expanded
      if (destinationButtonExpanded) {
        setDestinationButtonExpanded(false);
        Animated.timing(destinationTextWidth, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      
      // Expand this button
      setPickupButtonExpanded(true);
      Animated.timing(pickupTextWidth, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  // Function to toggle destination button expansion
  const toggleDestinationButton = () => {
    if (destinationButtonExpanded) {
      // If already expanded, open Google Maps
      if (destinationLocation) {
        openGoogleMapsDirections(destinationLocation);
      }
    } else {
      // Collapse the other button if it's expanded
      if (pickupButtonExpanded) {
        setPickupButtonExpanded(false);
        Animated.timing(pickupTextWidth, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      
      // Expand this button
      setDestinationButtonExpanded(true);
      Animated.timing(destinationTextWidth, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  // Function to open Google Maps with directions
  const openGoogleMapsDirections = useCallback((destination: UserLocation) => {
    if (!currentLocation) {
      Alert.alert("Error", "Current location is not available");
      return;
    }

    const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
    const dest = `${destination.latitude},${destination.longitude}`;

    // Create the appropriate URL scheme based on platform
    const url = Platform.select({
      ios: `comgooglemaps://?saddr=${origin}&daddr=${dest}&directionsmode=driving`,
      android: `google.navigation:q=${dest}&mode=d`,
    });

    // Fallback URL for web or if Google Maps isn't installed
    const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;

    // First try to open the native app
    Linking.canOpenURL(url!)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url!);
        } else {
          // If native app isn't available, open web version
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        Alert.alert("Error Opening Maps", "Could not open Google Maps.");
        console.error('Error opening maps:', err);
      });
      
    // Reset button state after opening maps
    collapseAllButtons();
  }, [currentLocation]);

  // Fetch route coordinates function
  const fetchRouteCoordinates = useCallback(async (start: UserLocation, end: UserLocation) => {
    if (isRouteFetching) return;

    setIsRouteFetching(true);

    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`,
        { timeout: 10000 }
      );

      if (response.data.routes && response.data.routes[0]) {
        const coordinates = response.data.routes[0].geometry.coordinates.map(
          ([longitude, latitude]: number[]) => ({
            latitude,
            longitude,
          })
        );
        setRouteCoordinates(coordinates);

        // Fit map to show the entire route
        fitMapToCoordinates([start, end, ...coordinates]);
      }
    } catch (error) {
      console.error("Routing error:", error);

      // If OSRM API fails, draw a straight line as fallback
      const straightLineRoute = [start, end];
      setRouteCoordinates(straightLineRoute);
      fitMapToCoordinates(straightLineRoute);

      Alert.alert(
        "Route Information",
        "Using simplified route. Navigation may be limited.",
        [{ text: "OK" }],
        { cancelable: true }
      );
    } finally {
      setIsRouteFetching(false);
    }
  }, [setRouteCoordinates]);

  // Fit map to show all important points
  const fitMapToCoordinates = useCallback((points: UserLocation[]) => {
    if (!mapRef.current || points.length === 0) return;

    const validPoints = points.filter(
      point => point && typeof point.latitude === 'number' && typeof point.longitude === 'number'
    );

    if (validPoints.length === 0) return;

    try {
      mapRef.current.fitToCoordinates(validPoints, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } catch (error) {
      console.error("Error fitting map to coordinates:", error);
    }
  }, []);

  // Zoom to user's current location
  const zoomToCurrentLocation = useCallback(() => {
    if (!currentLocation) {
      Alert.alert("Location Not Found", "Please enable location services.");
      return;
    }

    mapRef.current?.animateToRegion({
      ...currentLocation,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    // Collapse buttons when zooming
    collapseAllButtons();
  }, [currentLocation]);

  // Handle rider pickup - changes status to in progress
  const handlePickupComplete = useCallback(() => {
    if (!currentLocation || !destinationLocation) {
      Alert.alert("Error", "Location information is missing");
      return;
    }

    setRideStatus(RideStatus.inProgress);

    // Get route from current location to destination
    fetchRouteCoordinates(currentLocation, destinationLocation);
    
    // Reset button states when changing ride status
    collapseAllButtons();
  }, [currentLocation, destinationLocation, fetchRouteCoordinates, setRideStatus]);

  // Fetch user's current location on mount and start tracking
  useEffect(() => {
    let isMounted = true;

    const setupLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Please enable location permissions in settings.");
          if (isMounted) setIsLoading(false);
          return;
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        if (isMounted) {
          setCurrentLocation(userLocation);
          setIsLoading(false);

          // Initial route fetch based on ride status
          if (rideStatus === RideStatus.pickingUp && startLocation) {
            fetchRouteCoordinates(userLocation, startLocation);
          } else if (rideStatus === RideStatus.inProgress && destinationLocation) {
            fetchRouteCoordinates(userLocation, destinationLocation);
          }

          // Fit map to user's location
          mapRef.current?.animateToRegion({
            ...userLocation,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        // Start location tracking
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 20,
          },
          (newLocation) => {
            if (isMounted) {
              const updatedLocation = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              };
              setCurrentLocation(updatedLocation);
            }
          }
        );
      } catch (error) {
        console.error("Error fetching location:", error);
        if (isMounted) {
          Alert.alert(
            "Location Error",
            "Could not get your location. Please ensure location services are enabled and try again."
          );
          setIsLoading(false);
        }
      }
    };

    setupLocationTracking();

    // Clean up subscription and set mounted flag
    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Update routes when ride status changes
  useEffect(() => {
    if (!currentLocation) return;

    if (rideStatus === RideStatus.pickingUp && startLocation) {
      fetchRouteCoordinates(currentLocation, startLocation);
    } else if (rideStatus === RideStatus.inProgress && destinationLocation) {
      fetchRouteCoordinates(currentLocation, destinationLocation);
    }
    
    // Reset button states when changing ride status
    collapseAllButtons();
  }, [rideStatus, fetchRouteCoordinates]);

  // Loading indicator
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.status} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={passengerStyles.map}
        showsCompass={true}
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: currentLocation?.latitude || 51.5074,
          longitude: currentLocation?.longitude || -0.1278,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={() => collapseAllButtons()} // Collapse buttons when map is tapped
      >
        {/* Current location marker with car icon */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
          >
            <Ionicons name="car" size={24} color={colors.status} />
          </Marker>
        )}

        {/* Route polyline */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.status}
            strokeWidth={3}
            lineDashPattern={[0]}
          />
        )}

        {/* Pickup location marker */}
        {startLocation && (
          <Marker
            coordinate={startLocation}
            title="Pickup"
            pinColor="blue"
            style={{ zIndex: 100, width: 10, height: 10 }}
          />
        )}

        {/* Destination marker */}
        {destinationLocation && (
          <Marker
            coordinate={destinationLocation}
            title="Destination"
            pinColor={colors.status}
          />
        )}
      </MapView>

      {/* Google Maps Direction Buttons */}
      <View
        style={{
          position: "absolute",
          top: 100,
          left: 10,
          justifyContent:'flex-start',
          flexDirection: "column",
          gap: 20,
          height: 50
        }}
      >
        {/* Direction to Pickup Button - Show only when picking up */}
        {startLocation && (
          <TouchableOpacity
            onPress={togglePickupButton}
            style={{
              backgroundColor: "white",
              padding: 10,
              borderRadius: 50,
              elevation: 5,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 5,
              marginRight:'auto',
              paddingRight: pickupButtonExpanded ? 20 : 10,
            }}
          >
            <Ionicons name="navigate" size={24} color="red" />
            <View style={{
              backgroundColor: "red",
              width: 8,
              height: 8,
              borderRadius: 4
            }} />
            
            <Animated.View style={{
              width: pickupTextWidth.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 160] // Approximate width of text
              }),
              opacity: pickupTextWidth,
              overflow: 'hidden',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text style={{ color: "black", fontWeight: "bold" }}>Get Pickup Directions</Text>
              
              {/* Close button that appears when expanded */}
              <TouchableOpacity 
                onPress={collapseAllButtons}
                style={{ marginLeft: 5 }}
              >
                <Ionicons name="close-circle" size={20} color="gray" />
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Direction to Destination Button - Show when in progress */}
        {destinationLocation && (
          <TouchableOpacity
            onPress={toggleDestinationButton}
            style={{
              backgroundColor: "white",
              padding: 10,
              borderRadius: 50,
              elevation: 5,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingRight: destinationButtonExpanded ? 15 : 10,
              marginRight:'auto',

            }}
          >
            <Ionicons name="navigate" size={24} color={colors.status} />
            <View style={{
              backgroundColor: colors.status,
              width: 8,
              height: 8,
              borderRadius: 4
            }} />
            
            <Animated.View style={{
              width: destinationTextWidth.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 190] // Approximate width of text
              }),
              opacity: destinationTextWidth,
              overflow: 'hidden',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text style={{ color: "black", fontWeight: "bold" }}>Get Destination Directions</Text>
              
              {/* Close button that appears when expanded */}
              <TouchableOpacity 
                onPress={collapseAllButtons}
                style={{ marginLeft: 5 }}
              >
                <Ionicons name="close-circle" size={20} color="gray" />
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {/* Control buttons */}
      <View
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          flexDirection: "column-reverse",
          gap: 10,
        }}
      >
        {/* Zoom Button */}
        <TouchableOpacity
          onPress={zoomToCurrentLocation}
          style={{
            backgroundColor: "white",
            padding: 10,
            borderRadius: 50,
            elevation: 5,
          }}
        >
          <Ionicons name="locate" size={24} color="black" />
        </TouchableOpacity>

        {/* Route Overview Button */}
        <TouchableOpacity
          onPress={() => {
            const pointsToShow = [
              ...(currentLocation ? [currentLocation] : []),
              ...(rideStatus === RideStatus.pickingUp && startLocation ? [startLocation] : []),
              ...(destinationLocation ? [destinationLocation] : []),
            ];

            if (routeCoordinates && routeCoordinates.length > 0) {
              // Add some route points but not all to avoid performance issues
              pointsToShow.push(...routeCoordinates.filter((_, i) => i % 10 === 0));
            }

            if (pointsToShow.length > 0) {
              fitMapToCoordinates(pointsToShow);
              collapseAllButtons(); // Collapse buttons when fitting map
            }
          }}
          style={{
            backgroundColor: "white",
            padding: 10,
            borderRadius: 50,
            elevation: 5,
          }}
        >
          <Ionicons name="map-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Picked Up button - Only show when ride status is PICKING_UP */}
      {rideStatus === RideStatus.pickingUp && (
        <View style={{
          position: "absolute",
          bottom: 30,
          left: 0,
          right: 0,
          alignItems: "center",
        }}>
          <TouchableOpacity
            onPress={handlePickupComplete}
            style={{
              backgroundColor: colors.status,
              paddingVertical: 15,
              paddingHorizontal: 30,
              borderRadius: 30,
              elevation: 5,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              minWidth: 200,
            }}
            disabled={isRouteFetching}
          >
            {isRouteFetching ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                  Picked Up
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};