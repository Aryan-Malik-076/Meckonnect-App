import { colors, fonts } from '@/constants';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export const CloseButton = ({ onClick }: { onClick: any }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onClick}
    >
      <Text style={styles.text}>X</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 20,
    fontFamily: fonts.primary,
    backgroundColor: colors.border,
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
});

