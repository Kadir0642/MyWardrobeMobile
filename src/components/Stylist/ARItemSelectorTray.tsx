import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import PremiumAlert from '../PremiumAlert';

const { width } = Dimensions.get('window');

interface ARItemSelectorTrayProps {
  allWardrobe: any[];
  allOutfits?: any[]; 
  setSelectedItems: (items: any[]) => void;
}

const CATEGORIES = ['ALL', 'TOPS', 'BOTTOMS', 'FOOTWEAR', 'OUTERWEAR', 'ACCESSORIES'];

export default function ARItemSelectorTray({ allWardrobe, allOutfits = [], setSelectedItems }: ARItemSelectorTrayProps) {
  const [activeTab, setActiveTab] = useState<'Shop' | 'Clothes' | 'Outfits'>('Clothes'); 
  const [activeCategory, setActiveCategory] = useState('ALL'); // 🚀 FİLTRELEME STATE'İ
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [shopAlertVisible, setShopAlertVisible] = useState(false);

  // 🚀 PERFORMANS: Sadece seçili kategorideki ürünleri hesapla
  const filteredWardrobe = useMemo(() => {
    if (activeCategory === 'ALL') return allWardrobe;
    return allWardrobe.filter(item => item.category?.toUpperCase() === activeCategory);
  }, [allWardrobe, activeCategory]);

  const toggleItemSelection = (item: any) => {
    setSelectedOutfitId(null); 
    let newSelectedIds = [...selectedIds];
    if (newSelectedIds.includes(item.id)) {
      newSelectedIds = newSelectedIds.filter(id => id !== item.id);
    } else {
      newSelectedIds.push(item.id);
    }
    setSelectedIds(newSelectedIds);
    const newSelectedItems = allWardrobe.filter(wardrobeItem => newSelectedIds.includes(wardrobeItem.id));
    setSelectedItems(newSelectedItems);
  };

  const handleOutfitSelection = (outfit: any) => {
    if (!outfit || !outfit.items) return;
    if (selectedOutfitId === outfit.id) {
      setSelectedOutfitId(null);
      setSelectedIds([]);
      setSelectedItems([]);
      return; 
    }
    setSelectedOutfitId(outfit.id);
    const outfitItemIds = outfit.items.map((item: any) => item.id);
    setSelectedIds(outfitItemIds);
    setSelectedItems(outfit.items);
  };

  const handleShopClick = () => setShopAlertVisible(true);

  // 🚀 FLATLIST RENDER FONKSİYONU (Kıyafetler İçin)
  const renderClothingItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.itemCard, selectedIds.includes(item.id) && styles.itemCardSelected]}
      activeOpacity={0.8}
      onPress={() => toggleItemSelection(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.itemImage} />
      <Text style={styles.itemBrandText} numberOfLines={1}>
        {item.brand ? item.brand.toUpperCase() : (item.category ? item.category.toUpperCase() : 'VESTIFY')}
      </Text>
      <TouchableOpacity style={styles.heartIcon} activeOpacity={0.7}>
        <MaterialCommunityIcons name="heart-outline" size={14} color="#666" />
      </TouchableOpacity>
      {selectedIds.includes(item.id) && (
        <View style={styles.checkBadge}>
            <MaterialCommunityIcons name="check-bold" size={14} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  // 🚀 FLATLIST RENDER FONKSİYONU (Kombinler İçin)
  const renderOutfitItem = ({ item: outfit }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.outfitCard, selectedOutfitId === outfit.id && styles.outfitCardSelected]}
      activeOpacity={0.8}
      onPress={() => handleOutfitSelection(outfit)}
    >
      <View style={styles.outfitPreview}>
        {outfit.items?.slice(0, 2).map((item: any, idx: number) => (
          <Image key={idx} source={{ uri: item.uri }} style={styles.outfitThumb} />
        ))}
        {outfit.items?.length > 2 && (
          <View style={styles.outfitMoreCount}>
            <Text style={styles.outfitMoreText}>+{outfit.items.length - 2}</Text>
          </View>
        )}
      </View>
      <View style={styles.outfitInfoContainer}>
        <Text style={styles.outfitName}>{outfit.name ? outfit.name : 'My Outfit'}</Text>
        <Text style={styles.outfitBrandText}>{outfit.items?.length || 0} Pieces • Vestify Look</Text>
      </View>
      {selectedOutfitId === outfit.id && (
        <View style={styles.checkBadge}>
            <MaterialCommunityIcons name="check-bold" size={14} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.trayContainer}>
      <PremiumAlert
        visible={shopAlertVisible}
        title="The Store Is Coming Soon.!"
        message="The store integration, which will allow you to purchase these amazing pieces you've tried and loved with a single click, will be active very soon."
        onCancel={() => setShopAlertVisible(false)}
        onConfirm={() => setShopAlertVisible(false)}
        confirmText="Got it"
        cancelText="Close"
        iconName="shopping-bag"
      />

      <View style={styles.tabBarContainer}>
        {['Shop', 'Clothes', 'Outfits'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => tab === 'Shop' ? handleShopClick() : setActiveTab(tab as any)}
          >
            {tab === 'Shop' && <Feather name="shopping-bag" size={20} color={activeTab === tab ? "#D4AF37" : "#A0A0A0"} />}
            {tab === 'Clothes' && <MaterialCommunityIcons name="wardrobe-outline" size={22} color={activeTab === tab ? "#D4AF37" : "#A0A0A0"} />}
            {tab === 'Outfits' && <MaterialCommunityIcons name="hanger" size={22} color={activeTab === tab ? "#D4AF37" : "#A0A0A0"} />}
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Shop' && (
        <View style={styles.premiumEmptyState}>
          <View style={styles.premiumIconCircle}>
            <MaterialCommunityIcons name="shopping-search" size={40} color="#D4AF37" />
          </View>
          <Text style={styles.premiumEmptyTitle}>Coming Soon</Text>
          <Text style={styles.premiumEmptyText}>We are working on this. We will keep you informed soon.</Text>
        </View>
      )}

{/* 🚀 YÜKSEK PERFORMANSLI OUTFITS SEKMESİ */}
      {activeTab === 'Outfits' && (
        <FlatList
          data={allOutfits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOutfitItem}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          
          // 🚀 MUAZZAM OPTİMİZASYON (Clothes sekmesindeki gibi)
          initialNumToRender={20} // İlk açılışta 20 tane yükler
          maxToRenderPerBatch={10} // Kaydırdıkça 10'ar 10'ar çizer (Telefonu kastırmaz)
          windowSize={5} // Ekranda görünmeyen üstteki kombinleri hafızadan siler!
          removeClippedSubviews={true} // Ekran dışı resimleri render etmeyi durdurur
          
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 40}}>
              <Text style={{color: '#666'}}>No outfits found. Create one from the Canvas tab!</Text>
            </View>
          }
        />
      )}

      {/* 🚀 YÜKSEK PERFORMANSLI CLOTHES SEKMESİ */}
      {activeTab === 'Clothes' && (
        <View style={{ flex: 1 }}>
          
          {/* 🚀 YENİ: Kategori Filtreleme Çubuğu */}
          <View style={styles.filterSortBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredWardrobe}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            renderItem={renderClothingItem}
            contentContainerStyle={styles.flatListContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15} // İlk açılışta sadece 15 parça yükler, kasmayı engeller
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trayContainer: { flex: 1 },
  tabBarContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EBE8DF', paddingHorizontal: 10 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#D4AF37' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#A0A0A0' },
  tabTextActive: { color: '#111', fontWeight: '800' },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 100, paddingTop: 15, gap: 15 },
  flatListContent: { paddingHorizontal: 15, paddingBottom: 100, paddingTop: 5 },
  columnWrapper: { justifyContent: 'flex-start', gap: 12, marginBottom: 12 },
  
  // 🚀 YENİ Kategori Filtre Stilleri
  filterSortBar: { flexDirection: 'row', marginBottom: 15, paddingHorizontal: 5, paddingVertical: 5 },
  categoryScroll: { paddingHorizontal: 10 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EBE8DF', marginRight: 8, borderWidth: 1, borderColor: '#D1CFC7' },
  categoryPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  categoryPillText: { fontSize: 11, fontWeight: '700', color: '#666' },
  categoryPillTextActive: { color: '#FFF' },

  // KART STİLLERİ
  itemCard: { width: (width * 0.9 - 24) / 3, height: (width * 0.9 - 24) / 3, borderRadius: 16, backgroundColor: '#2A2A2A', borderWidth: 2, borderColor: '#333333', overflow: 'hidden', padding: 6, justifyContent: 'space-between', alignItems: 'center' },
  itemCardSelected: { borderColor: '#84ef09', backgroundColor: '#334020' }, 
  itemImage: { width: '100%', height: '75%', resizeMode: 'contain' },
  itemBrandText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginTop: 2, textAlign: 'center', letterSpacing: 0.5 },
  heartIcon: { position: 'absolute', top: 6, right: 6, padding: 2 },
  checkBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#84ef09', borderRadius: 12, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2A2A2A' },
  outfitCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 15, borderWidth: 2, borderColor: '#EBE8DF', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  outfitCardSelected: { borderColor: '#D4AF37', backgroundColor: '#FAF8F5' },
  outfitPreview: { flexDirection: 'row', gap: -15, marginRight: 15 },
  outfitThumb: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', borderWidth: 2, borderColor: '#EBE8DF', resizeMode: 'cover' },
  outfitMoreCount: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1A1A1A', borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  outfitMoreText: { color: '#D4AF37', fontWeight: '800', fontSize: 12 },
  outfitInfoContainer: { flex: 1, flexDirection: 'column' },
  outfitName: { fontSize: 16, fontWeight: '700', color: '#111' },
  outfitBrandText: { fontSize: 11, fontWeight: '600', color: '#888', marginTop: 2 },
  premiumEmptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: -275 },
  premiumIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  premiumEmptyTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 40 },
  premiumEmptyText: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 }
});