import { GestureResponderEvent } from "react-native";

export interface PrimaryButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  type?: "primary" | "secondary";
  style?: object;
  disabled?: boolean;
}

// types.ts

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  verificationStatus: string;
  rating?: number;
  money?: number;
}

// types.ts
export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export enum RideStatus {
  idle = 'IDLE',
  searching = 'SEARCHING',
  driverFound = 'DRIVER_FOUND',
  driverAccepted = 'DRIVER_ACCEPTED',
  driverRequested = 'DRIVER_REQUESTED',
  pickingUp = 'PICKING_UP',
  inProgress = 'IN_PROGRESS',
  completed = 'COMPLETED',
  cancelled = 'CANCELLED'
}

export interface Driver {
  id: string;
  username: string;
  rating: number;
  vehicleDetails?: {
    model: string;
    plateNumber: string;
  };
  location?: UserLocation;
}

export interface RideRequest {
  id: string;
  customerId: string;
  driverId?: string;
  startLocation: UserLocation;
  destinationLocation: UserLocation;
  rideStatus: RideStatus;
  fare: number;
  distance: number;
}

export type MenuListItem = {
  icon: string;
  title: string;
  path: string;
  subtitle?: string;
};

export type MenuListSection = {
  heading: string;
  items: MenuListItem[];
};

export type MenuListProps = {
  menuItems: MenuListSection[];
};
