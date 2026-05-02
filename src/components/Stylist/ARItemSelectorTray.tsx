import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ARItemSelectorTrayProps {
  allWardrobe: any[];
  setSelectedItems: (items: any[]) => void;
}

export default function ARItemSelectorTray({ allWardrobe, setSelectedItems }: ARItemSelectorTrayProps) {
  const [activeTab, setActiveTab] = useState<'Shop' | 'Clothes' | 'Outfits'>('Clothes'); 
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 

  const toggleItemSelection = (item: any) => {
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

      {/* PREMİUM SEKMELER */}
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
            
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* FİLTRE VE SIRALAMA BARI */}
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

        {/* CLOTHES IZGARASI */}
        <View style={styles.gridList}>
          {allWardrobe.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.itemCard, selectedIds.includes(item.id) && styles.itemCardSelected]}
              activeOpacity={0.8}
              onPress={() => toggleItemSelection(item)}
            >
              <Image source={{ uri: item.uri }} style={styles.itemImage} />
              
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

  gridList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  itemCard: { 
    width: (width * 0.9 - 24) / 3, 
    height: (width * 0.9 - 24) / 3, 
    borderRadius: 20, 
    backgroundColor: '#2A2A2A', // Premium koyu kutu
    borderWidth: 2, 
    borderColor: '#333333', 
    overflow: 'hidden', 
    padding: 8, 
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemCardSelected: { borderColor: '#84ef09', backgroundColor: '#F4F7FE' }, // Seçilince parlar
  
  itemImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'contain', 
  },
  
  heartIcon: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.8)', padding: 4, borderRadius: 12 },
  checkBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#84ef09', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
});