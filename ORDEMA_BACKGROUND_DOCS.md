# 🎨 OrdemaBackground Component

## 📋 Descripción
Componente reutilizable que aplica fondos dinámicos de Ordema a cualquier pantalla, con soporte para modo claro/oscuro y configuración multitenant.

## 🚀 Uso Básico

```tsx
import OrdemaBackground from '../components/OrdemaBackground';

const MiPantalla = () => {
  return (
    <OrdemaBackground>
      <View style={styles.content}>
        <Text style={styles.title}>Mi contenido</Text>
      </View>
    </OrdemaBackground>
  );
};
```

## 🎛️ Props

| Prop | Tipo | Opcional | Descripción |
|------|------|----------|-------------|
| `children` | `React.ReactNode` | No | Contenido a renderizar sobre el fondo |
| `style` | `ViewStyle` | Sí | Estilos adicionales para el contenedor |
| `customUri` | `string` | Sí | URL personalizada para fondo multitenant |
| `forceTheme` | `'light' \| 'dark'` | Sí | Forzar un tema específico |

## 🎨 Ejemplos de Uso

### Uso Básico (Auto-detecta tema)
```tsx
<OrdemaBackground>
  <Text>Contenido que se adapta automáticamente</Text>
</OrdemaBackground>
```

### Forzar Tema Específico
```tsx
<OrdemaBackground forceTheme="dark">
  <Text>Siempre usa fondo oscuro</Text>
</OrdemaBackground>
```

### Fondo Personalizado (Multitenant)
```tsx
<OrdemaBackground customUri="https://mi-negocio.com/fondo.png">
  <Text>Usa fondo personalizado del negocio</Text>
</OrdemaBackground>
```

### Con Estilos Personalizados
```tsx
<OrdemaBackground style={{ opacity: 0.9 }}>
  <Text>Fondo con transparencia</Text>
</OrdemaBackground>
```

## 📱 Implementado en:

- ✅ **LoginScreen.tsx** - Pantalla de bienvenida
- 🔄 **Próximamente** - Otras pantallas principales

## 🎯 Especificaciones Técnicas

### Assets Utilizados
- **Modo Oscuro**: `/assets/bgdark-ordema.png`
- **Modo Claro**: `/assets/bglight-ordema.png`

### Detección de Tema
1. **Tema forzado** (`forceTheme`) - Prioridad alta
2. **Tema del sistema** (`useColorScheme()`) - Automático
3. **Fallback** - Modo oscuro por defecto

### Performance
- ✅ Imágenes optimizadas (<300KB cada una)
- ✅ Caché automático de React Native
- ✅ `resizeMode="cover"` para mejor rendimiento

## 🔮 Roadmap Futuro

### Multitenant Support
```tsx
// Ejemplo futuro con backend integration
const backgroundUri = await getBusinessBackground(businessId, theme);

<OrdemaBackground customUri={backgroundUri}>
  {/* Contenido específico del negocio */}
</OrdemaBackground>
```

### Integración con ThemeContext
```tsx
// Posible integración futura
import { useTheme } from '../context/ThemeContext';

const OrdemaBackground = ({ children }) => {
  const { businessBackgrounds } = useTheme();
  // Usar fondos del contexto si están disponibles
};
```

## 🛡️ Consideraciones de Accesibilidad

### Contraste de Texto
Asegúrate de usar colores con buen contraste:

```tsx
const styles = StyleSheet.create({
  text: {
    color: '#FFFFFF', // Blanco para fondos oscuros
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
```

### StatusBar
Configura la StatusBar apropiadamente:

```tsx
<StatusBar 
  barStyle="light-content" 
  backgroundColor="transparent" 
  translucent 
/>
```

## 🧪 Testing

### Probar Diferentes Temas
1. Cambiar configuración del sistema (claro/oscuro)
2. Verificar cambio automático de fondo
3. Probar `forceTheme` en ambos modos

### Verificar en Diferentes Dispositivos
- iPhone (diferentes tamaños)
- Android (diferentes resoluciones)
- Tablets (orientación landscape/portrait)
