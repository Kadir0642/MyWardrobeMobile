import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, TextInput } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiClient } from '../api/client';
import PremiumToast from '../components/PremiumToast';
import PremiumAlert from '../components/PremiumAlert'; 
import { useProfile } from '../context/ProfileContext'; // 🚀 Avatar ve Kullanıcı Adı için

const { width } = Dimensions.get('window');

export default function OutfitDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { outfit } = route.params;
  const { profileImage } = useProfile();

  const [outfitName, setOutfitName] = useState(outfit.name || 'My Vestify Look');
  const [isEditing, setIsEditing] = useState(false);
  const [clothes] = useState(outfit.clothes || outfit.items || []);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDeleteAlertVisible, setIsDeleteAlertVisible] = useState(false);

  // 🚀 KOMBİNİN KAPAK FOTOĞRAFI (Canvas/AR Çıktısı)
  const coverImage = outfit.outfitImageUrl || outfit.imageUrl;

  const handleSaveName = async () => {
    setIsEditing(false);
    try {
      await apiClient.put(`/outfits/${outfit.id}`, { name: outfitName });
      setToastMessage("Kombin ismi güncellendi ✨");
      setToastVisible(true);
    } catch (error) {
      console.error("İsim güncellenemedi", error);
    }
  };

  const confirmDelete = async () => {
    setIsDeleteAlertVisible(false); 
    try {
      await apiClient.delete(`/outfits/${outfit.id}`);
      setToastMessage("Kombin dolabından çıkarıldı 🦋");
      setToastVisible(true);
      setTimeout(() => { navigation.goBack(); }, 1500);
    } catch (error) {
      console.error("Kombin silinemedi", error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 🚀 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>VESTIFY</Text>
        
        <TouchableOpacity onPress={() => setIsDeleteAlertVisible(true)} style={styles.iconBtn}>
          <Feather name="trash-2" size={22} color="#555" /> 
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* 🚀 1. BÖLÜM: DERGİ KAPAĞI GÖRSELİ */}
        {coverImage ? (
          <View style={styles.heroWrapper}>
            <View style={styles.heroContainer}>
              <Image source={{ uri: coverImage }} style={styles.heroImage} />
              <TouchableOpacity style={styles.heartBtn}>
                <Ionicons name="heart-outline" size={26} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {/* 🚀 2. BÖLÜM: TASARIM ŞERİDİ (Görselin hemen alt/üstüne binen premium bant) */}
            <View style={styles.premiumWatermarkBand}>
              <View style={styles.watermarkLeft}>
                <Image source={{ uri: profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }} style={styles.watermarkAvatar} />
                <Text style={styles.watermarkUserText}>From @kadir's closet</Text>
              </View>
              <View style={styles.watermarkRight}>
                <Text style={styles.watermarkCreatedText}>CREATED ON</Text>
                <Text style={styles.watermarkVestifyText}>VESTIFY</Text>
              </View>
            </View>
          </View>
        ) : (
           <View style={styles.noCoverPlaceholder}>
             <Feather name="image" size={40} color="#CCC" />
             <Text style={styles.noCoverText}>Kapak görseli bulunamadı</Text>
           </View>
        )}

        {/* 🚀 3. BÖLÜM: KOMBİN BİLGİLERİ (İSİM DÜZENLEME) */}
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
              <TouchableOpacity onPress={() => setIsEditing(true)} style={{ padding: 6 }}>
                <Feather name="edit-2" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.dateText}>
            Oluşturulma: {new Date(outfit.createdAt || Date.now()).toLocaleDateString('tr-TR')}
          </Text>
        </View>

        {/* 🚀 AYIRICI BAŞLIK */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OUTFIT DETAILS ({clothes.length})</Text>
        </View>

        {/* 🚀 4. BÖLÜM: PARÇALAR IZGARASI (GRID) */}
        <View style={styles.gridContainer}>
          {clothes.map((item: any) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridItem}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ItemDetail', { item })}
            >
              <View style={styles.gridImageBox}>
                <Image source={{ uri: item.imageUrl || item.uri }} style={styles.gridImage} />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridBrand} numberOfLines={2}>
                  {item.brand ? item.brand.toUpperCase() : (item.category ? item.category.toUpperCase() : 'VESTIFY')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* UYARI VE BİLDİRİMLER */}
      <PremiumAlert 
        visible={isDeleteAlertVisible}
        title="Kombini Sil"
        message="Bu kombini dolabından kaldırmak istediğine emin misin? Parçalar dolabında kalmaya devam edecek."
        iconName="trash"
        confirmText="Kaldır"
        onCancel={() => setIsDeleteAlertVisible(false)}
        onConfirm={confirmDelete}
      />
      <PremiumToast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#EBE8DF' },
  iconBtn: { padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 3, color: '#1A1A1A' },
  
  heroWrapper: { position: 'relative', marginBottom: 20 },
  heroContainer: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#EBE8DF' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heartBtn: { position: 'absolute', top: 15, right: 15, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  noCoverPlaceholder: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#EBE8DF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  noCoverText: { marginTop: 10, color: '#888', fontWeight: '600' },

  // 🚀 TASARIMDAKİ MERKEZİ ŞERİT FİLİGRAN
  premiumWatermarkBand: { position: 'absolute', bottom: 0, width: '100%', height: 64, backgroundColor: 'rgba(245, 242, 235, 0.98)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1A1A1A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, transform: [{ translateY: 32 }] },
  watermarkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  watermarkAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#1A1A1A' },
  watermarkUserText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', letterSpacing: 0.5 },
  watermarkRight: { borderLeftWidth: 1, borderColor: '#1A1A1A', paddingLeft: 15, justifyContent: 'center' },
  watermarkCreatedText: { fontSize: 8, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  watermarkVestifyText: { fontSize: 14, fontWeight: '900', color: '#1A1A1A', letterSpacing: 1.5, marginTop: 2 },

  titleSection: { paddingHorizontal: 20, marginBottom: 25, marginTop: 30, alignItems: 'center' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  outfitTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  nameInput: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', borderBottomWidth: 1, borderColor: '#1A1A1A', paddingVertical: 4, minWidth: 150, textAlign: 'center' },
  saveBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  dateText: { fontSize: 13, color: '#888', marginTop: 8, fontWeight: '500' },

  sectionHeader: { backgroundColor: '#F5F2EB', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#EBE8DF', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1.5 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, justifyContent: 'center' },
  gridItem: { width: (width / 3) - 20, aspectRatio: 3 / 4, backgroundColor: '#FFFFFF', margin: 6, borderRadius: 12, borderWidth: 1, borderColor: '#EBE8DF', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  gridImageBox: { height: '80%', backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', padding: 10 },
  gridImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  gridTextContainer: { height: '20%', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderColor: '#EBE8DF', backgroundColor: '#FFFFFF' },
  gridBrand: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.5, paddingHorizontal: 5 }
});