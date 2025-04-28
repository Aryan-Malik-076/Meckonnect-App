import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DEFAULT_URL } from "@/lib/constants";
import { colors, fonts } from "@/constants";
import { MoveBack, PrimaryButton, SafeAreaViews } from "@/components/ui";
import { setToken, setUserAuthData } from "@/lib/helpers";

const VerifyEmailScreen = () => {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState<string[]>(Array(5).fill(""));
  const [resendDisabled, setResendDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const { updateUserAuth } = useAuth();
  const router = useRouter();

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join("");
    setLoading(true);
    try {
      const res = await axios.post(`${DEFAULT_URL}/api/auth/verify-otp`, {
        email,
        otp: fullOtp,
      });
      if (res.data.success) {
        Toast.show({
          type: "success",
          text1: "Email Verified",
          text2: "Your email has been verified successfully!",
        });

        const { token, user } = res.data;
        await setToken(token);
        await setUserAuthData(user);
        updateUserAuth(user);

        setTimeout(() => {
          router.push(
            user.role === "verified-passenger" ||
              user.role === "verified-driver"
              ? "/"
              : "/driver-verification"
          );
        }, 1000);
      }
    } catch (error: any) {
      if (error.response) {
        const message = error.response.data.message;
        if (error.response.status === 200 || error.response.status === 300) {
          Toast.show({
            type: "error",
            text1: "Verification Failed",
            text2: message,
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Network Error",
          text2: "Please check your internet connection and try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 4) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (value: string, index: number) => {
    if (!value && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;
    setResendLoading(true);
    try {
      const res = await axios.post(`${DEFAULT_URL}/api/auth/resend-otp`, {
        email,
      });
      if (res.data.success) {
        Toast.show({
          type: "success",
          text1: "OTP Resent",
          text2: "A new OTP has been sent to your email.",
        });
        setResendDisabled(true);
        setTimeout(() => setResendDisabled(false), 120000);
      }
    } catch (error: any) {
      if (error.response) {
        const message = error.response.data.message;
        if (error.response.status === 200 || error.response.status === 300) {
          Toast.show({ type: "error", text1: "Resend Failed", text2: message });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Network Error",
          text2: "Please check your internet connection and try again.",
        });
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaViews>
      <View style={styles.container}>
        <View>
          <Text style={[styles.header, { fontSize: 20 }]}>
            OTP verification
          </Text>
          <Text
            style={[
              styles.header,
              { paddingHorizontal: 10, color: colors.disabledText },
            ]}
          >
            Enter the verification code we just sent to your email address
          </Text>
        </View>

        <Image
          source={require("../.././assets/images/email-verify.png")}
          style={{ width: 250, height: 250, alignSelf: "center" }}
        />
        <View style={{ gap: 1 }}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputsRef.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                textContentType="telephoneNumber"
                onChangeText={(value) => handleChange(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  nativeEvent.key === "Backspace"
                    ? handleBackspace(digit, index)
                    : null
                }
                keyboardType="numeric"
                maxLength={1}
              />
            ))}
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              marginHorizontal: "auto",
              alignItems: "center",
            }}
          >
            <Text style={styles.header}>Didn’t receive the code</Text>
            <Text style={{ marginBottom: 5, fontSize: 18 }}>?</Text>
            {resendLoading ? (
              <Text style={[styles.header, { color: colors.status }]}>
                {" "}
                Resending...
              </Text>
            ) : (
              <Text
                style={[
                  styles.header,
                  {
                    color: resendDisabled ? colors.disabledText : colors.status,
                    opacity: resendDisabled ? 0.5 : 1,
                  },
                ]}
                onPress={handleResendOtp}
              >
                Resend now
              </Text>
            )}
          </View>
        </View>

        <View style={{ gap: 15, marginTop: "auto" }}>
          <PrimaryButton
            title={loading ? "Verifying..." : "Verify"}
            style={{ width: "100%" }}
            type="primary"
            onPress={handleVerifyOtp}
            disabled={loading}
          />
        </View>
        <Toast />
      </View>
    </SafeAreaViews>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.default,
    justifyContent: "center",
    gap: 30,
  },
  header: { textAlign: "center", fontSize: 16, fontFamily: "" },
  emailInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    maxWidth: 50,
    padding: 10,
    textAlign: "center",
    width: "13%",
    borderRadius: 5,
    fontSize: 18,
    backgroundColor: "#f9f9f9",
  },
  button: {
    padding: 15,
    backgroundColor: "#673DE6",
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 16 },
});

export default VerifyEmailScreen;
