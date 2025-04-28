import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '@/contexts';
import { DEFAULT_URL } from '@/lib/constants';
import { CustomModal } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

// Types based on your mongoose models
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  verificationStatus: string;
  rating: number;
  money: number;
}

interface DriverData {
  _id: string;
  userId: User;
  carDetails: {
    numberPlate: string;
    carName: string;
    carModel: string;
  };
  licenseNumber: string;
  licenseVerified: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface CurrentLocations {
  driver: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  passenger: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
}

interface Ride {
  _id: string;
  passengerId: string;
  driverId: string;
  startLocation: Location;
  destinationLocation: Location;
  currentLocations: CurrentLocations;
  status: 'searching' | 'driver_found' | 'picking_up' | 'in_progress' | 'completed' | 'cancelled';
  distance: number;
  fare: number;
  driverDetails: {
    name: string;
    rating: number;
  };
  passengerDetails: {
    name: string;
    rating: number;
  };
  createdAt: string;
}

export function DriverProfileScreen() {
  const { userAuth } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [expandedSection, setExpandedSection] = useState<string>('driver'); // Default expanded section
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalEarnings: 0,
    totalDistance: 0
  });

  useEffect(() => {
    if (userAuth?.id) {
      fetchDriverData();
      fetchRideHistory();
    } else {
      setError('No driver ID available');
      setLoading(false);
    }
  }, [userAuth]);

  useEffect(() => {
    if (rideHistory.length > 0) {
      calculateStats();
    }
  }, [rideHistory]);

  const calculateStats = () => {
    const completed = rideHistory.filter(ride => ride.status === 'completed').length;
    const cancelled = rideHistory.filter(ride => ride.status === 'cancelled').length;
    const totalEarnings = rideHistory
      .filter(ride => ride.status === 'completed')
      .reduce((sum, ride) => sum + ride.fare, 0);
    const totalDistance = rideHistory
      .filter(ride => ride.status === 'completed')
      .reduce((sum, ride) => sum + ride.distance, 0);

    setStats({
      totalRides: rideHistory.length,
      completedRides: completed,
      cancelledRides: cancelled,
      totalEarnings,
      totalDistance
    });
  };

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      console.log('fetching driver data', userAuth?.id);
      const response = await axios.get(`${DEFAULT_URL}/api/driver-profile/drivers/${userAuth?.id}`);
      console.log('response', response.data);
      setDriverData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch driver data');
      console.error('Error fetching driver data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRideHistory = async () => {
    try {
      const response = await axios.get(`${DEFAULT_URL}/api/driver-profile/rides/driver/${userAuth?.id}`);
      setRideHistory(response.data);
    } catch (err) {
      console.error('Error fetching ride history:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDriverData(), fetchRideHistory()]);
    setRefreshing(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const handleRidePress = (ride: Ride) => {
    setSelectedRide(ride);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRideItem = ({ item }: { item: Ride }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => handleRidePress(item)}
    >
      <View style={styles.rideHeader}>
        <View style={styles.rideStatusContainer}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.rideStatus, { color: getStatusColor(item.status) }]}>
            {formatStatus(item.status)}
          </Text>
        </View>
        <Text style={styles.rideDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.rideRoute}>
        <View style={styles.locationContainer}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>{item.startLocation.address}</Text>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.locationContainer}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <Text style={styles.locationText} numberOfLines={1}>{item.destinationLocation.address}</Text>
        </View>
      </View>

      <View style={styles.rideFooter}>
        <View style={styles.rideDetail}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.rideDetailText}>${item.fare.toFixed(2)}</Text>
        </View>

        <View style={styles.rideDetail}>
          <Ionicons name="speedometer-outline" size={16} color="#666" />
          <Text style={styles.rideDetailText}>{item.distance.toFixed(1)} km</Text>
        </View>

        <View style={styles.rideDetail}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.rideDetailText}>{item.passengerDetails.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'in_progress': return '#2196F3';
      case 'picking_up': return '#FF9800';
      case 'driver_found': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'in_progress': return 'car';
      case 'searching': return 'search';
      case 'driver_found': return 'person';
      case 'picking_up': return 'navigate';
      default: return 'help-circle';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading && !driverData) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#673DE6" />
        <Text style={styles.loadingText}>Loading driver profile...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDriverData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#673DE6', '#4A45B2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeaderContent}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${driverData?.userId.username}&background=673DE6&color=fff&size=128` }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{driverData?.userId.username}</Text>
          <View style={styles.verificationContainer}>
            <Text style={styles.verificationText}>
              {driverData?.userId.verificationStatus === 'verified-driver' ? 'Verified Driver' : 'Pending Verification'}
            </Text>
            {driverData?.userId.verificationStatus === 'verified-driver' && (
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.verificationIcon} />
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="car-multiple" size={24} color="#673DE6" />
            </View>
            <Text style={styles.statValue}>{stats.totalRides}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <FontAwesome5 name="money-bill-wave" size={18} color="#673DE6" />
            </View>
            <Text style={styles.statValue}>${driverData?.userId.money.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Balance</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={24} color="#673DE6" />
            </View>
            <Text style={styles.statValue}>{driverData?.userId.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#673DE6', '#4A45B2']}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.balanceContent}>
              <View>
                <Text style={styles.balanceLabel}>Driver Status</Text>
                <Text style={styles.balanceValue}>{driverData?.active ? 'Active' : 'Inactive'}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.statusToggleButton,
                  { backgroundColor: driverData?.active ? 'rgba(255, 255, 255, 0.2)' : '#4CAF50' }
                ]}
              >
                <Text style={styles.statusToggleText}>
                  {driverData?.active ? 'Go Offline' : 'Go Online'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Driver Information Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('driver')}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="person" size={20} color="#673DE6" />
              <Text style={styles.sectionTitle}>Driver Information</Text>
            </View>
            <Ionicons
              name={expandedSection === 'driver' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#673DE6"
            />
          </TouchableOpacity>

          {expandedSection === 'driver' && (
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{driverData?.userId.username}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{driverData?.userId.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>License</Text>
                <Text style={styles.infoValue}>{driverData?.licenseNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>License Status</Text>
                <View style={[styles.statusBadge, {
                  backgroundColor: driverData?.licenseVerified ? '#4CAF50' : '#FF9800'
                }]}>
                  <Text style={styles.statusText}>
                    {driverData?.licenseVerified ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{formatDate(driverData?.createdAt || '')}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Vehicle Information Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('vehicle')}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="car" size={20} color="#673DE6" />
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
            </View>
            <Ionicons
              name={expandedSection === 'vehicle' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#673DE6"
            />
          </TouchableOpacity>

          {expandedSection === 'vehicle' && (
            <View style={styles.sectionContent}>
              <View style={styles.carInfoCard}>
                <Ionicons name="car-sport" size={36} color="#673DE6" style={styles.carIcon} />
                <Text style={styles.carName}>{driverData?.carDetails.carName} {driverData?.carDetails.carModel}</Text>
                <Text style={styles.licensePlate}>{driverData?.carDetails.numberPlate}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Car Make</Text>
                <Text style={styles.infoValue}>{driverData?.carDetails.carName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Car Model</Text>
                <Text style={styles.infoValue}>{driverData?.carDetails.carModel}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>License Plate</Text>
                <Text style={styles.infoValue}>{driverData?.carDetails.numberPlate}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Ride History Section */}
        <View style={[styles.section, styles.lastSection]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('rides')}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="list" size={20} color="#673DE6" />
              <Text style={styles.sectionTitle}>Ride History</Text>
            </View>
            <Ionicons
              name={expandedSection === 'rides' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#673DE6"
            />
          </TouchableOpacity>

          {expandedSection === 'rides' && (
            <View style={styles.sectionContent}>
              {rideHistory.length > 0 ? (
                <FlatList
                  data={rideHistory}
                  renderItem={renderRideItem}
                  keyExtractor={item => item._id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="car-outline" size={50} color="#CCCCCC" />
                  <Text style={styles.emptyStateText}>No rides yet</Text>
                  <Text style={styles.emptyStateSubtext}>Your ride history will appear here</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Ride Details Modal */}
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Ride Details"
        showCloseButton={true}
        customStyles={styles.modalContent}
      >
        {selectedRide && (
          <View style={styles.rideDetailContainer}>
            <View style={styles.rideDetailHeader}>
              <Text style={styles.rideDetailId}>Ride #{selectedRide._id.slice(-8)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRide.status) }]}>
                <Text style={styles.statusText}>{formatStatus(selectedRide.status)}</Text>
              </View>
            </View>

            <View style={styles.rideDetailSection}>
              <Text style={styles.rideDetailSectionTitle}>Date & Time</Text>
              <Text style={styles.rideDetailText}>{formatDate(selectedRide.createdAt)}</Text>
            </View>

            <View style={styles.rideDetailSection}>
              <Text style={styles.rideDetailSectionTitle}>Route</Text>
              <View style={styles.routeDetailContainer}>
                <View style={styles.locationDetailIndicator}>
                  <View style={styles.startDot} />
                  <View style={styles.routeDetailLine} />
                  <View style={styles.endDot} />
                </View>

                <View style={styles.addressDetailContainer}>
                  <Text style={styles.addressDetailLabel}>Pickup</Text>
                  <Text style={styles.addressDetailText}>{selectedRide.startLocation.address}</Text>
                  <Text style={styles.addressDetailLabel}>Dropoff</Text>
                  <Text style={styles.addressDetailText}>{selectedRide.destinationLocation.address}</Text>
                </View>
              </View>
            </View>

            <View style={styles.rideDetailSection}>
              <Text style={styles.rideDetailSectionTitle}>Passenger Information</Text>
              <View style={styles.passengerInfo}>
                <Text style={styles.passengerName}>{selectedRide.passengerDetails.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{selectedRide.passengerDetails.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.rideDetailSection}>
              <Text style={styles.rideDetailSectionTitle}>Trip Details</Text>
              <View style={styles.tripDetailsRow}>
                <View style={styles.tripDetail}>
                  <Text style={styles.tripDetailLabel}>Distance</Text>
                  <Text style={styles.tripDetailValue}>{selectedRide.distance} km</Text>
                </View>
                <View style={styles.tripDetail}>
                  <Text style={styles.tripDetailLabel}>Fare</Text>
                  <Text style={styles.tripDetailValue}>${selectedRide.fare.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </CustomModal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
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
    width: '30%',
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
    backgroundColor: 'rgba(103, 61, 230, 0.1)',
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
  statusToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusToggleText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  lastSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50', // Green for start location
  },
  endDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336', // Red for destination
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#777',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  carInfoCard: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  carIcon: {
    marginBottom: 8,
  },
  carName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  licensePlate: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
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
    backgroundColor: '#673DE6',
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
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
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
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#673DE6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
  },
  rideDetailContainer: {
    padding: 16,
  },
  rideDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rideDetailId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  rideDetailSection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  rideDetailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },

  routeDetailContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  locationDetailIndicator: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  routeDetailLine: {
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
    marginVertical: 4,
  },
  addressDetailContainer: {
    flex: 1,
  },
  addressDetailLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  addressDetailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passengerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  tripDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripDetail: {
    alignItems: 'center',
    flex: 1,
  },
  tripDetailLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  tripDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  footerSpace: {
    height: 40,
  },
});