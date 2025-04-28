import { UserLocation } from "@/@types";
import { HamburgerMenu } from "@/components/ui";
import { colors, fonts } from "@/constants";
import { useRouter } from "expo-router";
import { Image, TextInput, TouchableOpacity, View } from "react-native";

export const PassengerAppBar = ({
  destinationLocation,
  startLocation,
}: {
  startLocation: UserLocation | null;
  destinationLocation: UserLocation | null;
}) => {
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
      <TouchableOpacity
        disabled={!!(startLocation && destinationLocation)}
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: colors.default,
            borderRadius: 35,
            boxShadow: "0 0 5px rgba(0,0,0,0.1)",
            padding: 10,
            paddingHorizontal: 14,
            flex: 1,
            margin: "auto",
            height: 40,
          },
        ]}
        onPress={
          startLocation && destinationLocation
            ? () => {}
            : () =>
                router.push({
                  pathname: "/(tabs)/location-selection",
                  params: {},
                })
        }
      >
        <Image
          source={require("@/assets/images/red-pin.png")}
          style={{ width: 15, height: 15 }}
          resizeMode="stretch"
        />
        <TextInput
          editable={false}
          style={{
            flex: 1,
            flexDirection: "row",
            height: 40,
            fontFamily: fonts.primary,
            fontSize: 13,
          }}
          placeholder="Where you want to go?"
          value={destinationLocation?.address}
        />
      </TouchableOpacity>
    </View>
  );
};
