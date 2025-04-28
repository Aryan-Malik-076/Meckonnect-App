import { PrimaryButtonProps } from '@/@types';
import { colors, fonts } from '@/constants';
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

// Define interface for props

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  style // Default to 'primary'
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // Handle press in and out events
  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        style,
        type === 'primary'
          ? {
            backgroundColor: isPressed ? colors.primaryLight : colors.primary,
            borderColor: isPressed ? colors.primarySolid : colors.primary, borderStyle: 'solid', borderWidth: 1,

          } // For primary button
          : { backgroundColor: isPressed ? colors.primaryLight : 'transparent', borderWidth: 1, borderColor: colors.primarySolid }, // For secondary button
      ]}
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          type === 'primary'
            ? { color: isPressed ? colors.primarySolid : colors.default } // Text color for primary
            : { color: colors.primarySolid }, // Text color for secondary
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity >
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '92%',
  },
  text: {
    fontSize: 16,
    fontFamily:fonts.primary
  },
});