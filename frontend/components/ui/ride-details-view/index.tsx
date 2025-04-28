import React from "react";
import { View, Text, StyleSheet } from "react-native";

const RideDetailsView = ({ ride, userType }: { ride: any; userType: any }) => {
  const isPassenger = userType === "passenger";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {isPassenger ? "Your Driver Details" : "Passenger Details"}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>
          {isPassenger ? "Driver Name: " : "Passenger Name: "}
          <Text style={styles.value}>
            {isPassenger ? ride.driverName : ride.passengerName}
          </Text>
        </Text>

        <Text style={styles.label}>
          Pickup Location:
          <Text style={styles.value}>
            {`${ride.startLocation.latitude.toFixed(
              4
            )}, ${ride.startLocation.longitude.toFixed(4)}`}
          </Text>
        </Text>

        <Text style={styles.label}>
          Destination:
          <Text style={styles.value}>
            {`${ride.destinationLocation.latitude.toFixed(
              4
            )}, ${ride.destinationLocation.longitude.toFixed(4)}`}
          </Text>
        </Text>

        <Text style={styles.label}>
          Estimated Fare:
          <Text style={styles.value}>${ride.fare?.toFixed(2)}</Text>
        </Text>

        <Text style={styles.label}>
          Ride Status:
          <Text style={styles.value}>{ride.status.replace("_", " ")}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    padding: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  value: {
    fontWeight: "normal",
  },
});

export default RideDetailsView;
