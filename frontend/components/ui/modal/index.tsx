import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CustomModalProps {
  visible: boolean;                // Modal visibility state
  onClose: () => void;             // Function to close the modal
  title?: string;                  // Optional title for the modal
  children: React.ReactNode;       // Children to render inside the modal
  showCloseButton?: boolean;       // Whether to show the close button
  customStyles?: object;           // Optional custom styles for modal content
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  customStyles = {},
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}  // For Android back button
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, customStyles]}>
          {title && <Text style={styles.title}>{title}</Text>}

          <View style={styles.contentContainer}>
            {children} {/* This will allow custom content inside the modal */}
          </View>

          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 10,
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contentContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#673DE6',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

