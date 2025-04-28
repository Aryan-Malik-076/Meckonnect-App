import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { DEFAULT_URL } from "@/lib/constants";
import {
  GoogleAuth,
  MoveBack,
  PrimaryButton,
  SafeAreaViews,
} from "@/components/ui";
import { colors, fonts } from "@/constants";
import { primaryStyles } from "@/components/styles";
import { AuthGuard } from "@/hooks";

interface DriverFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: string;
  phoneNumber: string;
  numberPlate: string;
  carName: string;
  carModel: string;
  licenseNumber: string;
}

const DriverSignupScreen = () => {
  const [formData, setFormData] = useState<DriverFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "female",
    numberPlate: "",
    carName: "",
    carModel: "",
    licenseNumber: "",
    phoneNumber: "",
  });

  const router = useRouter();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formValid, setFormValid] = useState(false);
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof DriverFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  useEffect(() => {
    const checkPasswordStrength = (password: string) => {
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[@$!%*?&]/.test(password)) strength++;
      setPasswordStrength(strength);
    };
    checkPasswordStrength(formData.password);
  }, [formData.password]);

  useEffect(() => {
    const validateForm = () => {
      const isValid =
        formData.name.length > 0 &&
        formData.email.length > 0 &&
        formData.password === formData.confirmPassword &&
        passwordStrength >= 2 &&
        formData.numberPlate.length > 0 &&
        formData.carName.length > 0 &&
        formData.carModel.length > 0 &&
        formData.licenseNumber.length > 0 &&
        acceptPolicy;
      setFormValid(isValid);
    };
    validateForm();
  }, [formData, passwordStrength, acceptPolicy]);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${DEFAULT_URL}/api/auth/driver/signup`, {
        username: formData.name,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        numberPlate: formData.numberPlate,
        carName: formData.carName,
        carModel: formData.carModel,
        licenseNumber: formData.licenseNumber,
      });

      if (res.data.message === 202) {
        Toast.show({
          type: "error",
          text1: "Signup Failed",
          text2: "Email already exists",
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Signup Successful",
        text2: "OTP sent to your email",
      });

      router.push({
        pathname: `/email-verification/[email]`,
        params: { email: formData.email },
      });
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Signup Failed",
        text2: "Unable to create account. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaViews>
      <AuthGuard allowedRoles={[""]} allowNullRole />;
      <MoveBack path={"/onboard"} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.header, primaryStyles.header]}>
          Driver Registration
        </Text>

        {/* Personal Information */}
        <Text style={styles.sectionHeader}>Personal Information</Text>
        <TextInput
          style={[styles.input, { fontFamily: fonts.primary }]}
          placeholder="Name"
          value={formData.name}
          onChangeText={(value) => handleInputChange("name", value)}
        />

        <TextInput
          style={[styles.input, { fontFamily: fonts.primary }]}
          placeholder="Email"
          value={formData.email}
          onChangeText={(value) => handleInputChange("email", value)}
        />

        <TextInput
          style={[styles.input, { fontFamily: fonts.primary }]}
          placeholder="Password"
          secureTextEntry
          value={formData.password}
          onChangeText={(value) => handleInputChange("password", value)}
        />

        <TextInput
          style={[styles.input, { fontFamily: fonts.primary }]}
          placeholder="Confirm Password"
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange("confirmPassword", value)}
        />

        <TextInput
          style={[
            styles.input,
            { fontFamily: fonts.primary, backgroundColor: colors.primaryLight },
          ]}
          value="Female"
          editable={false}
        />
        {/* Vehicle Information */}
        <Text style={styles.sectionHeader}>Vehicle Information</Text>
        <TextInput
          style={[styles.input, { fontFamily: fonts.primary }]}
          placeholder="Number Plate"
          value={formData.numberPlate}
          onChangeText={(value) => handleInputChange("numberPlate", value)}
        />
        <TextInput
          style={[styles.input, { fontFamily: fonts.primary }]}
          placeholder="Whatsapp Number"
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange("phoneNumber", value)}
        />

        <TextInput
          style={[styles.input, { fontFamily: fonts.primary }]}
          placeholder="Car Name"
          value={formData.carName}
          onChangeText={(value) => handleInputChange("carName", value)}
        />

        <TextInput
          style={[styles.input, { fontFamily: fonts.primary }]}
          placeholder="Car Model"
          value={formData.carModel}
          onChangeText={(value) => handleInputChange("carModel", value)}
        />

        {/* License Information */}
        <Text style={styles.sectionHeader}>License Information</Text>
        <TextInput
          style={[styles.input, { fontFamily: fonts.primary }]}
          placeholder="License Number"
          value={formData.licenseNumber}
          onChangeText={(value) => handleInputChange("licenseNumber", value)}
        />

        <View style={styles.strengthBarContainer}>
          <View
            style={[
              styles.strengthBar,
              {
                backgroundColor:
                  passwordStrength === 1
                    ? "red"
                    : passwordStrength === 2
                    ? "orange"
                    : colors.status,
                width: `${(passwordStrength / 4) * 100}%`,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAcceptPolicy(!acceptPolicy)}
        >
          <View style={[styles.checkbox, acceptPolicy && styles.checked]} />
          <Text style={styles.checkboxText}>
            By signing up, you agree to the{" "}
            <Text style={styles.link}>Terms of Service</Text>
            <Text> and </Text>
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>

        <View style={{ gap: 15, marginTop: 10 }}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: formValid ? colors.primary : colors.disabled },
            ]}
            disabled={!formValid || loading}
            onPress={handleSignup}
          >
            <Text style={styles.buttonText}>
              {loading ? (
                <ActivityIndicator color={colors.default} />
              ) : (
                "Register as Driver"
              )}
            </Text>
          </TouchableOpacity>
          <GoogleAuth />
          <PrimaryButton
            style={{ width: "100%" }}
            title="Login Now"
            type="secondary"
            onPress={() => router.push({ pathname: "/login", params: {} })}
          />
        </View>
        <Toast />
      </ScrollView>
    </SafeAreaViews>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: "8%",
    backgroundColor: colors.default,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 15,
    marginBottom: 10,
    fontFamily: fonts.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.disabled,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  strengthBarContainer: {
    height: 5,
    width: "100%",
    backgroundColor: colors.disabled,
    borderRadius: 5,
    marginBottom: 20,
  },
  strengthBar: {
    height: "100%",
    borderRadius: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    marginRight: 10,
    backgroundColor: colors.default,
  },
  checked: {
    backgroundColor: colors.primary,
  },
  checkboxText: {
    fontSize: 14,
    color: colors.dark,
    fontFamily: fonts.primary,
  },
  link: {
    color: colors.primary,
    textDecorationLine: "underline",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  buttonText: {
    color: colors.default,
    fontSize: 16,
    fontFamily: fonts.primary,
  },
});

export default DriverSignupScreen;
