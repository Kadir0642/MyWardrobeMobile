import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Dimensions, Alert } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import ViewToggle from '../components/wardrobe/ViewToggle'; 

// 🚀 İMPORTLARIMIZ
import { useProfile } from '../context/ProfileContext';
import { apiClient } from '../api/client';
import { useWardrobeItems } from '../hooks/useWardrobeItems';
import { useOutfits } from '../hooks/useOutfits';

// 🚀 BİLEŞENLER VE EKRANLAR
import CategorySelector from '../components/wardrobe/CategorySelector';
import AnimatedInsiderButton from '../components/wardrobe/AnimatedInsiderButton';
import ItemsTabView from './wardrobe/ItemsTabView';
import OutfitsTabView from './wardrobe/OutfitsTabView';

const { width } = Dimensions.get('window');

export default function WardrobeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  
  // 🚀 YENİ STATE: Görünüm Modu
  const [outfitViewMode, setOutfitViewMode] = useState<'PIECES' | 'LOOKS'>('PIECES');

  // 🚀 1. GLOBAL USER ID
  const { profileImage, currentUserId } = useProfile();
  
  // 🚀 2. CUSTOM HOOKLAR 
  const { items, totalCount: itemsCount, isLoadingMore, fetchWardrobe, loadMoreItems } = useWardrobeItems(currentUserId);
  const { outfits, totalCount: outfitsCount, isLoadingMore: isLoadingOutfits, fetchOutfits, loadMoreOutfits } = useOutfits(currentUserId);

  // 🚀 3. UI STATE'LERİ
  const [mainTab, setMainTab] = useState<'ITEMS' | 'OUTFITS' | 'LOOKBOOKS'>('ITEMS');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [newItemIds, setNewItemIds] = useState<number[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed'>('idle');
  
  const loadingProgress = useRef(new Animated.Value(0)).current;

  // Filtreleme Mantığı
  useEffect(() => {
    if (activeCategory === 'ALL') {
      setDisplayItems(items);
    } else {
      setDisplayItems(items.filter(i => i.category?.toUpperCase() === activeCategory));
    }
  }, [activeCategory, items]);

  // Yenileme Mantığı
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (mainTab === 'ITEMS') {
      await fetchWardrobe(0, true);
    } else if (mainTab === 'OUTFITS') {
      await fetchOutfits(0, true);
    }
    setRefreshing(false);
  }, [mainTab, fetchWardrobe, fetchOutfits]);

  // Sayfa Yüklendiğinde
  useEffect(() => {
    fetchWardrobe(0, true);
    fetchOutfits(0, true);
  }, [currentUserId]);

  // Animasyon Kontrolü
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

  // 🚀 GÖRSEL YÜKLEME VE POLLING MANTIĞI
  const pickAndUploadImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['images'], 
      allowsEditing: false, 
      allowsMultipleSelection: true, 
      selectionLimit: 5,             
      quality: 0.8 
    });

    if (!result.canceled && result.assets.length > 0) {
      setUploadStatus('uploading'); 
      let successCount = 0; 
      const existingIdsBeforeUpload = new Set(items.map(i => i.id));

      for (let i = 0; i < result.assets.length; i++) {
        const imageUri = result.assets[i].uri;
        const formData = new FormData();
        formData.append('image', { uri: imageUri, name: `wardrobe_item_${i}.jpg`, type: 'image/jpeg' } as any);

        try {
          const extractResponse = await apiClient.post(`/clothes/${currentUserId}/ai-extract`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (extractResponse.status === 202 || extractResponse.status === 200) {
            const taskId = extractResponse.data.task_id;
            let isDone = false;
            
            while (!isDone) {
              await new Promise(resolve => setTimeout(resolve, 3000));
              const statusResponse = await apiClient.get(`/clothes/${currentUserId}/ai-status/${taskId}`);
              const statusData = statusResponse.data;

              if (statusData.status === 'COMPLETED') {
                successCount++;
                isDone = true; 
              } else if (statusData.status === 'FAILURE') {
                isDone = true; 
              }
            }
          }
        } catch (error) { 
          console.error(`${i + 1}. fotoğraf yüklenirken hata oluştu:`, error);
        }
      }

      if (successCount > 0) {
        const freshItems = await fetchWardrobe(0, true); 
        if (freshItems) {
          const newlyAddedIds = freshItems
            .filter((item: any) => !existingIdsBeforeUpload.has(item.id))
            .map((item: any) => item.id);
            
          if (newlyAddedIds.length > 0) {
            setNewItemIds(prev => [...prev, ...newlyAddedIds]); 
          }
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
      
      {/* 🚀 ÜST YÜKLEME BANNERI */}
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

      {/* 🚀 HEADER */}
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

      {/* 🚀 TAB SEÇİCİ */}
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tabItem, mainTab === 'ITEMS' && styles.tabItemActive]} onPress={() => setMainTab('ITEMS')}>
          <Text style={[styles.tabTitle, mainTab === 'ITEMS' && styles.tabTitleActive]}>ITEMS</Text>
          <Text style={styles.tabCount}>({itemsCount})</Text> 
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabItem, styles.tabCenterBorder, mainTab === 'OUTFITS' && styles.tabItemActive]} onPress={() => setMainTab('OUTFITS')}>
          <Text style={[styles.tabTitle, mainTab === 'OUTFITS' && styles.tabTitleActive]}>OUTFITS</Text>
          <Text style={styles.tabCount}>({outfitsCount})</Text> 
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabItem, mainTab === 'LOOKBOOKS' && styles.tabItemActive]} onPress={() => setMainTab('LOOKBOOKS')}>
          <Text style={[styles.tabTitle, mainTab === 'LOOKBOOKS' && styles.tabTitleActive]}>LOOKBOOKS</Text>
          <Text style={styles.tabCount}>(0)</Text>
        </TouchableOpacity>
      </View>

      {/* 🚀 İÇERİK ALANI */}
      {mainTab === 'ITEMS' && (
        <>
          <CategorySelector activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
          <ItemsTabView 
            items={displayItems} 
            numColumns={numColumns} 
            isLoadingMore={isLoadingMore}
            refreshing={refreshing}
            newItemIds={newItemIds}
            onRefresh={onRefresh}
            onEndReached={loadMoreItems}
            onItemPress={(item) => navigation.navigate('ItemDetail', { item })}
          />
        </>
      )}

      {mainTab === 'OUTFITS' && (
        <OutfitsTabView 
          outfits={outfits} 
          numColumns={numColumns}
          viewMode={outfitViewMode} 
          isLoadingMore={isLoadingOutfits}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={loadMoreOutfits}
          onOutfitPress={(outfit) => navigation.navigate('OutfitDetail', { outfit })}
          // 🚀 YENİ (DOĞRU) HALİ: Doğrudan StylistScreen'e yolluyoruz.
          // ARTryOnTab.tsx bir "ekran" (screen) değil, 
          // StylistScreen'in içinde çağrılan bir bileşen (component). 
          // Bu yüzden doğrudan onun içine yönlendirme yapamayız.
          // (TabNavigator'daki gerçek adı: 'Style')
          onTryOnNavigate={(clothes) => navigation.navigate('Style', { preselectedClothes: clothes })}
        />
      )}

      {mainTab === 'LOOKBOOKS' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
           <Text style={{ color: '#888', fontSize: 16 }}>Lookbooks çok yakında burada olacak!</Text>
        </View>
      )}

      {/* 🚀 SAĞ ALT YÜZEN KONTROL GRUBU (Tüm Yüzen Butonlar Burada) */}
      <View style={styles.floatingControls}>

              {/* Her iki sekmede de görünen Grid ızgara düğmesi */}
        {(mainTab === 'ITEMS' || mainTab === 'OUTFITS') && (
          <TouchableOpacity style={styles.gridToggleBtn} onPress={() => setNumColumns(numColumns === 2 ? 3 : 2)}>
            <Feather name={numColumns === 2 ? "grid" : "columns"} size={20} color="#1A1A1A" />
          </TouchableOpacity>
        )}
        
        {/* Sadece OUTFITS sekmesinde görünen görünüm anahtarı */}
        {mainTab === 'OUTFITS' && (
          <ViewToggle activeView={outfitViewMode} onViewChange={setOutfitViewMode} />
        )}
  
      </View>

      {/* 🚀 PLUS YÜKLEME BUTONU (Sadece ITEMS Sekmesinde) */}
      {mainTab === 'ITEMS' && (
        <TouchableOpacity style={styles.aiUploadButton} activeOpacity={0.9} onPress={pickAndUploadImage}>
          <Feather name="plus" size={36} color="#E07A5F" />
        </TouchableOpacity>
      )}    

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
  tabsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D1CFC7', backgroundColor: '#F5F2EB' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabItemActive: { backgroundColor: '#EBE8DF' }, 
  tabCenterBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#D1CFC7' },
  tabTitle: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTitleActive: { color: '#1A1A1A', fontWeight: '800' }, 
  tabCount: { fontSize: 14, color: '#666', marginTop: 2 },
  
  // 🚀 DÜZELTİLMİŞ VE TEKİLLEŞTİRİLMİŞ YÜZEN KONTROL STİLLERİ
  floatingControls: { position: 'absolute', bottom: 100, right: 20, alignItems: 'flex-end', gap: 12, zIndex: 100 },
  gridToggleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  aiUploadButton: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E07A5F', justifyContent: 'center', alignItems: 'center', shadowColor: '#E07A5F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }
});