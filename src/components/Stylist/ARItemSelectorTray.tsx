import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ARItemSelectorTrayProps {
  allWardrobe: any[];
  allOutfits?: any[]; 
  setSelectedItems: (items: any[]) => void;
}

export default function ARItemSelectorTray({ allWardrobe, allOutfits = [], setSelectedItems }: ARItemSelectorTrayProps) {
  const [activeTab, setActiveTab] = useState<'Shop' | 'Clothes' | 'Outfits'>('Clothes'); 
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);

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
    
    setSelectedOutfitId(outfit.id);
    
    const outfitItemIds = outfit.items.map((item: any) => item.id);
    setSelectedIds(outfitItemIds);
    setSelectedItems(outfit.items);
  };

  const handleShopClick = () => {
    setActiveTab('Shop');
    Alert.alert(
      "Shop Feature",
      "We are working on this. We will keep you informed soon.",
      [{ text: "OK", onPress: () => setActiveTab('Clothes') }] 
    );
  };

  return (
    <View style={styles.trayContainer}>
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

      {/* SHOP SEKMESİ */}
      {activeTab === 'Shop' && (
        <View style={styles.premiumEmptyState}>
          <View style={styles.premiumIconCircle}>
            <MaterialCommunityIcons name="shopping-search" size={40} color="#D4AF37" />
          </View>
          <Text style={styles.premiumEmptyTitle}>Coming Soon</Text>
          <Text style={styles.premiumEmptyText}>We are working on this. We will keep you informed soon.</Text>
        </View>
      )}

      {/* 🚀 OUTFITS SEKMESİ (KULLANICININ VERDİĞİ İSİMLE LİSTELENİR) */}
      {activeTab === 'Outfits' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.outfitGrid}>
            {allOutfits.length === 0 ? (
              <View style={{alignItems: 'center', marginTop: 40}}>
                <Text style={{color: '#666'}}>No outfits found. Create one from the Canvas tab!</Text>
              </View>
            ) : (
              allOutfits.map((outfit) => (
                <TouchableOpacity 
                  key={outfit.id} 
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
                  
                  {/* 🚀 KOMBİN İSMİ: Kullanıcı ne yazdıysa o (outfit.name) */}
                  <View style={styles.outfitInfoContainer}>
                    <Text style={styles.outfitName}>
                      {outfit.name ? outfit.name : 'My Outfit'}
                    </Text>
                    <Text style={styles.outfitBrandText}>{outfit.items?.length || 0} Pieces • Vestify Look</Text>
                  </View>

                  {selectedOutfitId === outfit.id && (
                    <View style={styles.checkBadge}>
                       <MaterialCommunityIcons name="check-bold" size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* 🚀 CLOTHES SEKMESİ (KULLANICININ GİRDİĞİ MARKA İLE LİSTELENİR) */}
      {activeTab === 'Clothes' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.filterSortBar}>
            <TouchableOpacity style={styles.sortButton} activeOpacity={0.7}>
              <Text style={styles.filterSortText}>Sort</Text>
              <MaterialCommunityIcons name="sort-variant" size={18} color="#D4AF37" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
              <MaterialCommunityIcons name="filter-variant" size={18} color="#D4AF37" />
              <Text style={styles.filterSortText}>Filter (747)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridList}>
            {allWardrobe.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.itemCard, selectedIds.includes(item.id) && styles.itemCardSelected]}
                activeOpacity={0.8}
                onPress={() => toggleItemSelection(item)}
              >
                <Image source={{ uri: item.uri }} style={styles.itemImage} />
                
                {/* 🚀 MARKA YAZISI: Kullanıcı ne girdiyse (item.brand), BÜYÜK HARFLE ve şık bir şekilde! */}
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
            ))}
          </View>
        </ScrollView>
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
  scrollContent: { paddingHorizontal: 15, paddingBottom: 100, paddingTop: 15 },
  
  filterSortBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 5 },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#EBE8DF' },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#EBE8DF' },
  filterSortText: { fontSize: 13, fontWeight: '700', color: '#111' },

  // 🚀 CLOTHES KARTLARI
  gridList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  itemCard: { 
    width: (width * 0.9 - 24) / 3, 
    height: (width * 0.9 - 24) / 3, 
    borderRadius: 16, 
    backgroundColor: '#2A2A2A', 
    borderWidth: 2, 
    borderColor: '#333333', 
    overflow: 'hidden', 
    padding: 6, 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  itemCardSelected: { borderColor: '#84ef09', backgroundColor: '#334020' }, 
  itemImage: { width: '100%', height: '75%', resizeMode: 'contain' },
  itemBrandText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginTop: 2, textAlign: 'center', letterSpacing: 0.5 },
  heartIcon: { position: 'absolute', top: 6, right: 6, padding: 2 },
  checkBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#84ef09', borderRadius: 12, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2A2A2A' },

  // 🚀 OUTFITS KARTLARI
  outfitGrid: { flexDirection: 'column', gap: 15 },
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