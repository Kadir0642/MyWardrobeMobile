import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Kapsül ve Sayfa Importları
import { ProfileProvider } from './src/context/ProfileContext';
import TabNavigator from './src/navigation/TabNavigator';
import ItemDetailScreen from './src/screens/ItemDetailScreen';

// Asansör boşluğumuzu (Stack) oluşturuyoruz
const Stack = createNativeStackNavigator();

// npx expo start -c   ile başlatıyoruz

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <NavigationContainer>
          
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 1. KAT: Uygulama açıldığında ilk burası görünür (Alt Menü ve İçindeki Sayfalar) */}
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            
            {/* 2. KAT: Dolapta bir kıyafete tıklayınca üstüne açılacak olan Detay Sayfası! */}
            <Stack.Screen 
              name="ItemDetail" 
              component={ItemDetailScreen} 
              // iOS cihazlarda sayfanın şık bir kart gibi alttan yukarı kayarak açılmasını sağlar
              options={{ presentation: 'card' }} 
            />
          </Stack.Navigator>
          
          <StatusBar style="dark" />
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}