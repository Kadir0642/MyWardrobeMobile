import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiClient } from '../api/client';
import PremiumToast from '../components/PremiumToast';
import PremiumAlert from '../components/PremiumAlert'; // 🚀 Yeni zarif popup'ımız geldi

const { width } = Dimensions.get('window');

export default function OutfitDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { outfit } = route.params;

  const [outfitName, setOutfitName] = useState(outfit.name || 'Kombinim');
  const [isEditing, setIsEditing] = useState(false);
  const [clothes] = useState(outfit.clothes || []);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // 🚀 ÖZEL UYARI PENCERESİ ŞALTERİ
  const [isDeleteAlertVisible, setIsDeleteAlertVisible] = useState(false);

  // İSİM GÜNCELLEME
  const handleSaveName = async () => {
    setIsEditing(false);
    try {
      await apiClient.put(`/outfits/${outfit.id}`, { name: outfitName });
      setToastMessage("Kombin ismi güncellendi ✨");
      setToastVisible(true);
    } catch (error) {
      console.error("İsim güncellenemedi", error);
      // Hata durumunda da premium alert kullanabilirsin ama şimdilik konsola yazdırıyoruz
    }
  };

  // 🚀 KOMBİNİ SİLME (Artık doğrudan Alert.alert çağırmıyor, bizim şalteri açıyor)
  const confirmDelete = async () => {
    setIsDeleteAlertVisible(false); // Popup'ı kapat
    try {
      await apiClient.delete(`/outfits/${outfit.id}`);
      
      setToastMessage("Kombin dolabından çıkarıldı 🦋");
      setToastVisible(true);
      
      setTimeout(() => {
        navigation.goBack(); 
      }, 1500);

    } catch (error) {
      console.error("Kombin silinemedi", error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        
        {/* 🚀 Sert kırmızı yerine zarif bir soft gri/siyah ikon */}
        <TouchableOpacity onPress={() => setIsDeleteAlertVisible(true)} style={styles.iconBtn}>
          <Feather name="trash-2" size={22} color="#555" /> 
        </TouchableOpacity>
      </View>

      <View style={styles.titleSection}>
        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={outfitName}
              onChangeText={setOutfitName}
              autoFocus
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.editRow}>
            <Text style={styles.outfitTitle}>{outfitName}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={{ padding: 4 }}>
              <Feather name="edit-2" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.dateText}>
          Oluşturulma: {new Date(outfit.createdAt || Date.now()).toLocaleDateString('tr-TR')}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Kombin Parçaları ({clothes.length})</Text>
        
        <View style={styles.grid}>
          {clothes.map((item: any) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.itemCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ItemDetail', { item })}
            >
              <View style={styles.imageBox}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              </View>
              <Text style={styles.itemBrand} numberOfLines={1}>{item.category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 🚀 YENİ ZARİF ONAY PENCEREMİZ */}
      <PremiumAlert 
        visible={isDeleteAlertVisible}
        title="Kombini Sil"
        message="Bu kombini dolabından kaldırmak istediğine emin misin? Parçalar dolabında kalmaya devam edecek."
        iconName="trash"
        confirmText="Kaldır"
        onCancel={() => setIsDeleteAlertVisible(false)}
        onConfirm={confirmDelete}
      />

      {/* PREMIUM TOAST BİLDİRİMİ */}
      <PremiumToast 
        visible={toastVisible} 
        message={toastMessage} 
        onHide={() => setToastVisible(false)} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10 },
  iconBtn: { padding: 5 },
  titleSection: { paddingHorizontal: 20, marginBottom: 20, marginTop: 10 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  outfitTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  nameInput: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1A1A1A', borderBottomWidth: 1, borderColor: '#1A1A1A', paddingVertical: 4 },
  saveBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  dateText: { fontSize: 13, color: '#888', marginTop: 8, fontWeight: '500' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  itemCard: { width: (width - 55) / 2, marginBottom: 15 },
  imageBox: { width: '100%', height: 200, backgroundColor: '#FFF', borderRadius: 16, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  itemImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  itemBrand: { fontSize: 12, fontWeight: '700', color: '#888', marginTop: 8, textAlign: 'center', textTransform: 'uppercase' },
});