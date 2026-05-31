import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Dimensions, Alert, ScrollView, Modal } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import ViewToggle from '../components/wardrobe/ViewToggle'; 
import { useProfile } from '../context/ProfileContext';
import { apiClient } from '../api/client';
import { useWardrobeItems } from '../hooks/useWardrobeItems';
import { useOutfits } from '../hooks/useOutfits';
import CategorySelector from '../components/wardrobe/CategorySelector';
import AnimatedInsiderButton from '../components/wardrobe/AnimatedInsiderButton';
import ItemsTabView from './wardrobe/ItemsTabView';
import OutfitsTabView from './wardrobe/OutfitsTabView';

const { width } = Dimensions.get('window');

export default function WardrobeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [outfitViewMode, setOutfitViewMode] = useState<'PIECES' | 'LOOKS'>('PIECES');

  const { profileImage, currentUserId } = useProfile();
  
  // 1. ITEMS HOOK'U (Kıyafetler)
  const { items, totalCount: itemsCount, isLoadingMore, fetchWardrobe, loadMoreItems } = useWardrobeItems(currentUserId);
  
  // 2. OUTFITS HOOK'U (İkili Sistem)
  const { 
    regularOutfits, regularTotalCount, isLoadingMoreRegular, fetchRegularOutfits, loadMoreRegular,
    lookbookOutfits, lookbookTotalCount, isLoadingMoreLookbook, fetchLookbooks, loadMoreLookbooks,
    fetchAllOutfits 
  } = useOutfits(currentUserId);

  // 🚀 MAIN TAB STATE GÜNCELLENDİ (4 SEKME)
  const [mainTab, setMainTab] = useState<'ITEMS' | 'OUTFITS' | 'MOODBOARDS' | 'CAPSULES'>('ITEMS');
  
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [newItemIds, setNewItemIds] = useState<number[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed'>('idle');

  // Yükleme Seçenek Menüsü (Modal) için state | state ekrandaki verileri tutan dinamik hafıza
  const [isUploadMenuVisible, setIsUploadMenuVisible] = useState(false);
  
  const loadingProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeCategory === 'ALL') {
      setDisplayItems(items);
    } else {
      setDisplayItems(items.filter(i => i.category?.toUpperCase() === activeCategory));
    }
  }, [activeCategory, items]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (mainTab === 'ITEMS') await fetchWardrobe(0, true);
    else if (mainTab === 'OUTFITS') await fetchRegularOutfits(0, true);
    else if (mainTab === 'MOODBOARDS') await fetchLookbooks(0, true);
    // CAPSULES yenilemesi eklenecek
    setRefreshing(false);
  }, [mainTab, fetchWardrobe, fetchRegularOutfits, fetchLookbooks]);

  useEffect(() => {
    fetchWardrobe(0, true);
    fetchAllOutfits(true); 
  }, [currentUserId]);

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

  // Kıyafet ekleme yerimiz
  // Artık dışarıdan 'flat_lay' veya 'on_body' modunu alıyor
  const pickAndUploadImage = async (uploadMode: 'flat_lay' | 'on_body') => {
    
    setIsUploadMenuVisible(false); // Modalı kapat
    
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, allowsMultipleSelection: true, selectionLimit: 5, quality: 0.8 }); // Seçim sayısını ve kalite ayarı 
    
    if (!result.canceled && result.assets.length > 0) {
      setUploadStatus('uploading'); 
      let successCount = 0; 
      const existingIdsBeforeUpload = new Set(items.map(i => i.id));
      
      for (let i = 0; i < result.assets.length; i++) {
        const imageUri = result.assets[i].uri;
        const formData = new FormData();
        formData.append('image', { uri: imageUri, name: `wardrobe_item_${i}.jpg`, type: 'image/jpeg' } as any);
        
        // Yapay zekaya (Python) çalışma modunu fısıldıyoruz
        formData.append('mode', uploadMode);

        try {
          const extractResponse = await apiClient.post(`/clothes/${currentUserId}/ai-extract`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (extractResponse.status === 202 || extractResponse.status === 200) {
            const taskId = extractResponse.data.task_id;
            let isDone = false;
            while (!isDone) {
              await new Promise(resolve => setTimeout(resolve, 3000));
              const statusResponse = await apiClient.get(`/clothes/${currentUserId}/ai-status/${taskId}`);
              const statusData = statusResponse.data;
              if (statusData.status === 'COMPLETED') { successCount++; isDone = true; } 
              else if (statusData.status === 'FAILURE') { isDone = true; }
            }
          }
        } catch (error) { console.error(`${i + 1}. fotoğraf yüklenirken hata oluştu:`, error); }
      }
      if (successCount > 0) {
        const freshItems = await fetchWardrobe(0, true); 
        if (freshItems) {
          const newlyAddedIds = freshItems.filter((item: any) => !existingIdsBeforeUpload.has(item.id)).map((item: any) => item.id);
          if (newlyAddedIds.length > 0) setNewItemIds(prev => [...prev, ...newlyAddedIds]); 
        }
        setUploadStatus('completed');
      } else {
        Alert.alert('Hata', 'Hiçbir fotoğraf işlenemedi.');
        setUploadStatus('idle');
      }
      setTimeout(() => { setUploadStatus('idle'); }, 2000);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {uploadStatus !== 'idle' && (
        <View style={[styles.loadingBanner, uploadStatus === 'completed' && { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.loadingBannerText, uploadStatus === 'completed' && { color: '#2E7D32' }]}>
            {uploadStatus === 'uploading' ? 'AI is processing items ⏳' : 'Completed! 🦋'}
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
        <AnimatedInsiderButton onPress={() => navigation.navigate('Shop')} />
        <MaterialCommunityIcons name="wave" size={30} color="#1A1A1A" />
      </View>

      {/* 🚀 KAYDIRILABİLİR 4'LÜ SEKME MENÜSÜ */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          <TouchableOpacity style={[styles.tabItem, mainTab === 'ITEMS' && styles.tabItemActive]} onPress={() => setMainTab('ITEMS')}>
            <Text style={[styles.tabTitle, mainTab === 'ITEMS' && styles.tabTitleActive]}>ITEMS</Text>
            <Text style={styles.tabCount}>({itemsCount})</Text> 
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.tabItem, mainTab === 'OUTFITS' && styles.tabItemActive]} onPress={() => setMainTab('OUTFITS')}>
            <Text style={[styles.tabTitle, mainTab === 'OUTFITS' && styles.tabTitleActive]}>OUTFITS</Text>
            <Text style={styles.tabCount}>({regularTotalCount})</Text> 
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.tabItem, mainTab === 'MOODBOARDS' && styles.tabItemActive]} onPress={() => setMainTab('MOODBOARDS')}>
            <Text style={[styles.tabTitle, mainTab === 'MOODBOARDS' && styles.tabTitleActive]}>MOODBOARDS</Text>
            <Text style={styles.tabCount}>({lookbookTotalCount})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tabItem, mainTab === 'CAPSULES' && styles.tabItemActive]} onPress={() => setMainTab('CAPSULES')}>
            <Text style={[styles.tabTitle, mainTab === 'CAPSULES' && styles.tabTitleActive]}>CAPSULES</Text>
            <Text style={styles.tabCount}>(0)</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {mainTab === 'ITEMS' && (
        <>
          <CategorySelector activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
          <ItemsTabView 
            items={displayItems} numColumns={numColumns} isLoadingMore={isLoadingMore} refreshing={refreshing}
            newItemIds={newItemIds} onRefresh={onRefresh} onEndReached={loadMoreItems}
            onItemPress={(item) => navigation.navigate('ItemDetail', { item })}
          />
        </>
      )}

