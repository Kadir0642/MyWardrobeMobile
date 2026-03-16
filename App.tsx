import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Image, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Expo'nun içindeki devasa ikon kütüphanesi

// TypeScript Modeli
interface ClothingItem {
  id: number;
  name: string;
  category: string;
  season: string;
  color: string;
  imageUrl: string;
}

// ------------------------------------------------------------------
// 1. EKRAN: DOLABIM (Indyx Tarzı Premium Vitrin)
// ------------------------------------------------------------------
function WardrobeScreen() {
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWardrobeData();
  }, []);

  const fetchWardrobeData = async () => {
    setIsLoading(true);
    try {

       //" npx expo start -c   "ile çalışıyor 
      // DİKKAT:CloudflareWARP değil altındaki yerdeki IPv4 Address kısmında
      //  172 veya 198 neyse o adres ile başlayan kendi IP adresini buraya yaz!
      // Sondaki /1 kısmı, ID'si 1 olan kullanıcının kıyafetlerini getirir. 
      const response = await fetch('http://10.87.14.78:8080/api/v1/clothes/3');
      if (response.ok) {
        const data = await response.json();
        setWardrobeItems(data);
      }
    } catch (error) {
      console.error("Bağlantı Hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImageAndUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      await uploadToBackend(result.assets[0].uri);
    }
  };

  const uploadToBackend = async (uri: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: uri, name: 'yeni_kiyafet.jpg', type: 'image/jpeg' } as any);

      const clothingData = {
        name: "Yeni Eklenen Parça",
        category: "Üst Giyim",
        season: "Bahar",
        color: "Siyah"
      };
      formData.append('data', JSON.stringify(clothingData));

      // KENDİ IP ADRESİNİ YAZ:
      const response = await fetch('http://10.87.14.78:8080/api/v1/clothes/3', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        Alert.alert("Harika!", "Kıyafet dolaba eklendi!");
        fetchWardrobeData();
      } else {
        Alert.alert("Hata", "Yükleme başarısız oldu.");
      }
    } catch (error) {
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderClothingCard = ({ item }: { item: ClothingItem }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.cardImage} resizeMode="contain" />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCategory}>{item.category} • {item.season}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dolabım</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickImageAndUpload}>
          <Text style={styles.addButtonText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>
      {isLoading && <ActivityIndicator size="large" color="#2C3E50" style={{ marginVertical: 20 }} />}
      <FlatList
        data={wardrobeItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClothingCard}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Dolabın şu an boş. Hemen bir fotoğraf ekle!</Text> : null}
      />
    </View>
  );
}

// ------------------------------------------------------------------
// 2. EKRAN: STİLİST (Whering Tarzı Kombin Tuvali)
// ------------------------------------------------------------------
function StylistScreen() {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="shirt-outline" size={80} color="#3498DB" />
      <Text style={styles.comingSoonTitle}>Kombin Tuvali</Text>
      <Text style={styles.comingSoonText}>Whering tarzı kaydırmalı kombin ekranı buraya gelecek. AI ile akıllı eşleştirmeler çok yakında!</Text>
    </View>
  );
}

// ------------------------------------------------------------------
// 3. EKRAN: ANALİZ (Cladwell Tarzı Kapsül ve Maliyet)
// ------------------------------------------------------------------
function AnalyticsScreen() {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="pie-chart-outline" size={80} color="#E67E22" />
      <Text style={styles.comingSoonTitle}>Dolap Analizi</Text>
      <Text style={styles.comingSoonText}>Giyilme maliyeti (CPW), kapsül gardırop önerileri ve istatistikler burada yer alacak.</Text>
    </View>
  );
}

// ------------------------------------------------------------------
// 4. EKRAN: SOSYAL (Instagram/Pinterest Tarzı Topluluk Akışı)
// ------------------------------------------------------------------
function SocialScreen() {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="people-circle-outline" size={80} color="#9B59B6" />
      <Text style={styles.comingSoonTitle}>Keşfet & İlham Al</Text>
      <Text style={styles.comingSoonText}>İnsanların kombinlerini aşağı kaydırarak görebileceğin, beğeni ve yorum atabileceğin sosyal akış ekranı çok yakında burada!</Text>
    </View>
  );
}

// ------------------------------------------------------------------
// ANA UYGULAMA MİMARİSİ (Alt Menü - Bottom Tabs)
// ------------------------------------------------------------------
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          // İkonları otomatik ayarlayan fonksiyon
tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';

            if (route.name === 'Vitrin') {
              iconName = focused ? 'albums' : 'albums-outline';
            } else if (route.name === 'Kombin') {
              iconName = focused ? 'color-wand' : 'color-wand-outline';
            } else if (route.name === 'Sosyal') { // YENİ EKLENEN KISIM
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Analiz') {
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          // Menü Tasarım Ayarları
          tabBarActiveTintColor: '#2C3E50', // Seçili ikon rengi (Koyu Lacivert)
          tabBarInactiveTintColor: '#BDC3C7', // Seçili olmayan ikon rengi (Açık Gri)
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 10, // Android Gölge
            shadowColor: '#000', // iOS Gölge
            shadowOpacity: 0.1,
            shadowRadius: 10,
            height: 60,
            paddingBottom: 10,
          },
          headerShown: false, // Üstteki varsayılan çirkin başlığı gizler
        })}
      >
        <Tab.Screen name="Vitrin" component={WardrobeScreen} />
        <Tab.Screen name="Kombin" component={StylistScreen} />
        <Tab.Screen name="Sosyal" component={SocialScreen} />
        <Tab.Screen name="Analiz" component={AnalyticsScreen} />
      </Tab.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

// ------------------------------------------------------------------
// ORTAK TASARIMLAR (CSS)
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50 },
  centerContainer: { flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  title: { fontSize: 28, fontWeight: '800', color: '#2C3E50' },
  addButton: { backgroundColor: '#2C3E50', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#7F8C8D' },
  card: {
    flex: 1, backgroundColor: '#FFFFFF', margin: 8, borderRadius: 15, padding: 10, alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardImage: { width: 120, height: 120, marginBottom: 10 },
  cardInfo: { width: '100%', alignItems: 'center' },
  cardName: { fontSize: 14, fontWeight: '700', color: '#34495E', marginBottom: 4, textAlign: 'center' },
  cardCategory: { fontSize: 12, color: '#95A5A6' },
  comingSoonTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginTop: 20, marginBottom: 10 },
  comingSoonText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
});