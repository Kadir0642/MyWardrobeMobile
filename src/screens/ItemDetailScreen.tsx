import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const COLOR_PALETTE = [
  '#000000', '#4A3B32', '#0000FF', '#8A2BE2', '#FF1493', '#FF4500', '#008000', 
  '#FFFF00', '#FF0000', '#808080', '#F5DEB3', '#FFFFFF', '#D3D3D3', '#B8860B'
];

// 🚀 AI'DAN GELEN KELİMELERİ BİZİM HEX KODLARINA ÇEVİREN SÖZLÜK
const AI_COLOR_MAP: Record<string, string> = {
  "black": "#000000", "brown": "#4A3B32", "blue": "#0000FF", "purple": "#8A2BE2", 
  "pink": "#FF1493", "orange": "#FF4500", "green": "#008000", "yellow": "#FFFF00", 
  "red": "#FF0000", "gray": "#808080", "beige": "#F5DEB3", "white": "#FFFFFF", 
  "silver": "#D3D3D3", "gold": "#B8860B", "multicolor": "#808080" // Multicolor gelirse gri seç
};


const CATEGORY_OPTIONS = ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories', 'Full_body'];

const SUBCATEGORY_OPTIONS = [
  'T-Shirt', 'Shirt', 'Sweater', 'Hoodie', 'Jacket', 'Coat', 'Vest', 
  'Jeans', 'Trousers', 'Shorts', 'Skirt', 'Dress', 'Jumpsuit',
  'Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals', 
  'Hat', 'Glasses', 'Bag', 'Watch', 'Jewelry', 'Belt', 'Scarf', 'Other'
];

const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Oversize', 'One Size'];
const CONDITION_OPTIONS = ['New with tags', 'Like New', 'Good', 'Fair', 'Vintage'];
const MATERIAL_OPTIONS = ['Cotton', 'Wool', 'Polyester', 'Denim', 'Leather', 'Silk', 'Linen', 'Nylon', 'Cashmere'];

// 🚀 AI ALT KATEGORİYİ BULDUĞUNDA, ANA KATEGORİYİ OTOMATİK TAHMİN EDEN FONKSİYON
const guessParentCategory = (subCat: string) => {
  const s = subCat.toLowerCase();
  if (['t-shirt', 'shirt', 'sweater', 'hoodie'].some(w => s.includes(w))) return 'Tops';
  if (['pants', 'jeans', 'trousers', 'shorts', 'skirt'].some(w => s.includes(w))) return 'Bottoms';
  if (['sneakers', 'boots', 'heels', 'flats', 'sandals'].some(w => s.includes(w))) return 'Footwear';
  if (['dress', 'jumpsuit'].some(w => s.includes(w))) return 'Full_body';
  if (['hat', 'glasses', 'sunglasses', 'bag', 'watch', 'jewelry', 'belt', 'scarf'].some(w => s.includes(w))) return 'Accessories';
  if (['jacket', 'coat', 'vest'].some(w => s.includes(w))) return 'Outerwear';
  return CATEGORY_OPTIONS[0]; // Bulamazsa Outerwear döner
};



