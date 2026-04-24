import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, TextInput, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiClient } from '../api/client';
import { CURRENT_USER_ID } from './WardrobeScreen'; // İstersen context'ten de alabilirsin

const { width } = Dimensions.get('window');

export default function OutfitDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { outfit } = route.params;

  // Başlangıçta Java'dan gelen verileri State'e alıyoruz
  const [outfitName, setOutfitName] = useState(outfit.name || 'Kombinim');
  const [isEditing, setIsEditing] = useState(false);
  const [clothes] = useState(outfit.clothes || []);

  // 🚀 İSİM GÜNCELLEME (Backend'e PUT isteği atılacak)
  const handleSaveName = async () => {
    setIsEditing(false);
    try {
      // Not: Backend tarafında PUT /outfits/{id} gibi bir metod yazmış olmamız lazım
      // await apiClient.put(`/outfits/${outfit.id}`, { name: outfitName });
      console.log(`Kombin ismi güncellendi: ${outfitName}`);
    } catch (error) {
      console.error("İsim güncellenemedi", error);
      Alert.alert("Hata", "İsim güncellenirken bir sorun oluştu.");
    }
  };

  // 🚀 KOMBİNİ SİLME (Backend'e DELETE isteği atılacak)
  const handleDeleteOutfit = () => {
    Alert.alert(
      "Kombini Sil",
      "Bu kombini dolabından silmek istediğine emin misin?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              // await apiClient.delete(`/outfits/${outfit.id}`);
              console.log("Kombin silindi!");
              navigation.goBack(); // Silince Wardrobe'a geri dön
            } catch (error) {
              console.error("Kombin silinemedi", error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* ÜST BAR (HEADER) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteOutfit} style={styles.iconBtn}>
          <Feather name="trash-2" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* KOMBİN İSMİ VE DÜZENLEME ALANI */}
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

      {/* İÇİNDEKİ PARÇALARIN LİSTESİ */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Kombin Parçaları ({clothes.length})</Text>
        
        <View style={styles.grid}>
          {clothes.map((item: any) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.itemCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ItemDetail', { item })} // Parçanın da kendi detayına gidebilir
            >
              <View style={styles.imageBox}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              </View>
              <Text style={styles.itemBrand} numberOfLines={1}>{item.category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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