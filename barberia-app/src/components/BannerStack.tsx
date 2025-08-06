import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import NotificationBanner from './NotificationBanner';
import { useNotification } from '../context/NotificationContext';

// Componente individual memoizado para evitar re-renders innecesarios
const MemoizedBanner = memo<{
  banner: any;
  index: number;
  onClose: (id: string) => void;
}>(({ banner, index, onClose }) => (
  <NotificationBanner
    key={banner.id}
    visible={true}
    type={banner.type}
    title={banner.title}
    message={banner.message}
    onClose={() => onClose(banner.id)}
    position="top"
    style={{ 
      top: 70 + (index * 85), // Espaciado más generoso: 100px entre banners
      zIndex: 1000 - index, // El más reciente arriba
    }}
  />
));

const BannerStack: React.FC = () => {
  const { banners, hideBanner } = useNotification();

  return (
    <View style={styles.container}>
      {banners.map((banner, index) => (
        <MemoizedBanner
          key={banner.id}
          banner={banner}
          index={index}
          onClose={hideBanner}
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

export default memo(BannerStack); 