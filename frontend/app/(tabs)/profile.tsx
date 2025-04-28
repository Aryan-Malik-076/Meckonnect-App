import { DriverProfileScreen, ProfileScreen } from '@/components/screens'
import { SafeAreaViews } from '@/components/ui';
import { useAuth } from '@/contexts';
import React from 'react'
import { View } from 'react-native'

const Profile = () => {
  const { userAuth } = useAuth();
  return (
    <SafeAreaViews style={{ display: 'flex', flex: 1, padding: 0 }}>

      <View style={{ flex: 1 }}>
        {
          userAuth?.role === 'verified-passenger' && <ProfileScreen />
        }
        {
          userAuth?.role === 'verified-driver' && <DriverProfileScreen />
        }

      </View>
    </SafeAreaViews>

  )
}

export default Profile