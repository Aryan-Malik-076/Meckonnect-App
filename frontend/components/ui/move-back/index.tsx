import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts } from "@/constants";

export const MoveBack = ({ path }: { path: any }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={{
        display: "flex",
        padding: 10,
        marginTop: 15,
        marginLeft: 15,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        boxShadow: "0 0 5px rgba(0,0,0,0.1)",
        width: 40,
        height: 40,
        borderRadius: "50%",
      }}
      onPress={() => router.push({ pathname: path, params: {} })}
    >
      <Image
        source={require("@/assets/images/back.png")}
        style={{ width: 20, height: 20 }}
      />
    </TouchableOpacity>
  );
};

export default MoveBack;
