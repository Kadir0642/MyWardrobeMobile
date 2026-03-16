import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Image, FlatList,Animated, PanResponder, Modal } from 'react-native';
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
// SÜRÜKLENEBİLİR KIYAFET BİLEŞENİ (Fizik Motoru)
// ------------------------------------------------------------------
const DraggableItem = ({ item, initialX, initialY, zIndex = 1 }: { item: ClothingItem, initialX: number, initialY: number, zIndex?: number }) => {
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Dokunulduğunda mevcut konumu hafızaya al
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        // Parmağı çekince konumu sabitle
        pan.flattenOffset();
        // NOT: İleride bu X ve Y koordinatlarını Java backend'e gönderip,
        // kullanıcıların hangi kıyafeti nereye koyduğunu (Örn: şapkayı en üste) AI dataset'i için kaydedeceğiz!
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        pan.getLayout(),
        styles.draggableItem,
        { zIndex: zIndex } // Hangi eşyanın üstte duracağını belirler (Örn: Ceket tişörtün üstünde)
      ]}
      {...panResponder.panHandlers}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.draggableImage} resizeMode="contain" />
    </Animated.View>
  );
};

// ------------------------------------------------------------------
// 1. EKRAN: DOLABIM (Indyx Tarzı Premium Vitrin ve Detay Paneli)
// ------------------------------------------------------------------
function WardrobeScreen() {
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null); // Tıklanan kıyafeti hafızada tutar

  useEffect(() => {
    fetchWardrobeData();
  }, []);

  const fetchWardrobeData = async () => {
    setIsLoading(true);
    try {
      // KENDİ IP ADRESİNİ YAZ:
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

  // VİTRİN KARTLARI (Artık tıklanabilir - TouchableOpacity eklendi)
  const renderClothingCard = ({ item }: { item: ClothingItem }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => setSelectedItem(item)}>
      <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.cardImage} resizeMode="contain" />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCategory}>{item.category} • {item.season}</Text>
      </View>
    </TouchableOpacity>
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

      {/* DEVASA KIYAFET DETAY PANELİ (Indyx Tarzı) */}
      <Modal visible={selectedItem !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.detailContainer}>
          
          {/* Üst Bar: Geri ve Sil Butonları */}
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedItem(null)}>
              <Ionicons name="arrow-back" size={28} color="#2C3E50" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>PARÇA DETAYI</Text>
            <TouchableOpacity onPress={() => { Alert.alert("Sil", "Bu kıyafeti dolaptan silmek istediğine emin misin?"); }}>
              <Ionicons name="trash-outline" size={26} color="#E74C3C" />
            </TouchableOpacity>
          </View>

          {/* Dev Kıyafet Fotoğrafı */}
          <View style={styles.detailImageContainer}>
            <Image source={{ uri: selectedItem?.imageUrl }} style={styles.detailImage} resizeMode="contain" />
          </View>

          {/* Analiz ve Özellikler (Maliyet, Giyilme Sayısı vs.) */}
          <View style={styles.analyticsBox}>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>12</Text>
              <Text style={styles.analyticLabel}>Kez Giyildi</Text>
            </View>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>850₺</Text>
              <Text style={styles.analyticLabel}>Fiyat</Text>
            </View>
            <View style={styles.analyticItem}>
              <Text style={[styles.analyticValue, {color: '#27AE60'}]}>70₺</Text>
              <Text style={styles.analyticLabel}>CPW (Maliyet)</Text>
            </View>
          </View>

          {/* Sezon Seçimi Toggles */}
          <Text style={styles.sectionTitle}>SEZON</Text>
          <View style={styles.seasonGrid}>
            <TouchableOpacity style={[styles.seasonButton, styles.seasonActive]}><Text style={styles.seasonTextActive}>İlkbahar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.seasonButton, styles.seasonActive]}><Text style={styles.seasonTextActive}>Yaz</Text></TouchableOpacity>
            <TouchableOpacity style={styles.seasonButton}><Text style={styles.seasonText}>Sonbahar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.seasonButton}><Text style={styles.seasonText}>Kış</Text></TouchableOpacity>
          </View>

          {/* Görünürlük Ayarları */}
          <Text style={styles.sectionTitle}>GÖRÜNÜRLÜK (VISIBILITY)</Text>
          <View style={styles.seasonGrid}>
            <TouchableOpacity style={styles.visibilityButton}><Text style={styles.visibilityText}>Gizli (Private)</Text></TouchableOpacity>
            <TouchableOpacity style={styles.visibilityButton}><Text style={styles.visibilityText}>Favori 🌟</Text></TouchableOpacity>
            <TouchableOpacity style={styles.visibilityButton}><Text style={styles.visibilityText}>Kombinleme (Do Not Style)</Text></TouchableOpacity>
            <TouchableOpacity style={styles.visibilityButton}><Text style={styles.visibilityText}>Arşivle</Text></TouchableOpacity>
          </View>

        </View>
      </Modal>

    </View>
  );
}

