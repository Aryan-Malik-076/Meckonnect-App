import { colors, fonts } from "@/constants";
import { StyleSheet } from "react-native";

export const menuStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.default,
    padding: 15,
    gap: 15
  },
  infoContainer: {
    gap: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  heading: {
    fontSize: 16,
    textTransform: 'capitalize',
    textAlign: 'left',
    color: colors.dark,
    paddingLeft: 3,
    fontFamily: fonts.primary
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: 'black',
  },
  buttonsContainer: {
    flex: 2,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletContainer: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: colors.primarySolid,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    gap: 10
  }, 
  menuListContainer: {
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    marginBottom: 10,
    fontFamily: fonts.primary,
    color: colors.disabledText
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 15,
    gap: 15,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    color: "#333",
    fontFamily:fonts.primary
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#A0A0A0",
    marginTop: 3,
  },
  logoutContainer: {
    display: 'flex',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    gap: 10,
    borderColor: colors.border,
  }, 
});