import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, TextInput } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiClient } from '../api/client';
import PremiumToast from '../components/PremiumToast';
import PremiumAlert from '../components/PremiumAlert'; 

const { width } = Dimensions.get('window');

export default function OutfitDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { outfitList, initialIndex } = route.params;

  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [activeOutfit, setActiveOutfit] = useState(route.params.outfit);
  const [outfitName, setOutfitName] = useState(activeOutfit.name || 'My Vestify Look');
  const [clothes, setClothes] = useState(activeOutfit.clothes || activeOutfit.items || []);

  const [isEditing, setIsEditing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDeleteAlertVisible, setIsDeleteAlertVisible] = useState(false);

  useEffect(() => {
    if (outfitList && outfitList.length > 0) {
      const newOutfit = outfitList[currentIndex];
      setActiveOutfit(newOutfit);
      setOutfitName(newOutfit.name || 'My Vestify Look');
      setClothes(newOutfit.clothes || newOutfit.items || []);
      setIsEditing(false); 
    }
  }, [currentIndex, outfitList]);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (outfitList && currentIndex < outfitList.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const coverImage = activeOutfit.outfitImageUrl || activeOutfit.imageUrl;

  const handleSaveName = async () => {
    setIsEditing(false);
    try {
      await apiClient.put(`/outfits/${activeOutfit.id}`, { name: outfitName });
      setToastMessage("Kombin ismi güncellendi ✨");
      setToastVisible(true);
    } catch (error) {
      console.error("İsim güncellenemedi", error);
    }
  };

  const confirmDelete = async () => {
    setIsDeleteAlertVisible(false); 
    try {
      await apiClient.delete(`/outfits/${activeOutfit.id}`);
      setToastMessage("Kombin dolabından çıkarıldı 🦋");
      setToastVisible(true);
      setTimeout(() => { navigation.goBack(); }, 1500);
    } catch (error) {
      console.error("Kombin silinemedi", error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
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
        
        {coverImage ? (
          <View style={styles.heroFrameWrapper}>
            <View style={styles.heroFrame}>
              <Image source={{ uri: coverImage }} style={styles.heroImage} />
            </View>
          </View>
        ) : (
           <View style={styles.noCoverPlaceholder}>
             <Feather name="image" size={40} color="#CCC" />
             <Text style={styles.noCoverText}>Kapak görseli bulunamadı</Text>
           </View>
        )}

        {outfitList && outfitList.length > 1 && (
          <View style={styles.navigationRow}>
            <TouchableOpacity onPress={handlePrev} disabled={currentIndex === 0} style={{ padding: 10 }}>
              <Feather name="chevron-left" size={24} color={currentIndex === 0 ? '#CCC' : '#1A1A1A'} />
            </TouchableOpacity>

            <Text style={styles.navigationText}>
              {currentIndex + 1} of {outfitList.length}
            </Text>

            <TouchableOpacity onPress={handleNext} disabled={currentIndex === outfitList.length - 1} style={{ padding: 10 }}>
              <Feather name="chevron-right" size={24} color={currentIndex === outfitList.length - 1 ? '#CCC' : '#1A1A1A'} />
            </TouchableOpacity>
          </View>
        )}

        {/* 🚀 KUSURSUZ 50/50 BÖLÜNMÜŞ BAŞLIK VE DÜZENLEME SATIRI */}
        <View style={styles.detailsHeaderRow}>
          
          <View style={styles.detailsHeaderLeft}>
            <Text style={styles.sectionTitle}>OUTFIT DETAILS</Text>
            <Text style={styles.itemCountText}>{clothes.length} Pieces</Text>
          </View>
          
          <View style={styles.detailsHeaderRight}>
            {isEditing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.nameInput}
                  value={outfitName}
                  onChangeText={setOutfitName}
                  autoFocus
                  onSubmitEditing={handleSaveName}
                  multiline={false}
                />
                <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.editRow}>
                <Text style={styles.outfitTitle} numberOfLines={1}>{outfitName}</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={{ paddingLeft: 8 }}>
                  <Feather name="edit-2" size={16} color="#888" />
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.dateText}>
              {new Date(activeOutfit.createdAt || Date.now()).toLocaleDateString('tr-TR')}
            </Text>
          </View>

        </View>

        <View style={styles.gridContainer}>
          {clothes.map((item: any, idx: number) => (
            <TouchableOpacity 
              key={`cloth-${item.id}-${idx}`} 
              style={styles.gridItem}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ItemDetail', { item })}
            >
              <View style={styles.gridImageBox}>
                <Image source={{ uri: item.imageUrl || item.uri }} style={styles.gridImage} />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridBrand} numberOfLines={1}>
                  {item.brand ? item.brand.toUpperCase() : (item.category ? item.category.toUpperCase() : 'VESTIFY')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#EBE8DF' },
  iconBtn: { padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 3, color: '#1A1A1A' },
  
  heroFrameWrapper: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 5 },
  heroFrame: { 
    width: '100%', aspectRatio: 3 / 4, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 16, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 6,
    borderWidth: 1, borderColor: '#EBE8DF'
  },
  heroImage: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: '#F5F2EB', resizeMode: 'cover' },
  
  noCoverPlaceholder: { width: width - 40, aspectRatio: 3 / 4, backgroundColor: '#EBE8DF', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 25, borderRadius: 16 },
  noCoverText: { marginTop: 10, color: '#888', fontWeight: '600' },

  navigationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  navigationText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1, marginHorizontal: 15 },

  // 🚀 YENİ 50/50 SATIR STİLLERİ
  detailsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, marginBottom: 15, borderBottomWidth: 1, borderColor: '#EBE8DF' },
  detailsHeaderLeft: { flex: 0.45, justifyContent: 'center' },
  detailsHeaderRight: { flex: 0.55, alignItems: 'flex-end' },
  
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1 },
  itemCountText: { fontSize: 11, fontWeight: '600', color: '#888', marginTop: 4 },
  
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '100%' },
  outfitTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', textAlign: 'right', flexShrink: 1 },
  nameInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1A1A1A', borderBottomWidth: 1, borderColor: '#1A1A1A', paddingVertical: 2, textAlign: 'right', marginRight: 5 },
  saveBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  dateText: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '500', textAlign: 'right' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  gridItem: { width: (width / 2) - 22, aspectRatio: 3 / 4, backgroundColor: '#FFFFFF', marginBottom: 15, borderRadius: 16, borderWidth: 1, borderColor: '#EAEAEA', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  gridImageBox: { height: '80%', backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', padding: 15 },
  gridImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  gridTextContainer: { height: '20%', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderColor: '#EAEAEA', backgroundColor: '#FFFFFF' },
  gridBrand: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.5, paddingHorizontal: 5 }
});