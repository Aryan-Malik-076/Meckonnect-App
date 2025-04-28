import { menuStyles } from '@/components/styles'
import { MenuList } from '@/components/ui'
import { colors, fonts } from '@/constants'
import { useAuth } from '@/contexts'
import { menuItems } from '@/lib/constants'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

export const MenuScreen = () => {
  const { userAuth, handleLogout } = useAuth();
  const router = useRouter()

  return (
    <View style={menuStyles.container}>
      <View style={menuStyles.infoContainer}>
        <Image style={menuStyles.image} source={require('@/assets/images/profile.png')} />
        <View style={{ paddingTop: 3 }}>
          <Text style={menuStyles.heading}>{userAuth?.username}</Text>
          <View style={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'center' }}>
            <Image style={[menuStyles.image, { width: 20, height: 20, resizeMode: 'stretch' }]} source={require('@/assets/images/star.png')} />
            <Text style={{ paddingTop: 2, fontFamily: fonts.primary }}>{userAuth?.rating || 0.00} Rating</Text>
          </View>
        </View>
      </View>
      <View style={menuStyles.walletContainer}>
        <Image style={[menuStyles.image, { width: 30, height: 30, resizeMode: 'stretch' }]} source={require('@/assets/images/wallet.png')} />
        <View style={{ gap: 0 }}>
          <Text style={{ color: colors.default, fontSize: 12, fontFamily: fonts.primary, margin: 0 }}> £{userAuth?.money || 0}</Text>
          <Text style={{ color: colors.default, fontSize: 12, fontFamily: fonts.primary, margin: 0, paddingLeft: 3 }}>Your Money</Text>
        </View>
      </View>
      <MenuList menuItems={menuItems} />
      <TouchableOpacity onPress={handleLogout} style={menuStyles.logoutContainer}>
        <Image style={[menuStyles.image, { width: 30, height: 30, resizeMode: 'stretch' }]} source={require('@/assets/images/logout.png')} />
        <View style={{ gap: 0 }}>
          <Text style={{ color: colors.danger, fontSize: 12, fontFamily: fonts.primary, margin: 0, paddingLeft: 3 }}>Logout</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