// ------------------------------------------------------------------
// 2. EKRAN: AI STİLİST (Mikro-Geri Bildirim ve RL Dataset)
// ------------------------------------------------------------------
function StylistScreen() {
  const [currentOutfit, setCurrentOutfit] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false); // Alttan çıkan menünün kontrolü

  useEffect(() => {
    fetchAIRecomeendation();
  }, []);

  const fetchAIRecomeendation = async () => {
    setIsLoading(true);
    try {
      // KENDİ IP ADRESİNİ YAZMAYI UNUTMA
      const response = await fetch('http://10.87.14.78:8080/api/v1/clothes/3');
      if (response.ok) {
        const data: ClothingItem[] = await response.json();
        setCurrentOutfit(data.slice(0, 3)); 
      }
    } catch (error) {
      console.error("AI Bağlantı Hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // KOMBİN BEĞENİLDİĞİNDE
  const handleLike = () => {
    console.log("Kombin BEĞENİLDİ ❤️ - Positive Reward AI'a gönderiliyor...");
    Alert.alert("Harika!", "Bu kombini günün kombini (OOTD) olarak kaydettik.");
    fetchAIRecomeendation();
  };

  // NEDEN BEĞENİLMEDİ? (Dataset'i Besleyen Ana Fonksiyon)
  const submitFeedback = (reason: string) => {
    setIsFeedbackVisible(false); // Menüyü kapat
    
    // İLERİDE: Bu JSON verisi doğrudan Java Backend'ine ve oradan Python RL Modelimize gidecek
    const feedbackData = {
      outfitId: "temp_outfit_123",
      action: "REJECT",
      reason: reason // Örn: "Renkler Uyumsuz"
    };
    
    console.log("AI Modelini Eğitmek İçin Gönderilen Veri:", JSON.stringify(feedbackData));
    
    // Geri bildirim alındıktan sonra yeni kombin getir
    fetchAIRecomeendation();
  };

  return (
    <View style={styles.stylistContainer}>
      <Text style={styles.stylistTitle}>Günün Önerisi ✨</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#3498DB" style={{ marginTop: 100 }} />
      ) : (
        <>
          <View style={styles.outfitCanvas}>
            {currentOutfit.map((item, index) => {
              const startX = 100; 
              const startY = index * 120; 
              return (
                <DraggableItem key={item.id} item={item} initialX={startX} initialY={startY} zIndex={10 - index} />
              );
            })}
          </View>

          <View style={styles.feedbackContainer}>
            {/* Çarpıya basınca artık direkt geçmiyor, menüyü açıyor */}
            <TouchableOpacity style={styles.dislikeButton} onPress={() => setIsFeedbackVisible(true)}>
              <Ionicons name="close" size={40} color="#E74C3C" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <Ionicons name="heart" size={40} color="#2ECC71" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ALTTAN AÇILAN ZEKİ GERİ BİLDİRİM MENÜSÜ (Bottom Sheet) */}
      <Modal visible={isFeedbackVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Bu kombinde neyi sevmedin?</Text>
            <Text style={styles.sheetSubtitle}>Bunu bilmek tarzını daha iyi öğrenmemi sağlayacak.</Text>

            <TouchableOpacity style={styles.reasonButton} onPress={() => submitFeedback("Renkler Uyumsuz")}>
              <Text style={styles.reasonText}>🎨 Renkler birbirine uymadı</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reasonButton} onPress={() => submitFeedback("Hava Durumuna Ters")}>
              <Text style={styles.reasonText}>🌤️ Hava durumuna uygun değil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reasonButton} onPress={() => submitFeedback("Tarzım Değil")}>
              <Text style={styles.reasonText}>👗 Benim tarzım değil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reasonButton} onPress={() => submitFeedback("Aynı Parçalar")}>
              <Text style={styles.reasonText}>🔄 Bunları hep giyiyorum</Text>
            </TouchableOpacity>

            {/* İptal Butonu */}
            <TouchableOpacity style={styles.cancelSheetButton} onPress={() => setIsFeedbackVisible(false)}>
              <Text style={styles.cancelSheetText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

  // Kombin Tuvali Tasarımları
  stylistContainer: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50, alignItems: 'center' },
  stylistTitle: { fontSize: 26, fontWeight: '800', color: '#2C3E50' },
  stylistSubtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 30 },
  canvas: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  
  // Karusel (Kaydırma Bantları) Kutusu
  carouselWrapper: { 
    height: 250, 
    width: 250, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    marginVertical: 10, 
    elevation: 8, // Android gölgesi
    shadowColor: '#000', // iOS gölgesi
    shadowOpacity: 0.15, 
    shadowRadius: 10, 
    overflow: 'hidden', // Resimlerin kutudan taşmasını engeller
    justifyContent: 'center'
  },
  carouselItem: { width: 250, height: 250, justifyContent: 'center', alignItems: 'center', padding: 20 },
  carouselImage: { width: '100%', height: '100%' },

  // AI Stilist Ekranı Tasarımları
  outfitCanvas: { 
    flex: 1, 
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    marginVertical: 20,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5,
    position: 'relative', // İçindeki parçaların serbest gezmesi için şart
    overflow: 'hidden'
  },
  draggableItem: { position: 'absolute', padding: 10 },
  draggableImage: { width: 140, height: 140 }, // Kıyafetlerin tuvaldeki boyutu
  feedbackContainer: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', paddingBottom: 20 },
  likeButton: { backgroundColor: '#EAFAF1', padding: 15, borderRadius: 40, elevation: 2 },
  dislikeButton: { backgroundColor: '#FDEDEC', padding: 15, borderRadius: 40, elevation: 2 },

  // Zeki Geri Bildirim Menüsü (Bottom Sheet) Tasarımları
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 25, 
    alignItems: 'center',
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.2, shadowRadius: 10
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E50', marginBottom: 5 },
  sheetSubtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 20, textAlign: 'center' },
  reasonButton: { 
    width: '100%', backgroundColor: '#F8F9FA', paddingVertical: 15, paddingHorizontal: 20, 
    borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#E5E8E8'
  },
  reasonText: { fontSize: 16, fontWeight: '600', color: '#34495E' },
  cancelSheetButton: { marginTop: 10, padding: 10 },
  cancelSheetText: { fontSize: 16, fontWeight: 'bold', color: '#E74C3C' },

  // Kıyafet Detay Paneli Tasarımları (Indyx Tarzı)
  detailContainer: { flex: 1, backgroundColor: '#FAFAFA', paddingHorizontal: 20, paddingTop: 20 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15 },
  detailTitle: { fontSize: 16, fontWeight: 'bold', color: '#7F8C8D', letterSpacing: 2 },
  detailImageContainer: { height: 300, backgroundColor: '#FFFFFF', borderRadius: 20, marginVertical: 15, padding: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  detailImage: { width: '100%', height: '100%' },
  
  analyticsBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 15, marginBottom: 25, borderWidth: 1, borderColor: '#EEEEEE' },
  analyticItem: { alignItems: 'center' },
  analyticValue: { fontSize: 22, fontWeight: '900', color: '#2C3E50' },
  analyticLabel: { fontSize: 12, color: '#95A5A6', marginTop: 5, fontWeight: '600' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#95A5A6', marginBottom: 10, letterSpacing: 1 },
  seasonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  seasonButton: { width: '48%', paddingVertical: 12, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#DDDDDD', alignItems: 'center', marginBottom: 10 },
  seasonActive: { backgroundColor: '#2C3E50', borderColor: '#2C3E50' },
  seasonText: { color: '#7F8C8D', fontWeight: 'bold' },
  seasonTextActive: { color: '#FFFFFF', fontWeight: 'bold' },

  visibilityButton: { width: '48%', paddingVertical: 12, backgroundColor: '#F8F9FA', borderRadius: 10, borderWidth: 1, borderColor: '#E5E8E8', alignItems: 'center', marginBottom: 10 },
  visibilityText: { color: '#34495E', fontWeight: '600', fontSize: 13 },
});