import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Socket } from "socket.io-client";
import { RideStatus, User, UserLocation } from "@/@types";
import { CloseButton, PrimaryButton } from "@/components/ui";
import { usePassengerContext } from "@/contexts";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import axios from "axios";
import { useStripe } from "@stripe/stripe-react-native";
import { DEFAULT_URL_3 } from "@/lib/constants";
import { CustomModal } from "@/components/ui";
import Toast from "react-native-toast-message";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export const PassengerBottomSheet = ({
  socket,
  userAuth,
  rideStatus,
  setRideStatus,
  startLocation,
  destinationLocation,
  setStartLocation,
  setDestinationLocation,
}: {
  socket: Socket;
  userAuth: User | null;
  rideStatus: RideStatus;
  setRideStatus: (status: RideStatus) => void;
  startLocation: UserLocation | null;
  destinationLocation: UserLocation | null;
  setStartLocation: (a: UserLocation | null) => void;
  setDestinationLocation: (a: UserLocation | null) => void;
}) => {
  const {
    handleRequestRide,
    availableDrivers,
    handleAcceptDriver,
    handleCancelRide,
    currentRide,
    currentLocation,
    driverLocation,
    setDriverLocation,
  } = usePassengerContext();

  // Refs & state
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["5%", "50%", "70%"], []);
  const mapRef = useRef<MapView>(null);
  const [viewRouteCoordinates, setViewRouteCoordinates] = useState<any[]>([]);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const lottieRef = useRef<LottieView>(null);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [confirmButtonText, setConfirmButtonText] = useState("Confirm");
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] =
    useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // Animation control
  useEffect(() => {
    if (rideStatus !== RideStatus.idle) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [rideStatus, fadeAnim, slideAnim]);

  // Show modal
  const showModal = (
    type: "success" | "error" | "info",
    title: string,
    message: string,
    withConfirm = false,
    confirmText = "Confirm",
    onConfirm = () => { }
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setShowConfirmButton(withConfirm);
    setConfirmButtonText(confirmText);
    setConfirmAction(() => onConfirm);
    setIsModalVisible(true);
  };

  // Show confirmation modal
  const showConfirmationModal = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setConfirmAction(() => onConfirm);
    setIsConfirmationModalVisible(true);
  };

  // Show toast notification
  const showToast = (type: "success" | "error" | "info", message: string) => {
    Toast.show({
      type,
      text1: type.charAt(0).toUpperCase() + type.slice(1),
      text2: message,
      position: "bottom",
      visibilityTime: 4000,
      autoHide: true,
    });
  };

  const getRouteCoordinates = useCallback(
    async (start: UserLocation, end: UserLocation) => {
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
        showModal(
          "error",
          "Route Error",
          "Failed to get route information. Please try again."
        );
      }
    },
    []
  );

  useEffect(() => {
    if (currentRide?.startLocation && currentRide?.destinationLocation) {
      getRouteCoordinates(
        currentRide.startLocation,
        currentRide.destinationLocation
      );
    }
  }, [currentRide, getRouteCoordinates]);

  useEffect(() => {
    // Listen for driver's location updates
    const handleLocationUpdate = (locationData: any) => {
      if (
        locationData.role === "driver" &&
        currentRide?.rideId === locationData.rideId
      ) {
        // Update driver location in context
        setDriverLocation(locationData.location);

        // Notify user when driver is nearby (within 0.5km)
        if (currentLocation && locationData.location) {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            locationData.location.latitude,
            locationData.location.longitude
          );

          if (distance < 0.5 && rideStatus === RideStatus.pickingUp) {
            showToast("info", "Your driver is nearby!");
            if (lottieRef.current) {
              lottieRef.current.play();
            }
          }
        }
      }
    };

    socket.on("location_update", handleLocationUpdate);

    return () => {
      socket.off("location_update", handleLocationUpdate);
    };
  }, [socket, currentRide, currentLocation, rideStatus]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const onAcceptDriver = useCallback(
    (driver: any) => {
      if (!startLocation || !destinationLocation || !userAuth) {
        showModal(
          "error",
          "Missing Information",
          "Location information is incomplete. Please try again."
        );
        return;
      }

      handleAcceptDriver({
        passengerId: userAuth.id,
        driverId: driver.driverId,
        startLocation,
        destinationLocation,
        driverLocation: driver.driverLocation,
      });

      showToast("success", `${driver.name} will be picking you up shortly`);

      // Animate bottom sheet to show ride details
      bottomSheetRef.current?.snapToIndex(1);
    },
    [startLocation, destinationLocation, userAuth, handleAcceptDriver]
  );

  // Function to initialize the payment sheet
  const initializePaymentSheet = async () => {
    try {
      const response = await axios.post(
        `${DEFAULT_URL_3}/create-payment-intent`,
        {
          amount: currentRide?.fare || 0,
          currency: "usd",
        }
      );

      const { clientSecret } = response.data;

      const { error } = await initPaymentSheet({
        merchantDisplayName: "GoHer",
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        customFlow: false,
        style: "automatic",
        appearance: {
          colors: {
            primary: "#673DE6",
            background: "#FFFFFF",
            componentBackground: "#F8F8F8",
            componentBorder: "#E0E0E0",
            componentDivider: "#E0E0E0",
            primaryText: "#000000",
            secondaryText: "#666666",
            componentText: "#000000",
            placeholderText: "#999999",
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
          primaryButton: {
            colors: {
              background: "#673DE6",
              text: "#FFFFFF",
              border: "transparent",
            },
            shapes: {
              borderRadius: 12,
              borderWidth: 0,
            },
          },
        },
      });

      if (error) {
        showModal("error", "Payment Setup Failed", error.message);
        return false;
      }
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      showModal(
        "error",
        "Payment Error",
        `Failed to setup payment: ${errorMsg}`
      );
      return false;
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const initialized = await initializePaymentSheet();
      if (!initialized) {
        setLoading(false);
        return;
      }

      const { error } = await presentPaymentSheet();

      if (error) {
        showModal("error", "Payment Failed", error.message);
      } else {
        showModal(
          "success",
          "Payment Successful",
          "Your payment was processed successfully!",
          true,
          "Done",
          () => {
            setRideStatus(RideStatus.completed);
          }
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      showModal(
        "error",
        "Payment Error",
        `An unexpected error occurred: ${errorMsg}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequestRide = () => {
    setStartLocation(null);
    setDestinationLocation(null);
  };

  const handleCancelRideRequest = () => {
    showConfirmationModal(
      "Cancel Ride?",
      "Are you sure you want to cancel your ride request?",
      () => {
        setCancelLoading(true);
        handleCancelRide();
        setCancelLoading(false);
        setIsConfirmationModalVisible(false);
      }
    );
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
        opacity={0.5}
      />
    ),
    []
  );

  const renderPassengerContent = () => {
    switch (rideStatus) {
      case RideStatus.idle:
        return (
          <View style={styles.contentContainer}>
            <View style={styles.requestRideContainer}>
              <CloseButton onClick={handleCancelRequestRide} />
              <PrimaryButton
                style={styles.requestButton}
                title={loading ? "Loading..." : "Request Ride"}
                onPress={handleRequestRide}
                disabled={!startLocation || !destinationLocation || loading}
              />
            </View>
            {(!startLocation || !destinationLocation) && (
              <View style={styles.infoContainer}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#666"
                />
                <Text style={styles.infoText}>
                  Please select both pickup and destination locations
                </Text>
              </View>
            )}
          </View>
        );

      case RideStatus.searching:
        return (
          <Animated.View
            style={[
              styles.contentContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <LottieView
              ref={lottieRef}
              source={require("@/assets/animations/searching.json")}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
            <Text style={styles.statusText}>Searching for drivers...</Text>
            <Text style={styles.subStatusText}>
              We're finding the perfect driver for you
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRideRequest}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Cancel Search</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        );

      case RideStatus.driverFound:
        return (
          <Animated.View
            style={[
              styles.contentContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.headerText}>Available Drivers</Text>
            <Text style={styles.subHeaderText}>
              Select a driver to continue
            </Text>

            {availableDrivers.length > 0 ? (
              <View style={styles.driversList}>
                {availableDrivers.map((driver) => (
                  <View key={driver.driverId} style={styles.driverCard}>
                    <LinearGradient
                      colors={["#F8F8F8", "#FFFFFF"]}
                      style={styles.driverCardGradient}
                    >
                      <View style={styles.driverInfo}>
                        <View style={styles.driverAvatarContainer}>
                          <LinearGradient
                            colors={["#673DE6", "#8F6DF2"]}
                            style={styles.driverAvatar}
                          >
                            <Text style={styles.driverInitial}>
                              {driver.name.charAt(0)}
                            </Text>
                          </LinearGradient>
                          <View style={styles.driverRating}>
                            <Text style={styles.ratingText}>
                              {(4 + Math.random()).toFixed(1)}
                            </Text>
                            <Ionicons name="star" size={10} color="#FFD700" />
                          </View>
                        </View>
                        <View style={styles.driverDetails}>
                          <Text style={styles.driverName}>{driver.name}</Text>
                          <View style={styles.driverMetrics}>
                            <View style={styles.metricItem}>
                              <Ionicons
                                name="location"
                                size={16}
                                color="#673DE6"
                              />
                              <Text style={styles.metricText}>
                                {driver.driverDistance.toFixed(2)} km
                              </Text>
                            </View>
                            <View style={styles.metricItem}>
                              <Ionicons
                                name="time-outline"
                                size={16}
                                color="#673DE6"
                              />
                              <Text style={styles.metricText}>
                                {Math.ceil(driver.driverDistance * 2)} min
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.selectDriverButton}
                        onPress={() => onAcceptDriver(driver)}
                      >
                        <Text style={styles.buttonText}>Select Driver</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDriversContainer}>
                <LottieView
                  source={require("@/assets/animations/no-results.json")}
                  autoPlay
                  loop
                  style={styles.noDriversAnimation}
                />
                <Text style={styles.noDriversText}>
                  No drivers available at the moment
                </Text>
                <Text style={styles.noDriversSubText}>
                  Please try again in a few moments
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRideRequest}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Cancel Request</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        );

      case RideStatus.pickingUp:
      case RideStatus.inProgress:
        return (
          <Animated.View
            style={[
              styles.contentContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.rideMap}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: currentLocation?.latitude || 0,
                  longitude: currentLocation?.longitude || 0,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                showsUserLocation
                showsMyLocationButton
                showsCompass
                toolbarEnabled
              >
                {currentLocation && (
                  <Marker
                    coordinate={{
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }}
                    title="Your Location"
                  >
                    <View style={styles.userMarker}>
                      <View style={styles.userMarkerDot} />
                    </View>
                  </Marker>
                )}

                {currentRide && (
                  <>
                    <Marker
                      coordinate={{
                        latitude: currentRide.startLocation.latitude,
                        longitude: currentRide.startLocation.longitude,
                      }}
                      title="Pickup Location"
                    >
                      <View style={styles.pickupMarker}>
                        <Ionicons name="location" size={24} color="#4CAF50" />
                      </View>
                    </Marker>
                    <Marker
                      coordinate={{
                        latitude: currentRide.destinationLocation.latitude,
                        longitude: currentRide.destinationLocation.longitude,
                      }}
                      title="Drop-off Location"
                    >
                      <View style={styles.dropoffMarker}>
                        <Ionicons name="location" size={24} color="#F44336" />
                      </View>
                    </Marker>
                  </>
                )}

                {driverLocation && (
                  <Marker
                    coordinate={{
                      latitude: driverLocation.latitude,
                      longitude: driverLocation.longitude,
                    }}
                    title="Driver Location"
                  >
                    <View style={styles.driverMarker}>
                      <FontAwesome5 name="car" size={16} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}

                {viewRouteCoordinates.length > 0 && (
                  <Polyline
                    coordinates={viewRouteCoordinates}
                    strokeColor="#673DE6"
                    strokeWidth={4}
                    lineDashPattern={[0]}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
              </MapView>

              <TouchableOpacity
                style={styles.recenterButton}
                onPress={() => {
                  if (viewRouteCoordinates.length > 0) {
                    mapRef.current?.fitToCoordinates(viewRouteCoordinates, {
                      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                      animated: true,
                    });
                  }
                }}
              >
                <Ionicons name="locate" size={20} color="#673DE6" />
              </TouchableOpacity>
            </View>

            <View style={styles.currentRideContainer}>
              <View style={styles.rideStatusBadge}>
                <Ionicons
                  name={
                    rideStatus === RideStatus.pickingUp
                      ? "car-sport"
                      : "navigate"
                  }
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.rideStatusText}>
                  {rideStatus === RideStatus.pickingUp
                    ? "Driver On The Way"
                    : "Ride in Progress"}
                </Text>
              </View>

              {currentRide && (
                <>
                  <View style={styles.rideDetailsCard}>
                    <View style={styles.driverProfileSection}>
                      <View style={styles.driverProfileAvatar}>
                        <LinearGradient
                          colors={["#673DE6", "#8F6DF2"]}
                          style={styles.driverProfileAvatarGradient}
                        >
                          <Text style={styles.driverProfileInitial}>
                            {currentRide.driverName?.charAt(0) || "D"}
                          </Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.driverProfileInfo}>
                        <Text style={styles.driverProfileName}>
                          {currentRide.driverName}
                        </Text>
                        <View style={styles.driverProfileRating}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.driverProfileRatingText}>
                            4.8
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.contactDriverButton}>
                        <Ionicons name="call" size={20} color="#673DE6" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.rideDivider} />

                    <View style={styles.rideInfoSection}>
                      <View style={styles.rideInfoRow}>
                        <View style={styles.rideInfoIcon}>
                          <Ionicons
                            name="information-circle"
                            size={20}
                            color="#673DE6"
                          />
                        </View>
                        <Text style={styles.rideInfoText}>
                          Status: {currentRide.status}
                        </Text>
                      </View>

                      {currentRide.fare && (
                        <View style={styles.rideInfoRow}>
                          <View style={styles.rideInfoIcon}>
                            <MaterialIcons
                              name="attach-money"
                              size={20}
                              color="#673DE6"
                            />
                          </View>
                          <Text style={styles.rideInfoText}>
                            Fare: ${currentRide.fare.toFixed(2)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.rideInfoRow}>
                        <View style={styles.rideInfoIcon}>
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color="#673DE6"
                          />
                        </View>
                        <Text style={styles.rideInfoText}>
                          ETA:{" "}
                          {Math.ceil((viewRouteCoordinates.length / 20) * 5)}{" "}
                          min
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.cancelRideButton}
                      onPress={handleCancelRideRequest}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color="#fff"
                          />
                          <Text style={styles.buttonText}>Cancel</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.payButton,
                        loading && styles.disabledButton,
                      ]}
                      onPress={handlePayment}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="card" size={16} color="#fff" />
                          <Text style={styles.buttonText}>Pay Now</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        );

      case RideStatus.completed:
        return (
          <Animated.View
            style={[
              styles.contentContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.completedRideContainer}>
              <LottieView
                source={require("@/assets/animations/success.json")}
                autoPlay
                loop={false}
                style={styles.completedAnimation}
              />
              <Text style={styles.completedHeaderText}>Ride Completed</Text>
              {currentRide && (
                <View style={styles.completedRideDetailsCard}>
                  <Text style={styles.fareText}>
                    Final Fare: ${currentRide.fare?.toFixed(2)}
                  </Text>

                  <View style={styles.rideStatsContainer}>
                    <View style={styles.rideStat}>
                      <Ionicons name="time-outline" size={24} color="#673DE6" />
                      <Text style={styles.rideStatValue}>
                        {Math.ceil((viewRouteCoordinates.length / 20) * 5)} min
                      </Text>
                      <Text style={styles.rideStatLabel}>Duration</Text>
                    </View>

                    <View style={styles.rideStatDivider} />

                    <View style={styles.rideStat}>
                      <Ionicons name="map-outline" size={24} color="#673DE6" />
                      <Text style={styles.rideStatValue}>
                        {(viewRouteCoordinates.length / 100).toFixed(1)} km
                      </Text>
                      <Text style={styles.rideStatLabel}>Distance</Text>
                    </View>
                  </View>

                  <View style={styles.rateDriverSection}>
                    <Text style={styles.rateDriverText}>
                      How was your ride with {currentRide.driverName}?
                    </Text>
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} style={styles.ratingStar}>
                          <Ionicons name="star" size={32} color="#E0E0E0" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <Text style={styles.thankYouText}>
                    Thank you for riding with GoHer!
                  </Text>

                  <TouchableOpacity
                    style={styles.newRideButton}
                    onPress={() => {
                      setRideStatus(RideStatus.idle);
                      setStartLocation(null);
                      setDestinationLocation(null);
                      showToast("info", "Ready for a new ride");
                    }}
                  >
                    <Text style={styles.buttonText}>Start New Ride</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        );

      default:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.statusText}>Select Ride</Text>
          </View>
        );
    }
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleStyle={styles.bottomSheetHandle}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {renderPassengerContent()}
        </BottomSheetView>
      </BottomSheet>

      {/* Universal Modal */}
      <View style={{ flex: 1, position: 'absolute' }}>
        <CustomModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          title={modalTitle}
          showCloseButton={false}
          customStyles={
            modalType === "success"
              ? styles.successModal
              : modalType === "error"
                ? styles.errorModal
                : styles.infoModal
          }
        >
          <View style={styles.modalContent}>
            {modalType === "success" ? (
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            ) : modalType === "error" ? (
              <Ionicons name="alert-circle" size={48} color="#F44336" />
            ) : (
              <Ionicons name="information-circle" size={48} color="#2196F3" />
            )}
            <Text style={styles.modalMessage}>{modalMessage}</Text>

            {showConfirmButton && (
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  modalType === "success"
                    ? styles.successButton
                    : modalType === "error"
                      ? styles.errorButton
                      : styles.infoButton,
                ]}
                onPress={() => {
                  setIsModalVisible(false);
                  confirmAction();
                }}
              >
                <Text style={styles.modalButtonText}>{confirmButtonText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </CustomModal>

        {/* Confirmation Modal */}
        <CustomModal
          visible={isConfirmationModalVisible}
          onClose={() => setIsConfirmationModalVisible(false)}
          title={confirmationTitle}
          customStyles={styles.confirmationModal}
        >
          <View style={styles.modalContent}>
            <Ionicons name="help-circle" size={48} color="#FF9800" />
            <Text style={styles.modalMessage}>{confirmationMessage}</Text>

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.cancelConfirmButton}
                onPress={() => setIsConfirmationModalVisible(false)}
              >
                <Text style={styles.cancelConfirmButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmAction}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CustomModal>
      </View>

    </>
  );
};

const styles = StyleSheet.create({
  // Bottom Sheet Styles
  bottomSheetIndicator: {
    backgroundColor: "#673DE6",
    width: 40,
    height: 5,
  },
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetHandle: {
    paddingVertical: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetContent: {
    flex: 1,
  },

  // Content Container
  contentContainer: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },

  // Request Ride Section
  requestRideContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  requestButton: {
    width: "80%",
    backgroundColor: "#673DE6",
    borderRadius: 12,
    height: 50,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },

  // Searching Section
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  statusText: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 15,
    textAlign: "center",
    color: "#333",
  },
  subStatusText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: "#FF5252",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  // Driver Found Section
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  driversList: {
    width: "100%",
    marginBottom: 20,
  },
  driverCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverCardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  driverAvatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  driverInitial: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  driverRating: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 2,
    color: "#333",
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  driverMetrics: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metricText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  selectDriverButton: {
    backgroundColor: "#673DE6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  noDriversContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noDriversAnimation: {
    width: 150,
    height: 150,
  },
  noDriversText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginTop: 16,
  },
  noDriversSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  // Map Section
  mapContainer: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  rideMap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  recenterButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(103, 61, 230, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#673DE6",
  },
  pickupMarker: {
    alignItems: "center",
  },
  dropoffMarker: {
    alignItems: "center",
  },
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#673DE6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  // Current Ride Section
  currentRideContainer: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
  },
  rideStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#673DE6",
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
    gap: 6,
  },
  rideStatusText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  rideDetailsCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: "100%",
  },
  driverProfileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  driverProfileAvatar: {
    marginRight: 12,
  },
  driverProfileAvatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  driverProfileInitial: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  driverProfileInfo: {
    flex: 1,
  },
  driverProfileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  driverProfileRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverProfileRatingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  contactDriverButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0EAFF",
    justifyContent: "center",
    alignItems: "center",
  },
  rideDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginBottom: 16,
  },
  rideInfoSection: {
    gap: 12,
  },
  rideInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rideInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0EAFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rideInfoText: {
    fontSize: 16,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  cancelRideButton: {
    backgroundColor: "#FF5252",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  payButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },

  // Completed Ride Section
  completedRideContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: "100%",
  },
  completedAnimation: {
    width: 120,
    height: 120,
  },
  completedHeaderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  completedRideDetailsCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    alignItems: "center",
  },
  fareText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  rideStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
  },
  rideStat: {
    alignItems: "center",
    flex: 1,
  },
  rideStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
  },
  rideStatLabel: {
    fontSize: 14,
    color: "#666",
  },
  rideStatDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    height: "100%",
  },
  rateDriverSection: {
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
  },
  rateDriverText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  ratingStars: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  ratingStar: {
    marginHorizontal: 4,
  },
  thankYouText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  newRideButton: {
    backgroundColor: "#673DE6",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },

  // Modal Styles
  modalContent: {
    alignItems: "center",
    padding: 20,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
    color: "#333",
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  successButton: {
    backgroundColor: "#4CAF50",
  },
  errorButton: {
    backgroundColor: "#F44336",
  },
  infoButton: {
    backgroundColor: "#2196F3",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  successModal: {
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
  },
  errorModal: {
    borderLeftWidth: 5,
    borderLeftColor: "#F44336",
  },
  infoModal: {
    borderLeftWidth: 5,
    borderLeftColor: "#2196F3",
  },
  confirmationModal: {
    borderLeftWidth: 5,
    borderLeftColor: "#FF9800",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  cancelConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelConfirmButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9800",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
