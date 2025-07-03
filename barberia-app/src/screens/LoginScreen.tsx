import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { login, LoginResult } from '../api/auth';
import { AuthContext } from '../context/AuthContext'; // Ajusta la ruta si es necesario

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: loginContext } = useContext(AuthContext);

  const handleLogin = async () => {
    setLoading(true);
    const result: LoginResult = await login(username, password);
    setLoading(false);

    console.log('RESULTADO DEL LOGIN:', result);

    if (result.success) {
      await loginContext(result.user, result.tokens);
      // Aquí puedes guardar el token y navegar
    } else {
      // Muestra el mensaje principal
      Alert.alert('Error', result.message);
      // (Opcional) Muestra detalles adicionales
      if (result.errors && result.errors.non_field_errors) {
        console.log('Detalles:', result.errors.non_field_errors.join(', '));
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size="large" color="#007cba" />
      ) : (
        <Button title="Ingresar" onPress={handleLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 15, padding: 10 }
});