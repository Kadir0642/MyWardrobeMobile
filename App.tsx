import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Uygulamanın NAVİGATOR kısmı 
// Sayfalar arası bağlantılar burada yapılıyor

// Kapsül ve Sayfa Importları
import { ProfileProvider } from './src/context/ProfileContext';
import TabNavigator from './src/navigation/TabNavigator';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import PlannerScreen from './src/screens/PlannerScreen';
import OutfitDetailScreen from './src/screens/OutfitDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <NavigationContainer>
          
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 1. KAT: Ana Menü (Style, Wardrobe, Shop, Network, Profile) */}
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            
            {/* 2. KAT: Eşya Detay Sayfası */}
            <Stack.Screen 
              name="ItemDetail" 
              component={ItemDetailScreen} 
              options={{ presentation: 'card' }} 
            />

            {/* 3. KAT: Tarih hapına tıklayınca açılacak olan Planlayıcı! */}
            <Stack.Screen 
              name="Planner" 
              component={PlannerScreen} 
              options={{ 
                headerShown: true, 
                title: 'Daily Planner',
                headerBackTitle: '', // 🚀 HATA BURADAN ÇIKIYORDU! Native Stack için boş string kullanıyoruz.
                headerTintColor: '#1A1A1A',
                headerStyle: { backgroundColor: '#FAF9F4' },
              }} 
            />
            
            {/* 4. KAT: Kombinlerin detay sayfası */}
            <Stack.Screen 
              name="OutfitDetail" 
              component={OutfitDetailScreen} 
              options={{ presentation: 'card', headerShown: false }} 
            />
          </Stack.Navigator>
          
          <StatusBar style="dark" />
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}