import { UserLocation } from "@/@types";
import { HamburgerMenu } from "@/components/ui";
import { colors, fonts } from "@/constants";
import { useRouter } from "expo-router";
import { Image, TextInput, TouchableOpacity, View } from "react-native";

export const DriverAppBar = () => {
  const router = useRouter();
  return (
    <View
      style={{
        position: "absolute",
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
        paddingRight: 10,
        top: 20,
        zIndex: 100,
      }}
    >
      <HamburgerMenu path="/(tabs)/menu" />
    
    </View>
  );
};
