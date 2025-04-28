import { StyleSheet } from "react-native";

export const driverBottomSheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  map: {
    height: 200,
    width: "100%",
    borderRadius: 8,
    marginBottom: 16,
  },
  requestsContainer: {
    marginTop: 16,
  },
  requestItem: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedRequest: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 1,
  },
  requestText: {
    fontSize: 16,
    fontWeight: "500",
  },
  requestDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  currentRideContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
  },
  currentRideTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
