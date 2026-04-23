import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 🚀 Merkezi API'mizi çağırdık
import { apiClient } from '../api/client';
import { ClothingItem } from '../types';

const { width, height } = Dimensions.get('window');

const COLOR_PALETTE = [
  '#000000', '#4A3B32', '#0000FF', '#8A2BE2', '#FF1493', '#FF4500', '#008000', 
  '#FFFF00', '#FF0000', '#808080', '#F5DEB3', '#FFFFFF', '#D3D3D3', '#B8860B'
];

const AI_COLOR_MAP: Record<string, string> = {
  "black": "#000000", "brown": "#4A3B32", "blue": "#0000FF", "purple": "#8A2BE2", 
  "pink": "#FF1493", "orange": "#FF4500", "green": "#008000", "yellow": "#FFFF00", 
  "red": "#FF0000", "gray": "#808080", "beige": "#F5DEB3", "white": "#FFFFFF", 
  "silver": "#D3D3D3", "gold": "#B8860B", "multicolor": "#808080" 
};

// 🚀 Zenginleştirilmiş listelerimiz buraya da yansıdı!
const CATEGORY_OPTIONS = ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories', 'Full Body'];

const SUBCATEGORY_OPTIONS = [
  'T-Shirt', 'Shirt', 'Blouse', 'Sweater', 'Cardigan', 'Hoodie', 'Sweatshirt', 'Tank top',
  'Jacket', 'Coat', 'Trench coat', 'Blazer', 'Vest', 'Poncho',
  'Pants', 'Jeans', 'Sweatpants', 'Leggings', 'Shorts', 'Skirt',
  'Dress', 'Jumpsuit', 'Romper', 'Suit',
  'Sneakers', 'Boots', 'Sandals', 'Heels', 'Loafers', 'Slippers', 'Formal shoes',
  'Hat', 'Cap', 'Beanie', 'Watch', 'Sunglasses', 'Glasses',
  'Bag', 'Backpack', 'Purse', 'Wallet', 'Belt', 'Scarf', 'Gloves', 'Necklace', 'Ring', 'Earrings', 'Tie'
];

// Kullanıcının ilerideki pazaryeri için sadece BEDEN seçmesini bıraktık
const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Oversize', 'One Size'];


const guessParentCategory = (subCat: string) => {
  const s = subCat.toLowerCase();
  if (['t-shirt', 'shirt', 'blouse', 'sweater', 'cardigan', 'hoodie', 'sweatshirt', 'tank top'].some(w => s.includes(w))) return 'Tops';
  if (['pants', 'jeans', 'sweatpants', 'leggings', 'shorts', 'skirt'].some(w => s.includes(w))) return 'Bottoms';
  if (['sneakers', 'boots', 'sandals', 'heels', 'loafers', 'slippers', 'formal shoes'].some(w => s.includes(w))) return 'Footwear';
  if (['dress', 'jumpsuit', 'romper', 'suit'].some(w => s.includes(w))) return 'Full Body';
  if (['hat', 'cap', 'beanie', 'watch', 'sunglasses', 'glasses', 'bag', 'backpack', 'purse', 'wallet', 'belt', 'scarf', 'gloves', 'necklace', 'ring', 'earrings', 'tie'].some(w => s.includes(w))) return 'Accessories';
  if (['jacket', 'coat', 'trench coat', 'blazer', 'vest', 'poncho'].some(w => s.includes(w))) return 'Outerwear';
  return CATEGORY_OPTIONS[0]; 
};

