import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { NegocioDetallado } from '../api/auth';

const { width } = Dimensions.get('window');

interface NegocioCardProps {
  negocio: NegocioDetallado;
  onPress: () => void;
  onToggleFavorite: () => void;
  onRemove: () => void;
  loading?: boolean;
  menuVisible?: boolean;
  onMenuToggle?: () => void;
}

const NegocioCard: React.FC<NegocioCardProps> = ({
  negocio,
  onPress,
  onToggleFavorite,
  onRemove,
  loading = false,
  menuVisible = false,
  onMenuToggle,
}) => {
  const { colors } = useTheme();

  const getRolBadgeColor = (rol: string) => {
    switch (rol.toLowerCase()) {
      case 'profesional':
        return '#5EEA5E';
      case 'cliente':
        return '#287FBD';
      default:
        return colors.dark2;
    }
  };

  const handleMenuPress = () => {
    if (onMenuToggle) {
      onMenuToggle();
    }
  };

  const handleCardPress = () => {
    if (!loading && !menuVisible) {
      onPress();
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.dark2 },
          loading && styles.cardDisabled,
        ]}
        onPress={handleCardPress}
        disabled={loading}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {negocio.logo_url ? (
              <Image
                source={{ uri: negocio.logo_url }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.dark3 }]}>
                <Ionicons name="business" size={32} color={colors.textSecondary} />
              </View>
            )}
          </View>

          <View style={styles.menuContainer}>
            {negocio.is_favorite && (
              <Ionicons name="heart" size={20} color="#EF4444" style={styles.favoriteIcon} />
            )}
            <TouchableOpacity
              onPress={handleMenuPress}
              style={styles.menuButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>
            {negocio.nombre}
          </Text>
          <View style={[styles.badge, { backgroundColor: getRolBadgeColor(negocio.rol) }]}>
            <Text style={styles.badgeText}>{negocio.rol.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>

      {menuVisible && (
        <View style={[styles.menu, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (onMenuToggle) onMenuToggle();
              onToggleFavorite();
            }}
          >
            <Ionicons
              name={negocio.is_favorite ? 'heart-dislike' : 'heart'}
              size={20}
              color={colors.text}
            />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              {negocio.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            </Text>
          </TouchableOpacity>
          <View style={[styles.menuDivider, { backgroundColor: colors.dark3 }]} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (onMenuToggle) onMenuToggle();
              onRemove();
            }}
          >
            <Ionicons name="exit-outline" size={20} color="#EF4444" />
            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>
              Dar de baja negocio
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logoContainer: {
    width: 64,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteIcon: {
    marginTop: 2,
  },
  menuButton: {
    padding: 4,
  },
  content: {
    marginBottom: 12,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'flex-end',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 8,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 200,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
});

export default NegocioCard;
