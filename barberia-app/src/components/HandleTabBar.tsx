import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const HandleTabBar = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.handle, { backgroundColor: colors.white }]} />
  );
};

const styles = StyleSheet.create({
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 2,
    borderRadius: 1,
    marginBottom: 7,
    marginTop:-4
  },
});

export default HandleTabBar;
