import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { DEFAULT_URL } from '@/lib/constants';
import { PrimaryButton } from '@/components/ui';
import { colors, fonts } from '@/constants';

const ForgetResetPassword = () => {
  const [form, setForm] = useState({
    email: '',
    otp: '',
    newPassword: '',
    reenterPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('email');
  const [otpSent, setOtpSent] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  const handleInputChange = (name: string, value: string) => {
    setForm({
      ...form,
      [name]: value
    });
  };

  useEffect(() => {
    // Password strength logic
    const checkPasswordStrength = (password: string) => {
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[@$!%*?&]/.test(password)) strength++;
      setPasswordStrength(strength);
    };
    checkPasswordStrength(form.newPassword);
  }, [form.newPassword]);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${DEFAULT_URL}/api/auth/forgot-password`, { email: form.email });
      if (res.data.success) {
        Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Check your email for the OTP code.' });
        setOtpSent(true);
        setStep('reset');
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.data.message });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Failed to send OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (form.newPassword !== form.reenterPassword) {
      Toast.show({ type: 'error', text1: 'Password Mismatch', text2: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${DEFAULT_URL}/api/auth/reset-password`, {
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword
      });
      if (res.data.success) {
        Toast.show({ type: 'success', text1: 'Password Reset', text2: 'Your password has been reset successfully!' });
        router.push('/login');
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.data.message });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/email-verify.png')} style={{ resizeMode: 'stretch', width: 200, height: 200 }} />
      
      {step === 'email' ? (
        <>
          <Text style={styles.header}>Forgot Password</Text>
          <TextInput
            placeholder="Enter your email"
            style={styles.input}
            value={form.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {loading ? <TouchableOpacity style={styles.button} disabled={loading || !form.email}>
            <ActivityIndicator color="#fff" />
          </TouchableOpacity>
            : <PrimaryButton style={{ width: '100%' }} disabled={loading || !form.email} title='Send OTP' onPress={handleSendOtp} />
          }
        </>
      ) : (
        <>
          <Text style={styles.header}>Reset Password</Text>
          <TextInput
            placeholder="Enter OTP"
            style={styles.input}
            value={form.otp}
            onChangeText={(value) => handleInputChange('otp', value)}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Enter new password"
            style={styles.input}
            value={form.newPassword}
            onChangeText={(value) => handleInputChange('newPassword', value)}
            secureTextEntry
          />
          <TextInput
            placeholder="Re-enter new password"
            style={styles.input}
            value={form.reenterPassword}
            onChangeText={(value) => handleInputChange('reenterPassword', value)}
            secureTextEntry
          />

          {/* Password Strength Indicator */}
          <View style={styles.strengthBarContainer}>
            <View
              style={[styles.strengthBar, {
                backgroundColor:
                  passwordStrength === 1 ? 'red' : passwordStrength === 2 ? 'orange' : passwordStrength >= 3 ? colors.status : 'gray',
                width: `${(passwordStrength / 4) * 100}%`
              }]}
            />
          </View>

          {loading ? <TouchableOpacity
            style={styles.button}
            disabled={loading || !form.otp || !form.newPassword || !form.reenterPassword}
          >
            <ActivityIndicator color="#fff" />
          </TouchableOpacity>
            :
            <PrimaryButton style={{ width: '100%' }} onPress={handleResetPassword}
              disabled={loading || !form.email} title='Reset Password' />
          }
        </>
      )}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    alignItems: 'center'
  },
  header: {
    fontFamily: fonts.secondary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    width: '100%',
    padding: 13,
    fontFamily: fonts.primary,
    marginBottom: 20,
    borderRadius: 5,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 5,
    width: '100%'
  },
  strengthBarContainer: {
    height: 5,
    width: '100%',
    backgroundColor: colors.disabled,
    borderRadius: 5,
    marginBottom: 20,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 5,
  }
});

export default ForgetResetPassword;
