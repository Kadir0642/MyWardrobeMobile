import React, { useEffect, useRef } from 'react'; // 🚀 1. useEffect ve useRef eklendi
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'; // 🚀 2. createNavigationContainerRef eklendi
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications'; // 🚀 3. Kütüphane import edildi

// Kapsül ve Sayfa Importları
import { ProfileProvider } from './src/context/ProfileContext';
import TabNavigator from './src/navigation/TabNavigator';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import PlannerScreen from './src/screens/PlannerScreen';
import OutfitDetailScreen from './src/screens/OutfitDetailScreen';

const Stack = createNativeStackNavigator();

// 🚀 4. Navigation Container için bir "ref" (dizgin) oluşturuyoruz
// 🚀 <any> ekleyerek TypeScript'in aşırı korumacı sınırını kaldırdık
const navigationRef = createNavigationContainerRef<any>();

export default function App() {

  // 🚀 5. BİLDİRİM TIKLANMA DİNLEYİCİSİ (DEEP LINKING CORE)
  useEffect(() => {
    // Uygulama açıkken (arka planda veya ön planda) bildirime tıklanınca çalışır
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      
        // Bildirimin içine koyduğumuz "data" paketini alıyoruz
        const data = response.notification.request.content.data;
        console.log("🔥 BİLDİRİME TIKLANDI, GELEN VERİ:", data);

        // Eğer hedef "ItemDetail" ise yönlendir
        if (data.screen === 'ItemDetail' && data.imageUrl) {
          // 🚀 Dizginler elimizde olduğu için doğrudan yönlendirme yapabiliyoruz
          // (navigationRef.isReady() kontrolü yapılması daha güvenli olur)
          if (navigationRef.isReady()) {
              navigationRef.navigate('ItemDetail', { 
                  imageUrl: data.imageUrl, // 🚀 Fotoğrafın linkini gönder
                  isAiGenerated: true // 🚀 AI ile üretildiğini belirt
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
        {/* 🚀 6. NavigationContainer'a az önce oluşturduğumuz "ref"i bağlıyoruz */}
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
          </Stack.Navigator>
          
          <StatusBar style="dark" />
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}