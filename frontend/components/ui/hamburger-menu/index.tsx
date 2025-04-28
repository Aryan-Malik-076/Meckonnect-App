import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts } from "@/constants";

export const HamburgerMenu = ({ path }: { path: any }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={{
        display: "flex",
        padding: 10,
        marginLeft: 15,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor:colors.default,
        zIndex: 100,
        boxShadow: "0 0 5px rgba(0,0,0,0.1)",
        width: 38,
        height: 38,
        borderRadius: "50%",
      }}
      onPress={() => router.push({ pathname: path, params: {} })}
    >
      <Image
        source={require("@/assets/images/hamburger.png")}
        style={{ width: 15, height: 15 }}
      />
    </TouchableOpacity>
  );
};