export default function ItemDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  // 🚀 TİP GÜVENLİĞİ: Gelen öğenin ClothingItem tipinde olduğunu biliyoruz
  const item: ClothingItem = route.params?.item;

  const [isSaving, setIsSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'category' | 'subCategory' | 'size'>('category');

  const sanitizeInput = (text: string) => text.replace(/[<>{}\\]/g, ''); 

  // 1. Kategori Formatlama
  let initCategory = item.category || CATEGORY_OPTIONS[0];
  let initSubCategory = item.subCategory || 'Select Sub-Category';
  
  const isAICategory = SUBCATEGORY_OPTIONS.some(sub => sub.toLowerCase() === initCategory.toLowerCase());
  if (isAICategory) {
    initSubCategory = initCategory.charAt(0).toUpperCase() + initCategory.slice(1); 
    initCategory = guessParentCategory(initSubCategory); 
  }

  // 2. Renk Formatlama
  const initialColors: string[] = [];
  if (item.color) {
    const rawColors = item.color.toLowerCase().split(',');
    rawColors.forEach((rc: string) => {
      const cleanColor = rc.trim();
      if (AI_COLOR_MAP[cleanColor]) {
        initialColors.push(AI_COLOR_MAP[cleanColor]); 
      } else if (cleanColor.includes('#')) {
        initialColors.push(cleanColor); 
      }
    });
  }

  // 3. Sezon Formatlama
  const initialSeasons = item.season && item.season !== 'BELIRTILMEDI' 
    ? item.season.toUpperCase().split(',').map((s: string) => s.trim()) 
    : ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']; // Hepsi seçili gelsin
  
  // --- STATE TANIMLAMALARI ---
  const [brand, setBrand] = useState(item.brand || '');
  const [category, setCategory] = useState(initCategory);
  const [subCategory, setSubCategory] = useState(initSubCategory);
  const [size, setSize] = useState(item.size || 'Select Size'); 
  const [name, setName] = useState(item.name || item.brand || 'Vestify Item');
  
  const [selectedColors, setSelectedColors] = useState<string[]>(initialColors);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialSeasons);

  const toggleColor = (color: string) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  const toggleSeason = (season: string) => setSelectedSeasons(prev => prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]);
  
  const openPicker = (type: 'category' | 'subCategory' | 'size') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelectOption = (option: string) => {
    if (modalType === 'category') setCategory(option);
    if (modalType === 'subCategory') setSubCategory(option);
    if (modalType === 'size') setSize(option);
    setModalVisible(false);
  };

  const getModalData = () => {
    switch(modalType) {
      case 'category': return CATEGORY_OPTIONS;
      case 'subCategory': return SUBCATEGORY_OPTIONS;
      case 'size': return SIZE_OPTIONS;
      default: return [];
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedData = {
      brand: sanitizeInput(brand),
      category: category.toUpperCase(), // Backend'deki Enum ve stringlerle uyumlu olsun diye
      subCategory: subCategory !== 'Select Sub-Category' ? subCategory.toUpperCase() : null, 
      size: size !== 'Select Size' ? size : null,
      name: sanitizeInput(name),
      color: selectedColors.join(','), 
      season: selectedSeasons.length > 0 ? selectedSeasons[0] : 'ALL_SEASON', // Şimdilik ilk sezonu yolluyoruz
    };

    try {
      // 🚀 AXIOS İLE TEMİZ KAYIT (Aynı zamanda Spring Boot endpointine uyumlu hale getireceğiz)
      const response = await apiClient.put(`/clothes/${item.id}`, updatedData);

      if (response.status === 200 || response.status === 204) {
        Alert.alert("Başarılı! 🌿", "Kıyafet bilgileri güncellendi.");
        navigation.goBack(); 
      } else {
        Alert.alert("Kaydedilemedi", "Sunucu bir hata döndürdü.");
      }
    } catch (error: any) {
      console.error("Kaydetme Hatası:", error.response?.data || error.message);
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    } finally {
      setIsSaving(false);
    }
  };

  // Silme İşlemi (Çöp Kutusu Butonu İçin)
  const handleDelete = async () => {
    Alert.alert(
      "Kıyafeti Sil",
      "Bu kıyafeti dolabından silmek istediğine emin misin?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Evet, Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsSaving(true);
              // Java tarafındaki deleteClothingItem endpointi çağrılıyor (Soft delete)
              await apiClient.delete(`/clothes/${item.id}`);
              navigation.goBack(); // Sildikten sonra dolaba dön
            } catch (error) {
              Alert.alert("Hata", "Kıyafet silinemedi.");
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
          <Feather name="arrow-left" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>EDIT ITEM</Text>
        
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <TouchableOpacity onPress={handleDelete} disabled={isSaving} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
            <Feather name="trash-2" size={24} color="#E07A5F" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} disabled={isSaving} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
            {isSaving ? (
              <Text style={{ color: '#E07A5F', fontWeight: 'bold' }}>⏳</Text>
            ) : (
              <Feather name="check" size={26} color="#1A1A1A" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          <View style={styles.imageContainer}>
            {/* 🚀 IMAGE_URL DÜZELTİLDİ */}
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          </View>

          {/* SEKME SEÇİCİ TAMAMEN KALDIRILDI! Sadece form kaldı. */}

          <View style={styles.formContainer}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BRAND</Text>
              <TextInput style={styles.inputField} value={brand} onChangeText={(t) => setBrand(sanitizeInput(t))} placeholder="E.g. Zara, H&M" placeholderTextColor="#AAA" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CATEGORY*</Text>
              <TouchableOpacity style={[styles.pickerButton, { zIndex: 10 }]} onPress={() => openPicker('category')} activeOpacity={0.7}>
                <Text style={styles.pickerText}>{category}</Text>
                <Feather name="chevron-down" size={20} color="#AAA" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SUB-CATEGORY</Text>
              <TouchableOpacity style={[styles.pickerButton, { zIndex: 10 }]} onPress={() => openPicker('subCategory')} activeOpacity={0.7}>
                <Text style={[styles.pickerText, subCategory === 'Select Sub-Category' && {color: '#AAA'}]}>{subCategory}</Text>
                <Feather name="chevron-down" size={20} color="#AAA" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SIZE</Text>
              <TouchableOpacity style={[styles.pickerButton, { zIndex: 10 }]} onPress={() => openPicker('size')} activeOpacity={0.7}>
                <Text style={[styles.pickerText, size === 'Select Size' && {color: '#AAA'}]}>{size}</Text>
                <Feather name="chevron-down" size={20} color="#AAA" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NAME (NICKNAME)</Text>
              <TextInput style={styles.inputField} value={name} onChangeText={(t) => setName(sanitizeInput(t))} placeholder="E.g. My Favorite Jacket" placeholderTextColor="#AAA" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>COLOR</Text>
              <View style={styles.colorGrid}>
                {COLOR_PALETTE.map((c, idx) => {
                  const isSelected = selectedColors.includes(c);
                  return (
                    <TouchableOpacity key={idx} onPress={() => toggleColor(c)} style={[styles.colorBox, { backgroundColor: c }, c === '#FFFFFF' && { borderWidth: 1, borderColor: '#DDD' }, isSelected && styles.colorBoxSelected]}>
                      {isSelected && <Feather name="check" size={16} color={c === '#FFFFFF' || c === '#FFFF00' ? '#000' : '#FFF'} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SEASON</Text>
              <View style={styles.seasonRow}>
                {['SPRING', 'SUMMER'].map((s) => (
                  <TouchableOpacity key={s} onPress={() => toggleSeason(s)} style={[styles.seasonButton, selectedSeasons.includes(s) && styles.seasonButtonActive]}>
                    <Text style={[styles.seasonButtonText, selectedSeasons.includes(s) && styles.seasonButtonTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.seasonRow, { marginTop: 10 }]}>
                {['AUTUMN', 'WINTER'].map((s) => (
                  <TouchableOpacity key={s} onPress={() => toggleSeason(s)} style={[styles.seasonButton, selectedSeasons.includes(s) && styles.seasonButtonActive]}>
                    <Text style={[styles.seasonButtonText, selectedSeasons.includes(s) && styles.seasonButtonTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* LÜKS AÇILIR MENÜ AYNI KALDI */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{top:20, bottom:20, left:20, right:20}}>
                <Feather name="x" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getModalData()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalOption} onPress={() => handleSelectOption(item)}>
                  <Text style={[styles.modalOptionText, 
                    (item === category || item === subCategory || item === size) && styles.modalOptionTextActive
                  ]}>{item}</Text>
                  {(item === category || item === subCategory || item === size) && (
                    <Feather name="check" size={20} color="#6A5ACD" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2EB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#D1CFC7', backgroundColor: '#F5F2EB', zIndex: 10 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  imageContainer: { width: '100%', height: width * 1.1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#D1CFC7' },
  itemImage: { width: '90%', height: '90%', resizeMode: 'contain' },
  formContainer: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8, letterSpacing: 0.5 },
  inputField: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1CFC7', borderRadius: 6, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: '#1A1A1A' },
  pickerButton: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1CFC7', borderRadius: 6, paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', justifyContent: 'space-between' },
  pickerText: { fontSize: 14, color: '#1A1A1A' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 5 },
  colorBox: { width: 36, height: 36, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  colorBoxSelected: { borderWidth: 2, borderColor: '#1A1A1A', transform: [{ scale: 1.1 }] },
  seasonRow: { flexDirection: 'row', gap: 10 },
  seasonButton: { flex: 1, borderWidth: 1, borderColor: '#1A1A1A', borderRadius: 6, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F5F2EB' },
  seasonButtonActive: { backgroundColor: '#1A1A1A' },
  seasonButtonText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  seasonButtonTextActive: { color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F2EB', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: height * 0.7 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#D1CFC7' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#EBE8DF' },
  modalOptionText: { fontSize: 16, color: '#1A1A1A' },
  modalOptionTextActive: { fontWeight: '700', color: '#6A5ACD' }
});