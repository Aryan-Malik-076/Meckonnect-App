import { User } from "@/@types";
import { DEFAULT_URL } from "@/lib/constants";
import { getUserAuth, setUserAuthData } from "@/lib/helpers";
import axios from "axios";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  userAuth: User | null;
  setUserAuth: (auth: User | null) => void;
  handleLogout: () => void;
  updateUserAuth: (user: any) => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userAuth, setUserAuth] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const updateUserAuth = (user: any) => {
    setUserAuth({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      verificationStatus: user.verificationStatus,
    });
  };
  useEffect(() => {
    const initializeUserAuth = async () => {
      const storedUserAuth = await getUserAuth();
      console.log(storedUserAuth);
      if (storedUserAuth && storedUserAuth.id) {
        console.log("Getting user");
        try {
          console.log(`${DEFAULT_URL}/api/auth/myprofile/${storedUserAuth.id}`)
          const user = await axios.get(`${DEFAULT_URL}/api/auth/myprofile/${storedUserAuth.id}`);
          if (user.data) {
            console.log(user.data,'sa');
            setUserAuth(user.data);
            setUserAuthData(user.data);
          }
        } catch (error) {
          console.log('Error', error);
        }
        finally {
          setIsReady(true);
        }
      }
      setIsReady(true);
    };
    initializeUserAuth();
  }, []);

  const handleLogout = () => {
    console.log("Logging out");
    setUserAuth(null);
    setUserAuthData(null);
    router.push("/onboard");
    setIsReady(true);
  };

  return (
    <AuthContext.Provider
      value={{
        userAuth,
        setUserAuth: setUserAuthData,
        handleLogout,
        updateUserAuth,
        isReady
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Unable to connect to the server.");
  }
  return context;
};
