import { PrimaryButton } from "@/components/ui";
import { colors, fonts } from "@/constants";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AuthGuard } from "@/hooks";
import React from "react";

const OnBoardScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <AuthGuard allowedRoles={[""]} allowNullRole />

      <View style={style.container}>
        <View style={style.imageContainer}>
          <Image
            style={style.image}
            source={require("../assets/images/w5.png")}
          />
          <View style={{ gap: 0 }}>
            <Text style={style.heading}>Welcome to MecKonnect!</Text>
            <Text style={style.description}>
            Your vehicle, your way. A modern mechanic service hub committed to safety, reliability, and convenience for all.
            </Text>
          </View>
        </View>

        <View style={style.buttonsContainer}>
          <PrimaryButton
            title="Create Account"
            onPress={() =>
              router.push({
                pathname: "./signup",
              })
            }
          />

          <PrimaryButton
            title="Login Now"
            type="secondary"
            onPress={() =>
              router.push({
                pathname: "./login",
              })
            }
          />
          <TouchableOpacity
            onPress={() => router.push({ pathname: "./driver-signup" })}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 14,
                fontFamily: fonts.primary,
                textDecorationLine: "underline",
                margin: "auto",
              }}
            >
              Create driver account{" "}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const style = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
    backgroundColor: "white",
  },
  imageContainer: {
    flex: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 1,
    display: "flex",
    flexDirection: "column",
  },
  image: {
    height: "80%",
    width: "100%",
    margin: "auto",
    resizeMode: "contain",
  },
  heading: {
    marginTop: 10,
    textAlign: "center",
    color: colors.primarySolid,
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: fonts.primary,
  },
  description: {
    color: colors.dark,
    fontSize: 16,
    textAlign: "center",
    fontFamily: fonts.primary,
  },
  text: {
    fontSize: 20,
  },
  buttonsContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
});

export default OnBoardScreen;
