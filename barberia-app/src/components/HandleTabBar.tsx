import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const HandleTabBar = () => (
  <View style={styles.handle} />
);

const styles = StyleSheet.create({
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.white,
    marginBottom: 7,
    marginTop:-4
  },
});

export default HandleTabBar;
