import { PrimaryButton } from "@/components/ui"
import { colors, fonts } from "@/constants"
import { useAuth } from "@/contexts"
import { Image, Text, View } from "react-native"

export const DriverPendingStatus = () => {
  const { handleLogout } = useAuth()

  return (

    <View style={{ alignItems: 'center', width: '100%', flex: 1, padding: 30 }}>
      <View style={{ alignItems: 'center', width: '100%', marginTop: 'auto', flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fonts.secondary, fontSize: 28, }}>
          Pending Status
        </Text>
        <Text style={{ fontFamily: fonts.primary, fontSize: 16, fontWeight: '300', textAlign: 'center' }}>Your documents verification is in progress. We will let you know when its completed. Thank you for your patience. </Text>

        <View style={{ flexDirection: 'row', alignItems: "center", marginVertical: 'auto' }}>
          <Image source={require('../../.././assets/images/pending.png')} style={{ width: 300, height: 300 }} />
        </View>
      </View>

      <View style={{ gap: 10, width: '100%', alignItems: 'center', marginTop: 'auto', marginBottom: 10 }}>
        <PrimaryButton type="secondary" style={{ width: '90%' }} title="Log out" onPress={handleLogout} />
      </View>

    </View>
  )

}