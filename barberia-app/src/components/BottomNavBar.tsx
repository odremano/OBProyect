import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

interface BottomNavBarProps {
  activeTab?: string;
  onTabPress?: (tabName: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab = 'Inicio', onTabPress }) => {
  const handleTabPress = (tabName: string) => {
    if (onTabPress) {
      onTabPress(tabName);
    }
  };

  const getIconColor = (tabName: string) => {
    return activeTab === tabName ? colors.white : colors.light3;
  };

  const getTextColor = (tabName: string) => {
    return activeTab === tabName ? colors.white : colors.light3;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.item}
        onPress={() => handleTabPress('Inicio')}
      >
        <Icon 
          name="home" 
          size={24} 
          color={getIconColor('Inicio')} 
        />
        <Text style={[styles.label, { color: getTextColor('Inicio') }]}>
          Inicio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.item}
        onPress={() => handleTabPress('Ubícanos')}
      >
        <Icon 
          name="location" 
          size={24} 
          color={getIconColor('Ubícanos')} 
        />
        <Text style={[styles.label, { color: getTextColor('Ubícanos') }]}>
          Ubícanos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.item}
        onPress={() => handleTabPress('Más')}
      >
        <Icon 
          name="menu" 
          size={24} 
          color={getIconColor('Más')} 
        />
        <Text style={[styles.label, { color: getTextColor('Más') }]}>
          Más
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    height: 85,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    marginBottom: 10,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default BottomNavBar;
