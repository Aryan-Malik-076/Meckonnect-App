import React, { useEffect } from 'react';
import { View, Button, StyleSheet } from 'react-native';
// import { GoogleSigninButton } from '@react-native-google-signin/google-signin';

export const GoogleAuth = () => {

  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: 'YOUR_WEB_CLIENT_ID',
  //     offlineAccess: true,
  //   });
  // }, []);

  // const signInWithGoogle = async () => {
  //   try {
  //     await GoogleSignin.hasPlayServices();
  //     const userInfo = await GoogleSignin.signIn();

  //     const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data?.idToken);

  //     const user = await auth().signInWithCredential(googleCredential);

  //     console.log('User Info:', user);
  //   } catch (error: any) {
  //     if (error.code === statusCodes.SIGN_IN_CANCELLED) {
  //       console.log('User cancelled the login flow');
  //     } else if (error.code === statusCodes.IN_PROGRESS) {
  //       console.log('Signin is in progress already');
  //     } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
  //       console.log('Play services not available or outdated');
  //     } else {
  //       console.log('Error:', error);
  //     }
  //   }
  // };

  return (
    <View >
      {/* <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={() => {
        }} */}
      {/* /> */}
    </View>
  );
};

const styles = StyleSheet.create({

});

