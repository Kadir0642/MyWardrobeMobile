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

const CATEGORIES = ['TOPS', 'BOTTOMS', 'OUTERWEAR', 'FULL BODY'];

export default function ARItemSelectorTray({ allWardrobe, allOutfits = [], setSelectedItems }: ARItemSelectorTrayProps) {
  const [activeTab, setActiveTab] = useState<'Shop' | 'Clothes' | 'Outfits'>('Clothes'); 
  const [activeCategory, setActiveCategory] = useState('TOPS'); 
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [shopAlertVisible, setShopAlertVisible] = useState(false);
  
  // 🚀 YENİ STATE: Kombindeki çakışmaları düzelttiğimizde kullanıcıya bilgi vermek için
  const [conflictAlertVisible, setConflictAlertVisible] = useState(false);

  const filteredWardrobe = useMemo(() => {
    return allWardrobe.filter(item => item.category?.toUpperCase() === activeCategory);
  }, [allWardrobe, activeCategory]);

  // 🚀 AKILLI DEĞİŞTİRME (AUTO-SWAP) MANTIĞI
  const toggleItemSelection = (item: any) => {
    setSelectedOutfitId(null); 
    let newSelectedIds = [...selectedIds];
    const itemCategory = item.category?.toUpperCase();

    if (newSelectedIds.includes(item.id)) {
      // Zaten seçiliyse, sadece seçimi kaldır
      newSelectedIds = newSelectedIds.filter(id => id !== item.id);
    } else {
      // 🚀 YENİ SEÇİM: Kategori çakışmalarını önle
      const currentSelectedItems = allWardrobe.filter(w => newSelectedIds.includes(w.id));

      if (itemCategory === 'FULL BODY') {
         // Full body (Elbise) seçilirse Tops, Bottoms ve diğer Full Body'leri sil (Ceket kalabilir)
         const idsToRemove = currentSelectedItems
             .filter(w => ['TOPS', 'BOTTOMS', 'FULL BODY'].includes(w.category?.toUpperCase()))
             .map(w => w.id);
         newSelectedIds = newSelectedIds.filter(id => !idsToRemove.includes(id));
      }
      else if (itemCategory === 'TOPS' || itemCategory === 'BOTTOMS') {
         // Top veya Bottom seçilirse Full Body'yi ve AYNI kategorideki diğer ürünü sil
         const idsToRemove = currentSelectedItems
             .filter(w => w.category?.toUpperCase() === 'FULL BODY' || w.category?.toUpperCase() === itemCategory)
             .map(w => w.id);
         newSelectedIds = newSelectedIds.filter(id => !idsToRemove.includes(id));
      }
      else if (itemCategory === 'OUTERWEAR') {
         // Outerwear (Ceket) seçilirse diğer Outerwear'i sil
         const idsToRemove = currentSelectedItems
             .filter(w => w.category?.toUpperCase() === 'OUTERWEAR')
             .map(w => w.id);
         newSelectedIds = newSelectedIds.filter(id => !idsToRemove.includes(id));
      }

      newSelectedIds.push(item.id);
    }

    setSelectedIds(newSelectedIds);
    const newSelectedItems = allWardrobe.filter(wardrobeItem => newSelectedIds.includes(wardrobeItem.id));
    setSelectedItems(newSelectedItems);
  };

  // 🚀 KOMBİN (OUTFIT) İÇİN AKILLI FİLTRELEME
  const handleOutfitSelection = (outfit: any) => {
    if (!outfit || !outfit.items) return;
    if (selectedOutfitId === outfit.id) {
      setSelectedOutfitId(null);
      setSelectedIds([]);
      setSelectedItems([]);
      return; 
    }
    
    setSelectedOutfitId(outfit.id);

    const validItems = outfit.items.filter((item: any) => 
      item.category && CATEGORIES.includes(item.category.toUpperCase())
    );

    // Çakışmaları otomatik çöz
    const finalItems: any[] = [];
    let hasFullBody = false;
    let hasTop = false;
    let hasBottom = false;
    let hasOuterwear = false;
    let hasConflict = false; // Uyarı göstermek için

    // Önce Full Body var mı diye bakalım
    const fullBodyItem = validItems.find((i: any) => i.category?.toUpperCase() === 'FULL BODY');
    if (fullBodyItem) {
        finalItems.push(fullBodyItem);
        hasFullBody = true;
    }

    for (const item of validItems) {
        const cat = item.category?.toUpperCase();
        if (cat === 'FULL BODY') {
            if (item.id !== fullBodyItem?.id) hasConflict = true; 
            continue;
        }
        if (cat === 'TOPS') {
            if (hasFullBody || hasTop) { hasConflict = true; continue; } 
            finalItems.push(item);
            hasTop = true;
        }
        else if (cat === 'BOTTOMS') {
            if (hasFullBody || hasBottom) { hasConflict = true; continue; }
            finalItems.push(item);
            hasBottom = true;
        }
        else if (cat === 'OUTERWEAR') {
            if (hasOuterwear) { hasConflict = true; continue; }
            finalItems.push(item);
            hasOuterwear = true;
        }
    }

    const validItemIds = finalItems.map((item: any) => item.id);
    setSelectedIds(validItemIds);
    setSelectedItems(finalItems);

    // Eğer sistem fazla/çakışan kıyafetleri sildiyse kullanıcıya şık bir uyarı göster
    if (hasConflict) {
        setConflictAlertVisible(true);
    }
  };

  const handleShopClick = () => setShopAlertVisible(true);

  const renderClothingItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.itemCard, selectedIds.includes(item.id) && styles.itemCardSelected]}
      activeOpacity={0.8}
      onPress={() => toggleItemSelection(item)}
    >
      <Image source={{ uri: item.imageUrl || item.uri }} style={styles.itemImage} />
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

  const renderOutfitItem = ({ item: outfit }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.outfitCard, selectedOutfitId === outfit.id && styles.outfitCardSelected]}
      activeOpacity={0.8}
      onPress={() => handleOutfitSelection(outfit)}
    >
      <View style={styles.outfitPreview}>
        {outfit.items?.slice(0, 2).map((item: any, idx: number) => (
          <Image key={idx} source={{ uri: item.imageUrl || item.uri }} style={styles.outfitThumb} />
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
        title="The Store Is Coming Soon!"
        message="The store integration, which will allow you to purchase these amazing pieces you've tried and loved with a single click, will be active very soon."
        onCancel={() => setShopAlertVisible(false)}
        onConfirm={() => setShopAlertVisible(false)}
        confirmText="Got it"
        cancelText="Close"
        iconName="shopping-bag"
      />

      {/* 🚀 AKILLI SEÇİM BİLDİRİMİ */}
      <PremiumAlert
        visible={conflictAlertVisible}
        title="Smart Selection ✨"
        message="Kombindeki fazla/çakışan parçalar (örneğin Elbise ve Tişörtün aynı anda olması) sanal kabin kuralları gereği otomatik filtrelendi. En iyi görünüm için optimize edildi!"
        onCancel={() => setConflictAlertVisible(false)}
        onConfirm={() => setConflictAlertVisible(false)}
        confirmText="Harika"
        iconName="layers"
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

      {activeTab === 'Outfits' && (
        <FlatList
          data={allOutfits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOutfitItem}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20} 
          maxToRenderPerBatch={10} 
          windowSize={5} 
          removeClippedSubviews={true} 
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 40}}>
              <Text style={{color: '#666'}}>No outfits found. Create one from the Canvas tab!</Text>
            </View>
          }
        />
      )}

      {activeTab === 'Clothes' && (
        <View style={{ flex: 1 }}>
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
            initialNumToRender={15} 
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
  filterSortBar: { flexDirection: 'row', marginBottom: 15, paddingHorizontal: 5, paddingVertical: 5 },
  categoryScroll: { paddingHorizontal: 10 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EBE8DF', marginRight: 8, borderWidth: 1, borderColor: '#D1CFC7' },
  categoryPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  categoryPillText: { fontSize: 11, fontWeight: '700', color: '#666' },
  categoryPillTextActive: { color: '#FFF' },
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