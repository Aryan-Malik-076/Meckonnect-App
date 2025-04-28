import { StyleSheet } from "react-native";

export const passengerBottomSheetStyles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    alignItems: 'center'
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  statusText: {
    fontSize: 16,
    color: 'gray'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15
  },
  requestButton: {
    backgroundColor: 'green',
    padding: 12,
    borderRadius: 8,
    marginTop: 15
  },
  acceptButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 6,
    marginTop: 10
  },
  rejectButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 6,
    marginTop: 10
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
    marginTop: 15
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  driverCard: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 5
  },
  rideDetailsCard: {
    padding: 16,
    backgroundColor: 'red',
    borderRadius: 8,
    marginTop: 16,
    width: '50%',

  },
  driverName: {
    fontSize: 16,
    fontWeight: '500'
  },
  fareText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8
  },
  currentRideContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    width: '100%'
  },
  currentRideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});