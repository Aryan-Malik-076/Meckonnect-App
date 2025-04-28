import React, { useState } from 'react';
import { Text, View, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts';
import { useRouter } from 'expo-router';
import { DEFAULT_URL } from '@/lib/constants';
import { PrimaryButton } from '@/components/ui';
import { colors, fonts } from '@/constants';
import { getToken } from '@/lib/helpers';
import { AuthGuard } from '@/hooks';

const SelectRole = () => {

  const [modalVisible, setModalVisible] = useState(false);
  const [role, setRole] = useState('');
  const { userAuth, updateUserAuth } = useAuth();
  const router = useRouter();

  const handleRoleSelection = (selectedRole: string) => {
    setRole(selectedRole);
  };

  const confirmSelection = async () => {
    try {
      const token = await getToken();
      await axios.post(
        `${DEFAULT_URL}/api/auth/role`,
        { role, email: userAuth?.email }
      );

      Toast.show({
        type: 'success',
        text1: 'Role Updated',
        text2: `You are ${role} now.`,
      });

      const user: any = userAuth;
      if (role === 'verified-passenger') {
        user.role = 'verified-passenger';
        updateUserAuth(user);
        router.push('/');
      } else if (role === 'driver-status-1') {
        user.role = 'driver-status-1';
        updateUserAuth(user);
        router.push('/driver-verification');
      }

      setModalVisible(false);
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.message || 'An error occurred. Please try again.',
      });
    }
  };

  return (

    <View style={styles.container}>
      <AuthGuard allowedRoles={['user']} allowNullRole={false} />

      <Text style={{ fontFamily: fonts.secondary, fontSize: 22, textAlign: 'center', fontWeight: 'semibold' }}>
        Select your role to continue
      </Text>
      <View style={styles.optionContainer}>

        <TouchableOpacity
          style={[
            styles.optionBox,
            role === 'verified-passenger' ? styles.selectedBox : null,
          ]}
          onPress={() => handleRoleSelection('verified-passenger')}
        >
          <Image source={require('@/assets/images/customer-icon.png')} style={styles.icon} />
          <Text style={styles.optionText}>I want to book a ride</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionBox,
            role === 'driver-status-1' ? styles.selectedBox : null,
          ]}
          onPress={() => handleRoleSelection('driver-status-1')}
        >
          <Image source={require('@/assets/images/driver-icon.png')} style={styles.icon} />
          <Text style={styles.optionText}>I want to drive and offer rides</Text>
        </TouchableOpacity>
      </View>
      <PrimaryButton style={{ marginTop: 'auto' }} title='Continue' type='primary' onPress={() => setModalVisible(true)} />

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              Are you sure you want to select the role of {role === 'verified-passenger' ? 'Passenger' : 'Driver'}?
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={confirmSelection}>
                <Text style={styles.confirmButton}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 80
  },
  optionContainer: {
    flexDirection: 'column',
    gap: 25,
    margin: 'auto',
    justifyContent: 'space-between',
  },
  optionBox: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.default,
    marginHorizontal: 10,
    borderColor: 'transparent',
    borderWidth: 2,
    shadowColor: colors.dark,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
    padding: 10,
  },
  selectedBox: {
    borderColor: '#00BFA6',
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 10,
    resizeMode: 'stretch'
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: fonts.primary

  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    color: '#00BFA6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    color: '#FF4D4D',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SelectRole;
