import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/@types';

export const setUserAuthData = async (auth: User | null) => {
  if (auth) {
    const userString = JSON.stringify(auth);
    if (Platform.OS === 'web') {
      localStorage.setItem('userAuth', userString);
    } else {
      await AsyncStorage.setItem('userAuth', userString);
    }
  } else {
    if (Platform.OS === 'web') {
      localStorage.removeItem('userAuth');
    } else {
      await AsyncStorage.removeItem('userAuth');
    }
  }
};

// Function to get user authentication data
export const getUserAuth = async (): Promise<User | null> => {
  let userString;
  if (Platform.OS === 'web') {
    userString = localStorage.getItem('userAuth');
  } else {
    userString = await AsyncStorage.getItem('userAuth');
  }
  return userString ? JSON.parse(userString) : null;
};

// Function to set JWT token
export const setToken = async (token: string | null) => {
  if (token) {
    if (Platform.OS === 'web') {
      localStorage.setItem('token', token);
    } else {
      await AsyncStorage.setItem('token', token);
    }
  } else {
    if (Platform.OS === 'web') {
      localStorage.removeItem('token');
    } else {
      await AsyncStorage.removeItem('token');
    }
  }
};

// Function to get JWT token
export const getToken = async (): Promise<string | null> => {
  let token;
  if (Platform.OS === 'web') {
    token = localStorage.getItem('token');
  } else {
    token = await AsyncStorage.getItem('token');
  }
  return token;
};
