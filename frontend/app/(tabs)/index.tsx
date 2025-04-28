import {
  PassengerMain,
} from "@/components/screens";
import DriverMain from "@/components/screens/driver-main";
import { SafeAreaViews } from "@/components/ui";
import { useAuth } from "@/contexts";
import { AuthGuard } from "@/hooks";
import React from "react";
import { View } from "react-native";

const HomeScreen = () => {
  const { userAuth } = useAuth();
  return (
    <SafeAreaViews style={{ padding: 0, flex: 1 }}>
      <AuthGuard allowedRoles={['verified-passenger', 'verified-driver']} allowNullRole={false} />
      <View style={{ flex: 1 }}>
        {
          userAuth && userAuth.role && userAuth.role === 'verified-passenger' && <PassengerMain />
        }
        {
          userAuth && userAuth.role && userAuth.role === 'verified-driver' && <DriverMain />
        }
      </View>

    </SafeAreaViews>
  );
};

export default HomeScreen;
