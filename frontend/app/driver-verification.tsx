import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Alert } from "react-native";
import { DriverDocumentsUpload, DriverPendingStatus } from "@/components/screens";
import { useAuth } from "@/contexts";
import { useRouter } from "expo-router";
import { SafeAreaViews, StepBar } from "@/components/ui";
import { colors } from "@/constants";

// Define type for user role
type UserRole = 
  | "driver" 
  | "driver-status-1" 
  | "driver-status-2" 
  | "verified-passenger" 
  | "verified-driver" 
  | undefined;

// Define the component props if needed
interface DriverVerificationStepsProps {
  // Add any props here if necessary
}

const DriverVerificationSteps: React.FC<DriverVerificationStepsProps> = () => {
  const [step, setStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { userAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async (): Promise<void> => {
      try {
        if (userAuth) {
          const role: UserRole = userAuth.role as UserRole;
          
          switch (role) {
            case "driver-status-1":
            case "driver":
              setStep(1);
              break;
            case "driver-status-2":
              setStep(2);
              break;
            case "verified-passenger":
            case "verified-driver":
              router.push("/");
              break;
            default:
              // Handle unexpected role
              setError(`Unexpected user role: ${role}`);
              break;
          }
        } else {
          // If no user auth, redirect to login
          router.push("/login");
        }
      } catch (err) {
        setError("Failed to process user authentication");
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [userAuth, router]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert(
        "Error",
        error,
        [{ text: "OK", onPress: () => router.push("/login") }]
      );
    }
  }, [error, router]);

  if (loading) {
    return (
      <SafeAreaViews>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaViews>
    );
  }

  if (error) {
    return (
      <SafeAreaViews>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "red" }}>
            Something went wrong. Please try again.
          </Text>
        </View>
      </SafeAreaViews>
    );
  }

  return (
    <SafeAreaViews>
      <View style={{ backgroundColor: colors.default, flex: 1 }}>
        <StepBar currentStep={step} />
        {step === 1 ? (
          <DriverDocumentsUpload setStep={setStep} />
        ) : step === 2 ? (
          <DriverPendingStatus />
        ) : (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>Invalid step. Please restart the verification process.</Text>
          </View>
        )}
      </View>
    </SafeAreaViews>
  );
};

export default DriverVerificationSteps;