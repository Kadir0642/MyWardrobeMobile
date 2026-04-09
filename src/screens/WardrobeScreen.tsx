import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Easing, Dimensions, FlatList, ScrollView, Alert, RefreshControl } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../context/ProfileContext';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100' },
  { id: 'Outerwear', label: 'Outerwear', icon: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100' },
  { id: 'Tops', label: 'Tops', icon: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=100' },
  { id: 'Bottoms', label: 'Bottoms', icon: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=100' },
  { id: 'Footwear', label: 'Footwear', icon: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=100' },
  { id: 'Accessories', label: 'Accessories', icon: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=100' },
  { id: 'Full_body', label: 'Full body', icon: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=100' },
];

const AnimatedInsiderButton = () => {
  const spinValue = useRef(new Animated.Value(0)).current;
useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    animation.start();
    // Bileşen ekrandan gidince animasyonu durdur!
    return () => animation.stop(); 
  }, []);
  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.insiderWrapper}>
      <Animated.View style={[styles.rotatingGradient, { transform: [{ rotate: spin }] }]}>
        <LinearGradient colors={['#FF007F', '#7F00FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF007F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <View style={styles.insiderInner}><Text style={styles.insiderText}>Insider</Text></View>
    </TouchableOpacity>
  );
};

export default function WardrobeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profileImage } = useProfile();
  
  const [activeCategory, setActiveCategory] = useState('all');
  
  // 🚀 YENİ MİMARİ: MASTER (Tüm Dolap) ve DİSPLAY (Ekranda Görünen)
  const [masterItems, setMasterItems] = useState<any[]>([]); 
  const [displayItems, setDisplayItems] = useState<any[]>([]); 
  
  // 🚀 NEW ETİKETİ KASASI (Asla silinmez, ta ki tıklanana kadar)
  const [newItemIds, setNewItemIds] = useState<string[]>([]);

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [numColumns, setNumColumns] = useState(2); 
  const [refreshing, setRefreshing] = useState(false);

  const loadingProgress = useRef(new Animated.Value(0)).current;

  // 1. JAVA'DAN TÜM DOLABI ÇEK (Sadece Refresh'te veya Geri Dönüşte çalışır)
  const fetchWardrobe = async () => {
    try {
      const response = await fetch('http://10.87.14.78:8080/api/v1/clothes/3');
      if (response.ok) {
        const data = await response.json();
        const formattedItems = data.map((item: any) => ({
          ...item,
          id: item.id.toString(),
          brand: item.brand || 'AI Processed', 
          likes: item.wearCount || 0,
          image: item.imageUrl,
        }));
        setMasterItems(formattedItems.reverse());
      }
    } catch (error) {
      console.error("Veri çekme hatası: ", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWardrobe();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWardrobe();
    setRefreshing(false);
  }, []);

  // 2. 🚀 IN-MEMORY FİLTRELEME MOTORU (Butona basıldığı an 0 saniyede çalışır)
  useEffect(() => {
    if (activeCategory === 'all') {
      setDisplayItems(masterItems);
    } else {
      // Hem tam eşleşmeyi (Kullanıcı seçtiyse) hem de AI'ın kaydettiği benzer isimleri yakala
      const filtered = masterItems.filter(item => {
        const cat = item.category?.toLowerCase() || '';
        const target = activeCategory.toLowerCase();
        
        // Eğer tam eşleşiyorsa
        if (cat === target) return true;
        
        // AI Eşleştirmeleri (Fallback)
        if (target === 'tops' && (cat.includes('shirt') || cat.includes('sweater') || cat.includes('hoodie'))) return true;
        if (target === 'bottoms' && (cat.includes('pants') || cat.includes('skirt') || cat.includes('shorts'))) return true;
        if (target === 'footwear' && (cat.includes('sneaker') || cat.includes('boot'))) return true;
        
        return false;
      });
      setDisplayItems(filtered);
    }
  }, [activeCategory, masterItems]); // Kategori değiştiğinde veya dolap güncellendiğinde tetiklenir


  useEffect(() => {
    if (uploadStatus === 'uploading') {
      Animated.loop(Animated.sequence([
        Animated.timing(loadingProgress, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(loadingProgress, { toValue: 0, duration: 1000, useNativeDriver: false })
      ])).start();
    } else if (uploadStatus === 'completed') {
      Animated.timing(loadingProgress, { toValue: 1, duration: 300, useNativeDriver: false }).start();
    } else {
      loadingProgress.setValue(0);
    }
  }, [uploadStatus]);

  const barWidth = loadingProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const pickAndUploadImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });

    if (!result.canceled) {
      setUploadStatus('uploading'); 
      const imageUri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('image', { uri: imageUri, name: 'wardrobe_item.jpg', type: 'image/jpeg' } as any);

      try {
        const extractResponse = await fetch('http://10.87.14.78:8080/api/v1/clothes/3/ai-extract', {
          method: 'POST', body: formData, headers: { 'Accept': 'application/json' },
        });

        const extractData = await extractResponse.json();

        if (extractResponse.ok && extractData.task_id) {
          const taskId = extractData.task_id;
          const checkInterval = setInterval(async () => {
            try {
              const statusResponse = await fetch(`http://10.87.14.78:8080/api/v1/clothes/3/ai-status/${taskId}`);
              const statusData = await statusResponse.json();

              if (statusData.status === 'COMPLETED') {
                clearInterval(checkInterval); 
                const savedItems = statusData.saved_items;
                
                if (savedItems && savedItems.length > 0) {
                   // 🚀 YENİ EKLENENLERİ KASAYA KAYDET
                   const newIds = savedItems.map((i: any) => i.id.toString());
                   setNewItemIds(prev => [...prev, ...newIds]);
                   
                   // Tüm dolabı yeniden çek ki ana listeye eklensinler
                   await fetchWardrobe(); 
                }
                
                setUploadStatus('completed');
                setTimeout(() => { setUploadStatus('idle'); }, 1500);
                
              } else if (statusData.status === 'FAILURE') {
                clearInterval(checkInterval); setUploadStatus('idle');
                Alert.alert("Hata", "Yapay zeka kıyafeti işleyemedi.");
              }
            } catch (err) {
               clearInterval(checkInterval); setUploadStatus('idle');
            }
          }, 3000); 
        } else {
          Alert.alert('Hata', 'Sisteme ulaşılamadı.'); setUploadStatus('idle');
        }
      } catch (error) { setUploadStatus('idle'); }
    }
  };

  const toggleGrid = () => { setNumColumns(numColumns === 2 ? 3 : 2); };

  const cardWidth = (width - 2) / numColumns; 

  const handleItemPress = (clickedItem: any) => {
    // 🚀 Tıklanan öğe kasadaysa (yeni ise), onu kasadan sil
    if (newItemIds.includes(clickedItem.id)) {
      setNewItemIds(prev => prev.filter(id => id !== clickedItem.id));
    }
    navigation.navigate('ItemDetail', { item: clickedItem });
  };

  const renderItem = ({ item }: any) => {
    // Bu kıyafetin ID'si Yeni Kasasında var mı?
    const isNewItem = newItemIds.includes(item.id);

    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => handleItemPress(item)}
        style={[styles.cardContainer, { width: cardWidth }, isNewItem && styles.newCardBorder]}
      >
        <View style={styles.cardImageWrapper}>
          <Image source={{ uri: item.image }} style={styles.cardImage} />
          {isNewItem && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          <View style={styles.likeContainer}>
            <Feather name="heart" size={18} color="#1A1A1A" />
            {item.likes > 0 && <Text style={styles.likeText}>{item.likes}</Text>}
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {uploadStatus !== 'idle' && (
        <View style={[styles.loadingBanner, uploadStatus === 'completed' && { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.loadingBannerText, uploadStatus === 'completed' && { color: '#2E7D32' }]}>
            {uploadStatus === 'uploading' ? 'Uploading items ⏳' : 'Completed! 🦋'}
          </Text>
          <View style={styles.loadingBarBackground}>
            <Animated.View style={[styles.loadingBarFill, { width: barWidth }, uploadStatus === 'completed' && { backgroundColor: '#4CAF50' }]} />
          </View>
        </View>
      )}

      <View style={styles.headerRow}>
        <Image source={profileImage ? { uri: profileImage } : { uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }} style={styles.headerProfileImage} />
        <Text style={styles.logoText}>VESTIFY</Text>
        <View style={styles.headerIcons}>
          <Feather name="bell" size={22} color="#1A1A1A" style={{ marginRight: 15 }} />
          <Ionicons name="stats-chart-outline" size={22} color="#1A1A1A" style={{ marginRight: 15 }} />
          <MaterialCommunityIcons name="view-dashboard-outline" size={24} color="#1A1A1A" />
        </View>
      </View>

      <View style={styles.insiderRow}>
        <MaterialCommunityIcons name="wave" size={30} color="#1A1A1A" style={{ transform: [{ scaleX: -1 }] }} />
        <AnimatedInsiderButton />
        <MaterialCommunityIcons name="wave" size={30} color="#1A1A1A" />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabTitle}>ITEMS</Text>
          <Text style={styles.tabCount}>({masterItems.length})</Text> 
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, styles.tabCenterBorder]}>
          <Text style={styles.tabTitle}>OUTFITS</Text>
          <Text style={styles.tabCount}>(0)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabTitle}>LOOKBOOKS</Text>
          <Text style={styles.tabCount}>(0)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryCircleWrapper} onPress={() => setActiveCategory(cat.id)}>
              <View style={[styles.categoryCircle, activeCategory === cat.id && styles.categoryCircleActive]}>
                <Image source={{ uri: cat.icon }} style={styles.categoryIcon} />
              </View>
              <Text style={[styles.categoryLabel, activeCategory === cat.id && styles.categoryLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.filterIconsBox}>
          <Feather name="heart" size={24} color="#1A1A1A" style={{ marginRight: 15 }} />
          <Feather name="sliders" size={24} color="#1A1A1A" />
        </View>
      </View>

      <FlatList
        key={numColumns} 
        data={displayItems} // 🚀 ARTIK FİLTRELENMİŞ LİSTEYİ GÖSTERİYORUZ
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        initialNumToRender={6} // İlk başta sadece 6 tane çiz
        maxToRenderPerBatch={4} // Kaydırdıkça 4'er 4'er çiz
        windowSize={5} // Ekranda görünmeyen eski resimleri hafızadan sil (Çok Önemli!)
        removeClippedSubviews={true} // Ekran dışı kalanları RAM'den düşür
        renderItem={renderItem}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E07A5F" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color="#D1CFC7" />
            <Text style={styles.emptyText}>Bu kategoride ürün bulunamadı.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.gridToggleBtn} activeOpacity={0.8} onPress={toggleGrid}>
        <Feather name={numColumns === 2 ? "grid" : "columns"} size={20} color="#1A1A1A" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.aiUploadButton} activeOpacity={0.9} onPress={pickAndUploadImage}>
        <Feather name="plus" size={36} color="#E07A5F" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2EB' },
  loadingBanner: { backgroundColor: '#EBE8DF', paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderColor: '#D1CFC7' },
  loadingBannerText: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4 },
  loadingBarBackground: { width: 60, height: 6, backgroundColor: '#D1CFC7', borderRadius: 3, overflow: 'hidden' },
  loadingBarFill: { height: '100%', backgroundColor: '#8A9A5B', borderRadius: 3 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerProfileImage: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#1A1A1A' },
  logoText: { fontSize: 28, fontWeight: '500', letterSpacing: 2, color: '#1A1A1A' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  insiderRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 15, gap: 10 },
  insiderWrapper: { width: 100, height: 36, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: '#DDD' },
  rotatingGradient: { position: 'absolute', width: 150, height: 150 },
  insiderInner: { width: 94, height: 30, backgroundColor: '#F5F2EB', justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
  insiderText: { fontSize: 13, fontWeight: '700', letterSpacing: 1, color: '#1A1A1A' },
  tabsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D1CFC7', backgroundColor: '#F5F2EB' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabCenterBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#D1CFC7' },
  tabTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  tabCount: { fontSize: 14, color: '#666', marginTop: 2 },
  categoriesRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#D1CFC7', backgroundColor: '#EBE8DF' },
  categoriesScroll: { paddingVertical: 10, paddingLeft: 10 },
  categoryCircleWrapper: { alignItems: 'center', marginRight: 15 },
  categoryCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#DDD', overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  categoryCircleActive: { borderColor: '#1A1A1A' },
  categoryIcon: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.8 },
  categoryLabel: { fontSize: 10, fontWeight: '600', color: '#666', marginTop: 4 },
  categoryLabelActive: { color: '#1A1A1A', fontWeight: '800' },
  filterIconsBox: { flexDirection: 'row', paddingHorizontal: 15, height: '100%', alignItems: 'center', borderLeftWidth: 1, borderColor: '#D1CFC7', backgroundColor: '#F5F2EB' },
  gridContainer: { paddingBottom: 100 }, 
  cardContainer: { margin: 1, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#D1CFC7' },
  newCardBorder: { borderColor: '#DFFF00', borderWidth: 2 },
  cardImageWrapper: { width: '100%', aspectRatio: 3/4, backgroundColor: '#F9F9F9' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  newBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#DFFF00', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, zIndex: 10 },
  newBadgeText: { fontSize: 9, fontWeight: '900', color: '#1A1A1A', letterSpacing: 0.5 },
  likeContainer: { position: 'absolute', top: 10, right: 10, alignItems: 'center' },
  likeText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', marginTop: 2 },
  cardFooter: { padding: 8, borderTopWidth: 1, borderColor: '#F0F0F0' },
  brandText: { fontSize: 11, fontWeight: '700', color: '#888' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 15, fontSize: 16, fontWeight: '600', color: '#888' },
  emptySubText: { marginTop: 5, fontSize: 13, color: '#AAA' },
  gridToggleBtn: { position: 'absolute', bottom: 105, right: 30, width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F2EB', borderWidth: 1, borderColor: '#D1CFC7', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  aiUploadButton: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E07A5F', justifyContent: 'center', alignItems: 'center', shadowColor: '#E07A5F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }
});