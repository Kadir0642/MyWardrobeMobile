import React, { useState, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Image, FlatList, Modal, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import { ClothingItem } from '../types';
import { useNavigation } from '@react-navigation/native';

const CATEGORIES = ['Tümü', 'Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];

// DÜZELTME 1: Ekran genişliğini EN DIŞARIYA aldık! Artık StyleSheet de görebilecek.
const { width: SCREEN_WIDTH } = Dimensions.get('window'); 

export default function WardrobeScreen() {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'OUTFITS'>('ITEMS'); 
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const navigation = useNavigation<any>(); 
  
  const [outfits, setOutfits] = useState<any[]>([]);

  useEffect(() => { 
    if (activeTab === 'ITEMS') fetchWardrobeData(); 
    else if (activeTab === 'OUTFITS') fetchOutfitsData(); 
  }, [activeCategory, activeTab]);

  const fetchOutfitsData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://10.87.14.78:8080/api/v1/outfits/user/3');
      if (response.ok) {
        const data = await response.json();
        setOutfits(data); 
      }
    } catch (error) { console.error("Kombin Çekme Hatası:", error); } 
    finally { setIsLoading(false); }
  };

  const logOutfitToBackend = async (outfitId: number) => {
    try {
      const response = await fetch(`http://10.87.14.78:8080/api/v1/outfits/3/log/${outfitId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather: 'Güneşli, Harika bir gün', temperature: 22 }) 
      });

      if (response.ok) {
        Alert.alert("Harika! 🎯", "Kombin başarıyla takvime kaydedildi ve istatistikler güncellendi!");
      } else {
        Alert.alert("Hata", "Kombin kaydedilemedi.");
      }
    } catch (error) {
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı.");
    }
  };

  const fetchWardrobeData = async () => {
    setIsLoading(true);
    try {
      const url = activeCategory === 'Tümü' 
        ? 'http://10.87.14.78:8080/api/v1/clothes/3'
        : `http://10.87.14.78:8080/api/v1/clothes/3/filter?category=${activeCategory}`;

      const response = await fetch(url); 
      if (response.ok) {
        const data = await response.json();
        setWardrobeItems(data);
      }
    } catch (error) { console.error("Bağlantı Hatası:", error); } 
    finally { setIsLoading(false); }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchWardrobeData();
    setIsRefreshing(false);
  };

  const pickImageAndUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    if (!result.canceled) await uploadToBackend(result.assets[0].uri);
  };

  const uploadToBackend = async (uri: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: uri, name: 'yeni_kiyafet.jpg', type: 'image/jpeg' } as any);
      const clothingData = { name: "Yeni Parça", category: activeCategory !== 'Tümü' ? activeCategory : "Üst Giyim", season: "Bahar", color: "Siyah" };
      formData.append('data', JSON.stringify(clothingData));

      const response = await fetch('http://10.87.14.78:8080/api/v1/clothes/3', { method: 'POST', body: formData });
      if (response.ok) { Alert.alert("Harika!", "Kıyafet eklendi!"); fetchWardrobeData(); } 
      else { Alert.alert("Hata", "Yükleme başarısız oldu."); }
    } catch (error) { Alert.alert("Hata", "Sunucuya bağlanılamadı."); } 
    finally { setIsLoading(false); }
  };

  const renderClothingCard = ({ item }: { item: ClothingItem }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => setSelectedItem(item)}>
      <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.cardImage} resizeMode="contain" />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  // YATAY KAYDIRMALI (Whering Tarzı) Kombin Kartı
  const renderOutfitCard = ({ item }: { item: any }) => (
    <View style={styles.outfitCarouselItem}>
      <Text style={styles.outfitPremiumName}>{item.name}</Text>

      <ScrollView contentContainerStyle={styles.outfitPremiumGrid} showsVerticalScrollIndicator={false}>
        {item.clothes && item.clothes.map((clothing: any, idx: number) => (
          <TouchableOpacity key={idx} style={styles.outfitPremiumThumbnailWrapper} onPress={() => setSelectedItem(clothing)}>
            <Image source={{ uri: clothing.imageUrl || 'https://via.placeholder.com/150' }} style={styles.outfitPremiumThumbnail} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.logOutfitPremiumButton} onPress={() => logOutfitToBackend(item.id)}>
        <Ionicons name="calendar-outline" size={20} color="#FFFFFF" style={{marginRight: 10}} />
        <Text style={styles.logOutfitPremiumText}>BUGÜN BUNU GİYDİM</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dolabım</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickImageAndUpload}><Text style={styles.addButtonText}>+ Ekle</Text></TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'ITEMS' && styles.tabActive]} onPress={() => setActiveTab('ITEMS')}>
          <Text style={[styles.tabText, activeTab === 'ITEMS' && styles.tabTextActive]}>PARÇALAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'OUTFITS' && styles.tabActive]} onPress={() => setActiveTab('OUTFITS')}>
          <Text style={[styles.tabText, activeTab === 'OUTFITS' && styles.tabTextActive]}>KOMBİNLER</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'ITEMS' && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {CATEGORIES.map((cat, index) => (
              <TouchableOpacity key={index} style={[styles.filterPill, activeCategory === cat && styles.filterPillActive]} onPress={() => setActiveCategory(cat)}>
                <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {isLoading && !isRefreshing && <ActivityIndicator size="large" color="#2C3E50" style={{ marginVertical: 20 }} />}
      
      {activeTab === 'ITEMS' ? (
        <FlatList key="items-grid" data={wardrobeItems} keyExtractor={(item) => item.id.toString()} renderItem={renderClothingCard} numColumns={2} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false} ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Bu kategoride kıyafet yok.</Text> : null} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#2C3E50']} tintColor="#2C3E50" />} />
      ) : (
        <FlatList 
          key="outfits-carousel" 
          data={outfits} 
          keyExtractor={(item) => item.id.toString()} 
          renderItem={renderOutfitCard} 
          contentContainerStyle={styles.outfitCarouselContainer} 
          horizontal={true} 
          pagingEnabled={true} 
          showsHorizontalScrollIndicator={false} 
          snapToInterval={SCREEN_WIDTH} 
          decelerationRate="fast" 
          ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Henüz bir kombin oluşturmadın.</Text> : null}
        />
      )}

      {/* DETAY PANELİ */}
      <Modal visible={selectedItem !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedItem(null)}><Ionicons name="close" size={28} color="#2C3E50" /></TouchableOpacity>
            <Text style={styles.detailTitle}>PARÇA DETAYI</Text>
            <TouchableOpacity onPress={() => { Alert.alert("Sil", "Emin misin?"); }}><Ionicons name="trash-outline" size={24} color="#E74C3C" /></TouchableOpacity>
          </View>

          <View style={styles.detailImageContainer}><Image source={{ uri: selectedItem?.imageUrl }} style={styles.detailImage} resizeMode="contain" /></View>
          
          <View style={styles.analyticsBox}>
            <View style={styles.analyticItem}><Text style={styles.analyticValue}>12</Text><Text style={styles.analyticLabel}>Kez Giyildi</Text></View>
            <View style={styles.analyticItem}><Text style={styles.analyticValue}>850₺</Text><Text style={styles.analyticLabel}>Fiyat</Text></View>
            <View style={styles.analyticItem}><Text style={[styles.analyticValue, {color: '#27AE60'}]}>70₺</Text><Text style={styles.analyticLabel}>CPW</Text></View>
          </View>

          <TouchableOpacity 
            style={styles.magicWandButton}
            onPress={() => {
              const itemId = selectedItem?.id;
              setSelectedItem(null); 
              navigation.navigate('Kombin', { anchorItemId: itemId }); 
            }}
          >
            <Ionicons name="color-wand" size={24} color="#FFFFFF" />
            <Text style={styles.magicWandText}>BUNUNLA KOMBİN ÜRET</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  title: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  addButton: { backgroundColor: '#1A1A1A', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#EFEFEF', marginHorizontal: 20, borderRadius: 10, padding: 4, marginBottom: 15 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888888', letterSpacing: 1 },
  tabTextActive: { color: '#1A1A1A', fontWeight: '800' },

  filterContainer: { height: 45, marginBottom: 10 },
  filterScroll: { paddingHorizontal: 20, alignItems: 'center' },
  filterPill: { paddingHorizontal: 18, paddingVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#E5E5E5' },
  filterPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  filterText: { color: '#666666', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#FFFFFF', fontWeight: 'bold' },

  listContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 15, color: '#888888' },
  card: { flex: 1, backgroundColor: '#FFFFFF', margin: 8, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  cardImage: { width: 120, height: 120, marginBottom: 10 },
  cardInfo: { width: '100%', alignItems: 'center' },
  cardName: { fontSize: 13, fontWeight: '700', color: '#333333', textAlign: 'center' },

  detailContainer: { flex: 1, backgroundColor: '#FAF9F6', paddingHorizontal: 20, paddingTop: 20 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15 },
  detailTitle: { fontSize: 14, fontWeight: 'bold', color: '#888888', letterSpacing: 2 },
  detailImageContainer: { height: 320, backgroundColor: '#FFFFFF', borderRadius: 20, marginVertical: 15, padding: 20, borderWidth: 1, borderColor: '#EEEEEE' },
  detailImage: { width: '100%', height: '100%' },
  analyticsBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: '#EEEEEE' },
  analyticItem: { alignItems: 'center' },
  analyticValue: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  analyticLabel: { fontSize: 11, color: '#888888', marginTop: 4, fontWeight: '700', textTransform: 'uppercase' },
  
  magicWandButton: { flexDirection: 'row', backgroundColor: '#1A1A1A', paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: 30, gap: 10 },
  magicWandText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 1 },

  // PREMIMUM YATAY KOMBİN VİTRİNİ STİLLERİ
  outfitCarouselContainer: { paddingBottom: 20 },
  outfitCarouselItem: { 
    width: SCREEN_WIDTH, 
    height: 520, 
    padding: 20, 
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', 
    borderRadius: 20,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, 
  },
  
  outfitPremiumName: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1, marginBottom: 15 },
  
  outfitPremiumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  outfitPremiumThumbnailWrapper: {
    width: '45%', 
    height: 180, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEEEEE'
  },
  outfitPremiumThumbnail: { width: '100%', height: '100%' },

  logOutfitPremiumButton: { 
    flexDirection: 'row', 
    backgroundColor: '#D9534F', 
    paddingVertical: 15, 
    width: '100%', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 20,
    elevation: 5, shadowColor: '#D9534F', shadowOpacity: 0.3, shadowRadius: 10 
  },
  logOutfitPremiumText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 1.5, textTransform: 'uppercase' }
});