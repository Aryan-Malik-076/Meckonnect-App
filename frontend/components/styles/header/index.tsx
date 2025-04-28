import { colors, fonts } from '@/constants';
import { StyleSheet } from 'react-native';

export const primaryStyles = StyleSheet.create({
  header: {
    fontFamily: fonts.secondary,
    textAlign: 'center',
    letterSpacing: 2,
    color: colors.dark,
    fontWeight: 'bold',
    fontSize: 40,
  },
  headerLarge: {
    fontSize: 32,
    marginBottom: 20,
  },
  headerMedium: {
    fontSize: 24,
    marginBottom: 15,
  },
  headerSmall: {
    fontSize: 18,
    marginBottom: 10,
  },
});
