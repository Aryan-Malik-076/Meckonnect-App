import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Image, ScrollView } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { DEFAULT_URL } from '@/lib/constants';
import { colors, fonts } from '@/constants';
import { MoveBack, PrimaryButton, SafeAreaViews } from '@/components/ui';
import { AuthGuard } from '@/hooks';
import { setToken, setUserAuthData } from '@/lib/helpers';
import { useAuth } from '@/contexts';

const LoginScreen = () => {
  const [credentials, setCredentials] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState<boolean>(false);

  const { updateUserAuth } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${DEFAULT_URL}/api/auth/login`, credentials);
      const { token, user } = res.data;

      updateUserAuth(user);
      await setToken(token);
      await setUserAuthData(user);


      if (user.verificationStatus !== 'email-verified') {
        Toast.show({
          type: 'info',
          text1: 'Email Verification',
          text2: 'Please verify your email to continue.',
        });
        router.push({
          pathname: '/email-verification/[email]',
          params: { email: credentials.email },
        });
      } else {
        if (user.role === 'verified-passenger' || user.role === 'verified-driver') {
          router.push({ pathname: '/' });
        } else if (user.role === 'driver-status-1' || user.role === 'driver-status-2') {
          router.push({ pathname: '/driver-verification', params: {} });
        } else {
          router.push({ pathname: '/', params: {} });
        }
      }
    } catch (error: any) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: 'Please verify your email. OTP has been sent.',
        });
        router.push({
          pathname: '/email-verification/[email]',
          params: { email: credentials.email },
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: error.response?.data?.message || 'An error occurred. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaViews>
      <AuthGuard allowedRoles={['']} allowNullRole={true} />

      <MoveBack path={'/onboard'} />
      <ScrollView>
        <View style={{ alignItems: 'center' }}>
          <Image
            source={require('.././assets/images/email-verify.png')}
            style={{ width: 200, height: 200, marginTop: 20 }} />
          <Text style={{ fontFamily: fonts.secondary, fontSize: 32 }}>Sign In to your account</Text>

        </View>
        <View style={styles.container}>
          <TextInput
            placeholder="Email"
            value={credentials.email}
            onChangeText={(email) => setCredentials((prev) => ({ ...prev, email }))}
            style={[styles.input, { fontFamily: fonts.primary }]}
          />
          <TextInput
            placeholder="Password"
            value={credentials.password}
            onChangeText={(password) => setCredentials((prev) => ({ ...prev, password }))}
            secureTextEntry
            style={[styles.input, { fontFamily: fonts.primary }]}
          />
          <Text onPress={() => router.push('/forget-password')} style={{ color: colors.primary, fontFamily: fonts.primary, fontWeight: '500', marginBottom: 4, textAlign: 'left', alignSelf: 'flex-start' }}>Forgot password?</Text>
          <PrimaryButton onPress={handleLogin} style={{ width: '100%' }} title={loading ? 'Signing in' : 'Sign In'} />

          <Toast />
        </View>
      </ScrollView>

    </SafeAreaViews>
  );
};

const styles = StyleSheet.create({
  container: { padding: '8%', flex: 1, justifyContent: 'center', backgroundColor: colors.default, alignItems: 'center' },
  input: { marginBottom: 10, padding: 13, width: '100%', borderWidth: 1, borderColor: colors.disabled, borderRadius: 8 },

});

export default LoginScreen;
