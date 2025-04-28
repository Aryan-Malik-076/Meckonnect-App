import { colors } from '@/constants';
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StepBarProps {
  currentStep: number;
}

export const StepBar: React.FC<StepBarProps> = ({ currentStep }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.bar, currentStep >= 1 && styles.activeBar]} />
      <View style={[styles.bar, currentStep >= 2 && styles.activeBar]} />
      <View style={[styles.bar, currentStep >= 3 && styles.activeBar]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
    padding:20
  },
  bar: {
    width: '30%', // Adjust width of the bar
    height: 8,  // Height of each bar
    borderRadius: 20,

    backgroundColor: colors.disabled, // Default color for inactive steps
  },
  activeBar: {
    backgroundColor: colors.status, // Color for active steps (green as shown in the image)
  },
});

