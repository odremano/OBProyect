import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import DynamicLogo from '../components/DynamicLogo';
/*import BottomNavBar from '../components/BottomNavBar';*/

export default function HomeScreen() {
  const { user, logout } = useContext(AuthContext);
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <DynamicLogo
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => {
            alert('Próximamente: Notificaciones');
          }}
          activeOpacity={0.7}
        >
          <Icon name="notifications-outline" size={26} color={colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          ¡Bienvenido, {user?.first_name ? `${user.first_name}!` : 'Usuario!'}
        </Text>
        {user?.role === 'profesional' ? (
          <View style={styles.buttonsContainer}>
            <View style={styles.topRow}>
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: colors.dark2 }]}
                onPress={() => navigation.navigate('MiDisponibilidad')}
                activeOpacity={0.8}
              >
                <View style={[styles.smallIconCircle, { backgroundColor: colors.primary }]}>
                  <Icon name="time-outline" size={30} color={colors.white} />
                </View>
                <Text style={[styles.buttonText, { color: colors.text }]}>Mi disponibilidad</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: colors.dark2 }]}
                onPress={() => navigation.navigate('Ganancias')}
                activeOpacity={0.8}
              >
                <View style={[styles.smallIconCircle, { backgroundColor: colors.primary }]}>
                  <Icon name="cash-outline" size={28} color={colors.white} />
                </View>
                <Text style={[styles.buttonText, { color: colors.text }]}>Ganancias</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.largeButton, { backgroundColor: colors.dark2 }]}
              onPress={() => navigation.navigate('VerAgenda')}
              activeOpacity={0.8}
            >
              <View style={[styles.largeIconCircle, { backgroundColor: colors.primary }]}>
                <Icon name="calendar-outline" size={32} color={colors.white} />
              </View>
              <Text style={[styles.largeButtonText, { color: colors.text }]}>Ver agenda</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonsContainer}>
            <View style={styles.topRow}>
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: colors.dark2 }]}
                onPress={() => navigation.navigate('Servicios', { modal: true })}
                activeOpacity={0.8}
              >
                <View style={[styles.smallIconCircle, { backgroundColor: colors.primary }]}>
                  <Icon name="cut" size={30} color={colors.white} />
                </View>
                <Text style={[styles.buttonText, { color: colors.text }]}>Ver servicios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: colors.dark2 }]}
                onPress={() => navigation.navigate('MisTurnos')}
                activeOpacity={0.8}
              >
                <View style={[styles.smallIconCircle, { backgroundColor: colors.primary }]}>
                  <Icon name="calendar" size={28} color={colors.white} />
                </View>
                <Text style={[styles.buttonText, { color: colors.text }]}>Mis turnos</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.largeButton, { backgroundColor: colors.dark2 }]}
              onPress={() => navigation.navigate('ReservaTurno', {})}
              activeOpacity={0.8}
            >
              <View style={[styles.largeIconCircle, { backgroundColor: colors.primary }]}>
                <Icon name="play" size={32} color={colors.white} />
              </View>
              <Text style={[styles.largeButtonText, { color: colors.text }]}>Reservá turno</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50, // Espacio para status bar
    paddingBottom: 15,
    width: '100%',
    height: 100, // Altura fija para el header
    zIndex: 1,
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
    paddingTop: 100, // Espacio exacto para el header fijo
    paddingHorizontal: 24,
    justifyContent: 'space-between', // Distribuye el espacio entre greeting y buttons
  },
  greeting: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 60,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Espacio desde el bottom para balancear
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  smallButton: {
    borderRadius: 12,
    height: 183,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,

  },
  smallIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  largeButton: {
    borderRadius: 12,
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  largeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  largeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
