import React from 'react';
import { View, StyleSheet } from 'react-native';
import NotificationBanner from './NotificationBanner';
import { useNotification } from '../context/NotificationContext';

const BannerStack: React.FC = () => {
  const { banners, hideBanner } = useNotification();

  return (
    <View style={styles.container}>
      {banners.map((banner, index) => (
        <NotificationBanner
          key={banner.id}
          visible={true}
          type={banner.type}
          title={banner.title}
          message={banner.message}
          onClose={() => hideBanner(banner.id)}
          position="top"
          style={{ top: 80 + (index * 80) }} // Apilar banners con 80px de separación
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

export default BannerStack; 