{/* 🚀 REGULAR OUTFITS TABLO GÖRÜNÜMÜ */}
      {mainTab === 'OUTFITS' && (
        <OutfitsTabView 
          outfits={regularOutfits} 
          numColumns={numColumns} viewMode={outfitViewMode} isLoadingMore={isLoadingMoreRegular} refreshing={refreshing}
          onRefresh={onRefresh} onEndReached={loadMoreRegular}
          // 🚀 DEĞİŞTİRİLEN KISIM BURASI (Artık 3 parametre alıp detay ekranına 3'ünü yolluyor)
          onOutfitPress={(outfit, outfitList, index) => navigation.navigate('OutfitDetail', { outfit, outfitList, initialIndex: index })} 
          onTryOnNavigate={(clothes) => navigation.navigate('Style', { preselectedClothes: clothes })}
        />
      )}

      {/* 🚀 MOODBOARDS TABLO GÖRÜNÜMÜ */}
      {mainTab === 'MOODBOARDS' && (
        <OutfitsTabView 
          outfits={lookbookOutfits} 
          numColumns={numColumns} viewMode={outfitViewMode} isLoadingMore={isLoadingMoreLookbook} refreshing={refreshing}
          onRefresh={onRefresh} onEndReached={loadMoreLookbooks}
          // 🚀 DEĞİŞTİRİLEN KISIM BURASI
          onOutfitPress={(outfit, outfitList, index) => navigation.navigate('OutfitDetail', { outfit, outfitList, initialIndex: index })} 
          onTryOnNavigate={(clothes) => navigation.navigate('Style', { preselectedClothes: clothes })}
        />
      )}

      {/* 🚀 CAPSULES PLACEHOLDER EKRANI */}
      {mainTab === 'CAPSULES' && (
        <View style={styles.placeholderContainer}>
          <MaterialCommunityIcons name="bag-suitcase" size={60} color="#DDD" />
          <Text style={styles.placeholderTitle}>Travel Capsules</Text>
          <Text style={styles.placeholderSub}>Plan your trips and pack smart. Coming soon!</Text>
        </View>
      )}

      <View style={styles.floatingControls}>
        {(mainTab === 'ITEMS' || mainTab === 'OUTFITS' || mainTab === 'MOODBOARDS') && (
          <TouchableOpacity style={styles.gridToggleBtn} onPress={() => setNumColumns(numColumns === 2 ? 3 : 2)}>
            <Feather name={numColumns === 2 ? "grid" : "columns"} size={20} color="#1A1A1A" />
          </TouchableOpacity>
        )}
        {(mainTab === 'OUTFITS' || mainTab === 'MOODBOARDS') && (
          <ViewToggle activeView={outfitViewMode} onViewChange={setOutfitViewMode} />
        )}
      </View>

      {mainTab === 'ITEMS' && (
        <TouchableOpacity 
          style={styles.aiUploadButton} 
          activeOpacity={0.9} 
          onPress={() => setIsUploadMenuVisible(true)} // Tıklayınca direkt galeriyi değil, menüyü aç
        >
          <Feather name="plus" size={36} color="#E07A5F" />
        </TouchableOpacity>
      )}   

      {/* 🚀 YENİ: Vogue Stili Fotoğraf Yükleme Seçim Menüsü */}
      <Modal visible={isUploadMenuVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How are you uploading?</Text>
              <TouchableOpacity onPress={() => setIsUploadMenuVisible(false)} hitSlop={{top:20, bottom:20, left:20, right:20}}>
                <Feather name="x" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.uploadOptionsContainer}>
              <TouchableOpacity style={styles.uploadOptionCard} onPress={() => pickAndUploadImage('flat_lay')}>
                <MaterialCommunityIcons name="tshirt-crew-outline" size={36} color="#6A5ACD" />
                <Text style={styles.uploadOptionTitle}>Flat-Lay</Text>
                <Text style={styles.uploadOptionSub}>Items placed on a flat surface like a bed or table.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadOptionCard} onPress={() => pickAndUploadImage('on_body')}>
                <MaterialCommunityIcons name="mirror-rectangle" size={36} color="#E07A5F" />
                <Text style={styles.uploadOptionTitle}>On-Body</Text>
                <Text style={styles.uploadOptionSub}>Items extracted directly from a selfie or mirror photo.</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
      

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
  
  // 🚀 GÜNCELLENMİŞ YATAY SEKME STİLLERİ
  tabsContainer: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D1CFC7', backgroundColor: '#F5F2EB' },
  tabsScrollContent: { paddingHorizontal: 10 },
  tabItem: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  tabItemActive: { backgroundColor: '#EBE8DF', borderRadius: 12, marginVertical: 4 }, 
  tabTitle: { fontSize: 13, fontWeight: '700', color: '#888', letterSpacing: 0.5 },
  tabTitleActive: { color: '#1A1A1A', fontWeight: '900' }, 
  tabCount: { fontSize: 13, color: '#666', marginTop: 2, fontWeight: '600' },
  
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  placeholderTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 15, marginBottom: 5 },
  placeholderSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },

  floatingControls: { position: 'absolute', bottom: 100, right: 20, alignItems: 'flex-end', gap: 12, zIndex: 100 },
  gridToggleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  
  // 🚀 VİRGÜL HATASI BURADA DÜZELTİLDİ:
  aiUploadButton: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E07A5F', justifyContent: 'center', alignItems: 'center', shadowColor: '#E07A5F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },

  // 🚀 EKSİK MODAL STİLLERİ EKLENDİ:
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F2EB', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#D1CFC7' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

  uploadOptionsContainer: { padding: 20, gap: 15 },
  uploadOptionCard: { flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE8DF', borderRadius: 12, padding: 20, gap: 10 },
  uploadOptionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  uploadOptionSub: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 }
});