import React, { useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// Kapsül ve Sayfa Importları
import { ProfileProvider } from './src/context/ProfileContext';
import TabNavigator from './src/navigation/TabNavigator';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import PlannerScreen from './src/screens/PlannerScreen';
import OutfitDetailScreen from './src/screens/OutfitDetailScreen';

// Mevcut Kapsül Ekranı
import CapsuleResultScreen from './src/screens/wardrobe/CapsuleResultScreen';

// Etkinlik Sonuç Ekranı projeye dahil edildi
import EventResultScreen from './src/screens/wardrobe/EventResultScreen';
import EventPlannerScreen from './src/screens/wardrobe/EventPlannerScreen'; // 👈 1. ADIM: Yeni oluşturduğun ekranı import et

const Stack = createNativeStackNavigator();

// Navigation Container için bir "ref" (dizgin) oluşturuyoruz
const navigationRef = createNavigationContainerRef<any>();

export default function App() {

  // BİLDİRİM TIKLANMA DİNLEYİCİSİ (DEEP LINKING CORE)
  useEffect(() => {
    // Uygulama açıkken (arka planda veya ön planda) bildirime tıklanınca çalışır
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      
        // Bildirimin içine koyduğumuz "data" paketini alıyoruz
        const data = response.notification.request.content.data;
        console.log("🔥 BİLDİRİME TIKLANDI, GELEN VERİ:", data);

        // Eğer hedef "ItemDetail" ise yönlendir
        if (data.screen === 'ItemDetail' && data.imageUrl) {
          // Dizginler elimizde olduğu için doğrudan yönlendirme yapabiliyoruz
          if (navigationRef.isReady()) {
              navigationRef.navigate('ItemDetail', { 
                  imageUrl: data.imageUrl, 
                  isAiGenerated: true 
              });
          } else {
             // Eğer navigasyon henüz hazır değilse, küçük bir gecikmeyle dene
              setTimeout(() => {
                  if (navigationRef.isReady()) {
                      navigationRef.navigate('ItemDetail', { imageUrl: data.imageUrl, isAiGenerated: true });
                  }
              }, 500);
          }
        }
    });

    // Sayfa kapandığında dinleyiciyi temizle (bellek sızıntısını önlemek için)
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        {/* NavigationContainer'a "ref"i bağlıyoruz */}
        <NavigationContainer ref={navigationRef}>
          
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
                headerBackTitle: '',
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

            {/* 5. KAT: Kapsül Sonuç Ekranımız */}
            <Stack.Screen 
              name="CapsuleResultScreen" 
              component={CapsuleResultScreen} 
              options={{ presentation: 'card', headerShown: false }} 
            />

            {/* 🚀 6. KAT: Yeni Etkinlik Sonuç Ekranımız */}
            <Stack.Screen 
              name="EventResultScreen" 
              component={EventResultScreen} 
              // Kullanıcıya lüks bir his vermek için ekranı alttan yukarı kaydırarak açıyoruz
              options={{ presentation: 'modal', headerShown: false }} 
            />
            
            {/* 🚀 2. ADIM: Yeni ekranını buraya Stack ağacına ekle */}
            {/* presentation: 'fullScreenModal' diyerek sayfanın alt tepsiler gibi değil, tam ekran olarak lüks bir şekilde açılmasını sağlıyoruz */}
            <Stack.Screen 
              name="EventPlannerScreen" 
              component={EventPlannerScreen} 
              options={{ presentation: 'fullScreenModal', headerShown: false }} 
            />

          </Stack.Navigator>
          
          <StatusBar style="dark" />
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}