export default function ItemDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const item = route.params?.item || { id: '1', image: '', brand: ''};

  const [activeTab, setActiveTab] = useState<'basic' | 'more' | 'measurement'>('basic');
  const [isSaving, setIsSaving] = useState(false);

  // 🚀 LÜKS AÇILIR MENÜ (MODAL) YÖNETİMİ (Size eklendi)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'category' | 'subCategory' | 'size' | 'condition' | 'material'>('category');

  const sanitizeInput = (text: string) => text.replace(/[<>{}\\]/g, ''); 

  // AI VERİLERİNİ UI VERİLERİNE ÇEVİRİYORUZ
  // 1. Kategori Düzeltmesi (Eğer AI "pants" olarak kaydettiyse, onu SubCategory'e kaydır)
  let initCategory = item.category || CATEGORY_OPTIONS[0];
  let initSubCategory = item.subCategory || 'Select Sub-Category';
  
  // Eğer initCategory küçük harfliyse veya bizim SUBCATEGORY listemize benziyorsa (Yani AI tahmini ise)
  const isAICategory = SUBCATEGORY_OPTIONS.some(sub => sub.toLowerCase() === initCategory.toLowerCase());
  if (isAICategory) {
    // "pants" kelimesini "Pants" yap ve SubCategory'e koy
    initSubCategory = initCategory.charAt(0).toUpperCase() + initCategory.slice(1); 
    // SubCategory'den yola çıkarak ana Kategoriyi "Bottoms" olarak bul!
    initCategory = guessParentCategory(initSubCategory); 
  }

  // 2. Renk Düzeltmesi (AI'ın "black" kelimesini "#000000" hex koduna çevir)
  const initialColors: string[] = [];
  if (item.color) {
    const rawColors = item.color.toLowerCase().split(',');
    rawColors.forEach((rc: string) => {
      const cleanColor = rc.trim();
      if (AI_COLOR_MAP[cleanColor]) {
        initialColors.push(AI_COLOR_MAP[cleanColor]); // AI "black" verdiyse -> Hex
      } else if (cleanColor.includes('#')) {
        initialColors.push(cleanColor); // Zaten Hex koduysa olduğu gibi al
      }
    });
  }

  // 3. Sezon Düzeltmesi ("winter" -> "WINTER")
  const initialSeasons = item.season ? item.season.toUpperCase().split(',').map((s: string) => s.trim()) : ['SPRING', 'FALL', 'WINTER'];
  
  // --- STATE TANIMLAMALARI (Düzeltilmiş verilerle başlıyoruz) ---
  const [brand, setBrand] = useState(item.brand || '');
  const [category, setCategory] = useState(initCategory);
  const [subCategory, setSubCategory] = useState(initSubCategory);
  const [size, setSize] = useState(item.size || 'Select Size'); 
  const [name, setName] = useState(item.name || item.brand || '');
  const [shoppingUrl, setShoppingUrl] = useState(item.shoppingUrl || '');
  const [selectedColors, setSelectedColors] = useState<string[]>(initialColors);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialSeasons);

  // --- MORE INFO STATE ---
  const [personalNote, setPersonalNote] = useState(item.personalNote || '');
  const [description, setDescription] = useState(item.description || '');
  const [condition, setCondition] = useState(item.condition || CONDITION_OPTIONS[0]);
  const [material, setMaterial] = useState(item.material || MATERIAL_OPTIONS[0]);
  const [origin, setOrigin] = useState(item.origin || '');

  const toggleColor = (color: string) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  const toggleSeason = (season: string) => setSelectedSeasons(prev => prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]);
  
  // Açılır menüyü tetikleyen fonksiyon
const openPicker = (type: 'category' | 'subCategory' | 'size' | 'condition' | 'material') => {
    setModalType(type);
    setModalVisible(true);
  };

  // Menüden seçim yapıldığında çalışacak fonksiyon
const handleSelectOption = (option: string) => {
    if (modalType === 'category') setCategory(option);
    if (modalType === 'subCategory') setSubCategory(option);
    if (modalType === 'size') setSize(option);
    if (modalType === 'condition') setCondition(option);
    if (modalType === 'material') setMaterial(option);
    setModalVisible(false);
  };

const getModalData = () => {
    switch(modalType) {
      case 'category': return CATEGORY_OPTIONS;
      case 'subCategory': return SUBCATEGORY_OPTIONS;
      case 'size': return SIZE_OPTIONS;
      case 'condition': return CONDITION_OPTIONS;
      case 'material': return MATERIAL_OPTIONS;
      default: return [];
    }
  };

