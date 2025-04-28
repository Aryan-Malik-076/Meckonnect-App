// File: app/(app)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts';
import { DEFAULT_URL } from '@/lib/constants';

// Define types for our data
interface User {
  username: string;
  verificationStatus: string;
  rating: number;
  wallet: number;
  joinedDate: string;
}

interface Ride {
  id: string;
  status: string;
  date: string;
  startAddress: string;
  destinationAddress: string;
  fare: number;
  distance: number;
  driverName: string;
}

interface Statistics {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalDistance: number;
  totalSpent: number;
}

interface ProfileData {
  user: User;
  rideHistory: Ride[];
  statistics: Statistics;
}

export const ProfileScreen = () => {
  const { userAuth } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('rides');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${DEFAULT_URL}/api/profile/user`, { id: userAuth?.id });
      setProfileData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'in_progress': return '#2196F3';
      case 'searching': return '#FFC107';
      case 'driver_found': return '#9C27B0';
      case 'picking_up': return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'in_progress': return 'car';
      case 'searching': return 'search';
      case 'driver_found': return 'person'; // Changed from 'person-found' to 'person'
      case 'picking_up': return 'navigate';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string): string => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#6C63FF', '#4A45B2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeaderContent}>
          <Image
            source={{ uri: 'https://ui-avatars.com/api/?name=alex' }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{profileData?.user.username}</Text>
          <View style={styles.verificationContainer}>
            <Text style={styles.verificationText}>
              {profileData?.user.verificationStatus === 'email-verified' ? 'Verified' : 'Not Verified'}
            </Text>
            {profileData?.user.verificationStatus === 'email-verified' && (
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.verificationIcon} />
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="car-multiple" size={24} color="#6C63FF" />
            </View>
            <Text style={styles.statValue}>{profileData?.statistics.totalRides || 0}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>

          {/* <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <FontAwesome5 name="money-bill-wave" size={18} color="#6C63FF" />
            </View>
            <Text style={styles.statValue}>${profileData?.statistics.totalSpent.toFixed(2) || 0}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={24} color="#6C63FF" />
            </View>
            <Text style={styles.statValue}>{profileData?.user.rating.toFixed(1) || 0}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View> */}
        </View>

        {/* <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#6C63FF', '#4A45B2']}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.balanceContent}>
              <View>
                <Text style={styles.balanceLabel}>Wallet Balance</Text>
                <Text style={styles.balanceValue}>${profileData?.user.wallet.toFixed(2) || 0}</Text>
              </View>
              <TouchableOpacity style={styles.addFundsButton}>
                <Text style={styles.addFundsText}>Add Funds</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View> */}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rides' && styles.activeTab]}
            onPress={() => setActiveTab('rides')}
          >
            <Text style={[styles.tabText, activeTab === 'rides' && styles.activeTabText]}>Ride History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Statistics</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'rides' && (
          <View style={styles.ridesContainer}>
            <Text style={styles.sectionTitle}>Your Recent Rides</Text>

            {profileData?.rideHistory?.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={50} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>No rides yet</Text>
                <Text style={styles.emptyStateSubtext}>Your ride history will appear here</Text>
                <TouchableOpacity style={styles.bookRideButton}>
                  <Text style={styles.bookRideText}>Book Your First Ride</Text>
                </TouchableOpacity>
              </View>
            ) : (
              profileData?.rideHistory?.map((ride: Ride, index: number) => (
                <View key={ride.id} style={styles.rideCard}>
                  <View style={styles.rideHeader}>
                    <View style={styles.rideStatusContainer}>
                      <Ionicons
                        name={getStatusIcon(ride.status) as any}
                        size={16}
                        color={getStatusColor(ride.status)}
                      />
                      <Text style={[styles.rideStatus, { color: getStatusColor(ride.status) }]}>
                        {ride.status.replace('_', ' ').charAt(0).toUpperCase() + ride.status.replace('_', ' ').slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.rideDate}>{formatDate(ride.date)}</Text>
                  </View>

                  <View style={styles.rideRoute}>
                    <View style={styles.locationContainer}>
                      <View style={styles.locationDot} />
                      <Text style={styles.locationText} numberOfLines={1}>{ride.startAddress}</Text>
                    </View>

                    <View style={styles.routeLine} />

                    <View style={styles.locationContainer}>
                      <View style={[styles.locationDot, styles.destinationDot]} />
                      <Text style={styles.locationText} numberOfLines={1}>{ride.destinationAddress}</Text>
                    </View>
                  </View>

                  <View style={styles.rideFooter}>
                    <View style={styles.rideDetail}>
                      <Ionicons name="cash-outline" size={16} color="#666" />
                      <Text style={styles.rideDetailText}>${ride.fare?.toFixed(2) || 0}</Text>
                    </View>

                    <View style={styles.rideDetail}>
                      <Ionicons name="speedometer-outline" size={16} color="#666" />
                      <Text style={styles.rideDetailText}>{ride.distance?.toFixed(1) || 0} km</Text>
                    </View>

                    <View style={styles.rideDetail}>
                      <Ionicons name="person-outline" size={16} color="#666" />
                      <Text style={styles.rideDetailText}>{ride.driverName}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.statsDetailContainer}>
            <Text style={styles.sectionTitle}>Ride Statistics</Text>

            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <Text style={styles.statTitle}>Total Rides</Text>
                <Text style={styles.statDetail}>{profileData?.statistics.totalRides || 0}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statTitle}>Completed Rides</Text>
                <Text style={styles.statDetail}>{profileData?.statistics.completedRides || 0}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statTitle}>Cancelled Rides</Text>
                <Text style={styles.statDetail}>{profileData?.statistics.cancelledRides || 0}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statTitle}>Total Distance</Text>
                <Text style={styles.statDetail}>{profileData?.statistics.totalDistance?.toFixed(1) || 0} km</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statTitle}>Total Spent</Text>
                <Text style={styles.statDetail}>${profileData?.statistics.totalSpent?.toFixed(2) || 0}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statTitle}>Average Cost per Ride</Text>
                <Text style={styles.statDetail}>
                  ${(profileData?.statistics?.completedRides ?? 0) > 0
                    ? ((profileData?.statistics?.totalSpent ?? 0) / (profileData?.statistics?.completedRides ?? 1)).toFixed(2)
                    : '0.00'}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statTitle}>Average Distance per Ride</Text>
                <Text style={styles.statDetail}>
                  {profileData?.statistics?.completedRides ?
                    (profileData?.statistics?.totalDistance ?? 0 / profileData?.statistics?.completedRides).toFixed(1)
                    : '0.0'} km
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statTitle}>Completion Rate</Text>
                <Text style={styles.statDetail}>
                  {profileData?.statistics?.totalRides ?
                    ((profileData?.statistics?.completedRides ?? 0 / profileData?.statistics?.totalRides) * 100).toFixed(0)
                    : '0'}%
                </Text>
              </View>
            </View>

            <View style={styles.memberSinceContainer}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.memberSinceText}>
                Member since {profileData?.user.joinedDate ? new Date(profileData.user.joinedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
};

// Completed styles for the ProfileScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  settingsButton: {
    padding: 5,
  },
  profileHeaderContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  verificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  verificationIcon: {
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
    marginTop: -20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceGradient: {
    padding: 20,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  balanceValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  addFundsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addFundsText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#EAEAEA',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  ridesContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
  },
  bookRideButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  bookRideText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rideStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  rideDate: {
    fontSize: 12,
    color: '#666',
  },
  rideRoute: {
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6C63FF',
    marginRight: 10,
  },
  destinationDot: {
    backgroundColor: '#FF6584',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  routeLine: {
    width: 1,
    height: 20,
    backgroundColor: '#DDD',
    marginLeft: 5,
    marginBottom: 8,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  rideDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideDetailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  statsDetailContainer: {
    paddingHorizontal: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  statDetail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  memberSinceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  memberSinceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  footerSpace: {
    height: 40,
  },
});