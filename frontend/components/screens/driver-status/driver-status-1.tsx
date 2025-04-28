// File: screens/DocumentUploadScreen.tsx
import React, { useState, useCallback } from 'react';
import { 
  View,
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Platform,
  Image,
  StyleSheet
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios, { AxiosError } from 'axios';
import { useAuth } from '@/contexts';
import { DEFAULT_URL } from '@/lib/constants';
import { useRouter } from 'expo-router';

// Types for document data
interface DocumentAsset {
  uri: string;
  type?: string;
  name?: string;
}

interface Documents {
  vehicleReg: ImagePicker.ImagePickerAsset | null;
  drivingLicenseFront: ImagePicker.ImagePickerAsset | null;
  drivingLicenseBack: ImagePicker.ImagePickerAsset | null;
  idCardFront: ImagePicker.ImagePickerAsset | null;
  idCardBack: ImagePicker.ImagePickerAsset | null;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface UserAuthData {
  role: string;
  [key: string]: any;
}

interface DriverDocumentsUploadProps {
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

export const DriverDocumentsUpload: React.FC<DriverDocumentsUploadProps> = ({ setStep }) => {
  const { userAuth, updateUserAuth } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const [documents, setDocuments] = useState<Documents>({
    vehicleReg: null,
    drivingLicenseFront: null,
    drivingLicenseBack: null,
    idCardFront: null,
    idCardBack: null
  });

  // Function to request permissions
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required', 
            'Please allow access to your photo library to upload documents.',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      } catch (err) {
        console.error('Permission request error:', err);
        Alert.alert(
          'Permission Error', 
          'Failed to request permissions. Please try again.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  // Function to pick image from gallery
  const pickImage = useCallback(async (documentType: keyof Documents): Promise<void> => {
    try {
      setError(null);
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Check file size (limit to 10MB)
        const fileSize = result.assets[0].fileSize || 0;
        if (fileSize > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select an image smaller than 10MB.');
          return;
        }
        
        setDocuments({
          ...documents,
          [documentType]: result.assets[0]
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to pick image. Please try again.');
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [documents]);

  // Function to prepare form data
  const prepareFormData = useCallback((): FormData => {
    const formData = new FormData();

    // Add each document to form data if it exists
    Object.keys(documents).forEach(key => {
      const docKey = key as keyof Documents;
      const doc = documents[docKey];
      
      if (doc) {
        const fileUri = doc.uri;
        const fileType = doc.mimeType || 'image/jpeg';
        const fileName = fileUri.split('/').pop() || `${key}.jpg`;

        // @ts-ignore - FormData append has compatibility issues with typed definitions
        formData.append(key, {
          uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
          type: fileType,
          name: fileName
        });
      }
    });

    return formData;
  }, [documents]);

  // Function to upload documents
  const uploadDocuments = async (): Promise<void> => {
    // Reset any previous errors
    setError(null);
    
    // Check if all documents are selected
    const missingDocs = Object.keys(documents).filter(key => !documents[key as keyof Documents]);
    if (missingDocs.length > 0) {
      const missingDocNames = missingDocs.map(doc => {
        // Convert camelCase to readable format
        return doc.replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
      }).join(', ');
      
      Alert.alert('Missing Documents', `Please select all required documents before uploading. Missing: ${missingDocNames}`);
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      const formData = prepareFormData();
      formData.append('user_id', userAuth?.id || '');
      // Create axios instance with upload progress
      const response = await axios.post<ApiResponse>(
        `${DEFAULT_URL}/api/driver/documents/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          }
        }
      );

      if (response.data.success) {
        // Update local auth context
        if (userAuth) {
          updateUserAuth({
            ...userAuth,
            role: 'driver-status-2'
          } as UserAuthData);
        }
        
        // Automatically move to next step
        setStep(2);
        
        Alert.alert(
          'Success',
          'Documents uploaded successfully. Your driver status has been updated.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(response.data.message || 'Unknown error occurred');
      }
    } catch (error) {
      let errorMessage = 'Failed to upload documents. Please try again.';
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse>;
        errorMessage = axiosError.response?.data?.message || errorMessage;
        
        // Handle specific error codes
        if (axiosError.response?.status === 413) {
          errorMessage = 'Files are too large. Please use smaller images.';
        } else if (axiosError.response?.status === 401) {
          errorMessage = 'Your session has expired. Please login again.';
          // Redirect to login after alert
          Alert.alert('Authentication Error', errorMessage, [
            { text: 'OK', onPress: () => router.push('/login') }
          ]);
          return;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('Upload error:', error);
      setError(errorMessage);
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Function to render document selection component
  const renderDocumentPicker = (title: string, documentType: keyof Documents) => {
    const document = documents[documentType];
    
    return (
      <View style={styles.documentContainer}>
        <Text style={styles.documentTitle}>{title}</Text>
        {document ? (
          <View>
            <Image 
              source={{ uri: document.uri }} 
              style={styles.documentImage} 
            />
            <TouchableOpacity 
              onPress={() => pickImage(documentType)}
              style={styles.changeButton}
            >
              <Text>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => pickImage(documentType)}
            style={styles.selectButton}
          >
            <Text>Select Document</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        Upload Driver Documents
      </Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {renderDocumentPicker('Vehicle Registration', 'vehicleReg')}
      {renderDocumentPicker('Driving License (Front)', 'drivingLicenseFront')}
      {renderDocumentPicker('Driving License (Back)', 'drivingLicenseBack')}
      {renderDocumentPicker('ID Card (Front)', 'idCardFront')}
      {renderDocumentPicker('ID Card (Back)', 'idCardBack')}

      {loading && uploadProgress > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={uploadDocuments}
        disabled={loading}
        style={[
          styles.uploadButton,
          loading && styles.disabledButton
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.uploadButtonText}>
            Upload Documents
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  documentContainer: {
    marginVertical: 10,
  },
  documentTitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  documentImage: {
    width: '100%',
    height: 150,
    marginVertical: 5,
    borderRadius: 8,
  },
  changeButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  selectButton: {
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  uploadButton: {
    padding: 15,
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: '#d32f2f',
  },
  progressContainer: {
    marginTop: 15,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
});