const handleSave = async () => {
    setIsSaving(true);
    const updatedData = {
      brand: sanitizeInput(brand),
      category: category,
      subCategory: subCategory !== 'Select Sub-Category' ? subCategory : null, 
      size: size !== 'Select Size' ? size : null,
      name: sanitizeInput(name),
      color: selectedColors.join(','), // React Native Hex kodlarını Virgüllü kaydeder
      season: selectedSeasons.join(','),
      shoppingUrl: sanitizeInput(shoppingUrl),
      personalNote: sanitizeInput(personalNote),
      description: sanitizeInput(description),
      condition: condition,
      material: material,
      origin: sanitizeInput(origin),
    };

try {
      const response = await fetch(`http://10.87.14.78:8080/api/v1/clothes/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        Alert.alert("Başarılı! 🌿", "Kıyafet bilgileri güncellendi.");
        navigation.goBack(); 
      } else {
        Alert.alert("Kaydedilemedi", "Sunucu bir hata döndürdü.");
      }
    } catch (error) {
      console.error("Kaydetme Hatası:", error);
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
          <Feather name="arrow-left" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>EDIT ITEM</Text>
        
        <TouchableOpacity onPress={handleSave} disabled={isSaving} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
          {isSaving ? (
            <Text style={{ color: '#E07A5F', fontWeight: 'bold' }}>⏳</Text>
          ) : (
            <Feather name="check" size={26} color="#1A1A1A" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity style={[styles.tab, activeTab === 'basic' && styles.activeTab]} onPress={() => setActiveTab('basic')} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Text style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>BASIC INFO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'more' && styles.activeTab]} onPress={() => setActiveTab('more')} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Text style={[styles.tabText, activeTab === 'more' && styles.activeTabText]}>MORE INFO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'measurement' && styles.activeTab]} onPress={() => setActiveTab('measurement')} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Text style={[styles.tabText, activeTab === 'measurement' && styles.activeTabText]}>MEASURE</Text>
            </TouchableOpacity>
          </View>

          {/* 4A. BASIC INFO FORMU */}
          {activeTab === 'basic' && (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BRAND*</Text>
                <TextInput style={styles.inputField} value={brand} onChangeText={(t) => setBrand(sanitizeInput(t))} placeholder="E.g. Cos" placeholderTextColor="#AAA" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CATEGORY*</Text>
                {/* 🚀 Z-INDEX EKLENTİLERİ */}
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

              {/* 🚀 YENİ BEDEN (SIZE) AÇILIR MENÜSÜ */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SIZE</Text>
                <TouchableOpacity style={[styles.pickerButton, { zIndex: 10 }]} onPress={() => openPicker('size')} activeOpacity={0.7}>
                  <Text style={[styles.pickerText, size === 'Select Size' && {color: '#AAA'}]}>{size}</Text>
                  <Feather name="chevron-down" size={20} color="#AAA" />
                </TouchableOpacity>
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
                  {['FALL', 'WINTER'].map((s) => (
                    <TouchableOpacity key={s} onPress={() => toggleSeason(s)} style={[styles.seasonButton, selectedSeasons.includes(s) && styles.seasonButtonActive]}>
                      <Text style={[styles.seasonButtonText, selectedSeasons.includes(s) && styles.seasonButtonTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NAME</Text>
                <TextInput style={styles.inputField} value={name} onChangeText={(t) => setName(sanitizeInput(t))} placeholder="Enter description" placeholderTextColor="#AAA" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SHOPPING URL</Text>
                <TextInput style={styles.inputField} value={shoppingUrl} onChangeText={(t) => setShoppingUrl(sanitizeInput(t))} placeholder="https://" placeholderTextColor="#AAA" autoCapitalize="none" keyboardType="url" />
              </View>
            </View>
          )}

          {/* 4B. MORE INFO FORMU */}
          {activeTab === 'more' && (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PERSONAL NOTE</Text>
                <TextInput style={[styles.inputField, { height: 80, textAlignVertical: 'top' }]} multiline value={personalNote} onChangeText={(t) => setPersonalNote(sanitizeInput(t))} placeholder="Enter a personal note..." placeholderTextColor="#AAA" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ITEM DESCRIPTION</Text>
                <TextInput style={[styles.inputField, { height: 80, textAlignVertical: 'top' }]} multiline value={description} onChangeText={(t) => setDescription(sanitizeInput(t))} placeholder="Enter Item Description" placeholderTextColor="#AAA" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONDITION</Text>
                <TouchableOpacity style={[styles.pickerButton, { zIndex: 10 }]} onPress={() => openPicker('condition')} activeOpacity={0.7}>
                  <Text style={styles.pickerText}>{condition}</Text>
                  <Feather name="chevron-down" size={20} color="#AAA" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MATERIAL</Text>
                <TouchableOpacity style={[styles.pickerButton, { zIndex: 10 }]} onPress={() => openPicker('material')} activeOpacity={0.7}>
                  <Text style={styles.pickerText}>{material}</Text>
                  <Feather name="chevron-down" size={20} color="#AAA" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ORIGIN</Text>
                <TextInput style={styles.inputField} value={origin} onChangeText={(t) => setOrigin(sanitizeInput(t))} placeholder="E.g. Turkey, Italy" placeholderTextColor="#AAA" />
              </View>
            </View>
          )}

          {activeTab === 'measurement' && (
             <View style={styles.placeholderBox}>
               <Feather name="scissors" size={40} color="#D1CFC7" />
               <Text style={{color: '#888', marginTop: 10}}>Ölçü Formu Çok Yakında...</Text>
             </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

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
                    (item === category || item === subCategory || item === size || item === condition || item === material) && styles.modalOptionTextActive
                  ]}>{item}</Text>
                  {(item === category || item === subCategory || item === size || item === condition || item === material) && (
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
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  saveButton: { padding: 5 },
  imageContainer: { width: '100%', height: width * 1.1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#D1CFC7' },
  itemImage: { width: '90%', height: '90%', resizeMode: 'contain' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#EBE8DF', borderBottomWidth: 1, borderColor: '#D1CFC7' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: '#D1CFC7' },
  activeTab: { backgroundColor: '#E4DFD0' }, 
  tabText: { fontSize: 12, fontWeight: '600', color: '#888' },
  activeTabText: { color: '#6A5ACD', fontWeight: '800' },
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
  placeholderBox: { height: 200, borderWidth: 1, borderColor: '#D1CFC7', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', borderRadius: 8, margin: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F2EB', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: height * 0.7 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#D1CFC7' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#EBE8DF' },
  modalOptionText: { fontSize: 16, color: '#1A1A1A' },
  modalOptionTextActive: { fontWeight: '700', color: '#6A5ACD' }
});