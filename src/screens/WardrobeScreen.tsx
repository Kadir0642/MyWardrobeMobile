import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Image, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import { ClothingItem } from '../types';

export default function WardrobeScreen() {
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  useEffect(() => { fetchWardrobeData(); }, []);

  const fetchWardrobeData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://10.87.14.78:8080/api/v1/clothes/3'); 
      if (response.ok) {
        const data = await response.json();
        setWardrobeItems(data);
      }
    } catch (error) { console.error("Bağlantı Hatası:", error); } 
    finally { setIsLoading(false); }
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
      const clothingData = { name: "Yeni Eklenen Parça", category: "Üst Giyim", season: "Bahar", color: "Siyah" };
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
        <Text style={styles.cardCategory}>{item.category} • {item.season}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dolabım</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickImageAndUpload}><Text style={styles.addButtonText}>+ Ekle</Text></TouchableOpacity>
      </View>
      
      {isLoading && <ActivityIndicator size="large" color="#2C3E50" style={{ marginVertical: 20 }} />}
      
      <FlatList data={wardrobeItems} keyExtractor={(item) => item.id.toString()} renderItem={renderClothingCard} numColumns={2} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false} ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Dolabın boş. Fotoğraf ekle!</Text> : null} />

      <Modal visible={selectedItem !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedItem(null)}><Ionicons name="arrow-back" size={28} color="#2C3E50" /></TouchableOpacity>
            <Text style={styles.detailTitle}>PARÇA DETAYI</Text>
            <TouchableOpacity onPress={() => { Alert.alert("Sil", "Emin misin?"); }}><Ionicons name="trash-outline" size={26} color="#E74C3C" /></TouchableOpacity>
          </View>
          <View style={styles.detailImageContainer}><Image source={{ uri: selectedItem?.imageUrl }} style={styles.detailImage} resizeMode="contain" /></View>
          <View style={styles.analyticsBox}>
            <View style={styles.analyticItem}><Text style={styles.analyticValue}>12</Text><Text style={styles.analyticLabel}>Kez Giyildi</Text></View>
            <View style={styles.analyticItem}><Text style={styles.analyticValue}>850₺</Text><Text style={styles.analyticLabel}>Fiyat</Text></View>
            <View style={styles.analyticItem}><Text style={[styles.analyticValue, {color: '#27AE60'}]}>70₺</Text><Text style={styles.analyticLabel}>CPW</Text></View>
          </View>
          <Text style={styles.sectionTitle}>SEZON</Text>
          <View style={styles.seasonGrid}>
            <TouchableOpacity style={[styles.seasonButton, styles.seasonActive]}><Text style={styles.seasonTextActive}>İlkbahar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.seasonButton, styles.seasonActive]}><Text style={styles.seasonTextActive}>Yaz</Text></TouchableOpacity>
            <TouchableOpacity style={styles.seasonButton}><Text style={styles.seasonText}>Sonbahar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.seasonButton}><Text style={styles.seasonText}>Kış</Text></TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>GÖRÜNÜRLÜK (VISIBILITY)</Text>
          <View style={styles.seasonGrid}>
            <TouchableOpacity style={styles.visibilityButton}><Text style={styles.visibilityText}>Gizli (Private)</Text></TouchableOpacity>
            <TouchableOpacity style={styles.visibilityButton}><Text style={styles.visibilityText}>Favori 🌟</Text></TouchableOpacity>
            <TouchableOpacity style={styles.visibilityButton}><Text style={styles.visibilityText}>Do Not Style</Text></TouchableOpacity>
            <TouchableOpacity style={styles.visibilityButton}><Text style={styles.visibilityText}>Arşivle</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  title: { fontSize: 28, fontWeight: '800', color: '#2C3E50' },
  addButton: { backgroundColor: '#2C3E50', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#7F8C8D' },
  card: { flex: 1, backgroundColor: '#FFFFFF', margin: 8, borderRadius: 15, padding: 10, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardImage: { width: 120, height: 120, marginBottom: 10 },
  cardInfo: { width: '100%', alignItems: 'center' },
  cardName: { fontSize: 14, fontWeight: '700', color: '#34495E', marginBottom: 4, textAlign: 'center' },
  cardCategory: { fontSize: 12, color: '#95A5A6' },
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