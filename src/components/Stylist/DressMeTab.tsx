import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface DressMeTabProps {
  allWardrobe: any[];
  is3DMode: boolean;
}

export default function DressMeTab({ allWardrobe, is3DMode }: DressMeTabProps) {
  const [activeDressMeLayout, setActiveDressMeLayout] = useState<0 | 1 | 2>(0);
  const [pinnedRows, setPinnedRows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRefs = useRef<{ [key: string]: ScrollView | null }>({});

  const togglePin = (rowId: string) => {
    setPinnedRows(prev => prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]);
  };

  const handleDiceRoll = () => {
    setIsLoading(true);
    dressMeRows.forEach(row => {
      if (!pinnedRows.includes(row.id)) {
        const ref = scrollViewRefs.current[row.id];
        if (ref && row.data.length > 0) {
          const randomIndex = Math.floor(Math.random() * row.data.length);
          ref.scrollTo({ x: randomIndex * width, animated: true });
        }
      }
    });
    setTimeout(() => { setIsLoading(false); }, 800);
  };

  const getCategoryItems = (catName: string) => allWardrobe.filter(item => item.category === catName);

  const DRESS_ME_LAYOUTS = [
    ['Tops', 'Bottoms', 'Footwear','Accessories'],
    ['Full_body', 'Footwear', 'Accessories', 'Accessories', 'Accessories'],
    ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories', 'Accessories']
  ];

  const currentLayoutCategories = DRESS_ME_LAYOUTS[activeDressMeLayout];
  
  const dressMeRows = currentLayoutCategories.map((catName, index) => {
    return {
      id: `${catName.toLowerCase()}_${index}`,
      data: getCategoryItems(catName)
    };
  }).filter(row => row.data.length > 0);

  const renderDressMeRow = (rowId: string, items: any[]) => (
    <View style={styles.dressMeRowContainer} key={rowId}>
      <ScrollView 
        horizontal pagingEnabled showsHorizontalScrollIndicator={false} snapToInterval={width} decelerationRate="fast"
        ref={(el) => (scrollViewRefs.current[rowId] = el)} 
      >
        {items.map((item, index) => (
          <View key={`${rowId}-${item.id}-${index}`} style={styles.dressMeImageWrapper}>
            <Image source={{ uri: item.uri }} style={styles.dressMeItemImage} />
            <TouchableOpacity 
              style={[styles.pinIconContainer, pinnedRows.includes(rowId) && { backgroundColor: '#1A1A1A', borderRadius: 15 }]} 
              activeOpacity={0.7} onPress={() => togglePin(rowId)}
            >
              <MaterialCommunityIcons 
                name={pinnedRows.includes(rowId) ? "pin" : "pin-outline"} 
                size={22} 
                color={pinnedRows.includes(rowId) ? "#CCFF00" : "#1A1A1A"} 
                style={{ transform: [{ rotate: '45deg' }] }} 
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.slotsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.pinnedBadge}>
          <MaterialCommunityIcons name="pin" size={12} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
          <Text style={styles.pinnedBadgeText}>{pinnedRows.length} PINNED ITEMS</Text>
        </View>

        {allWardrobe.length === 0 ? (
          <View style={styles.emptyWardrobeContainer}>
            <MaterialCommunityIcons name="hanger" size={48} color="#D1CFC7" />
            <Text style={styles.emptyWardrobeText}>Dolabınız henüz boş.</Text>
          </View>
        ) : (
          <>{dressMeRows.map(row => renderDressMeRow(row.id, row.data))}</>
        )}
      </ScrollView>

      {!is3DMode && (
        <View style={styles.floatingPillContainer}>
          <View style={styles.floatingPillHorizontal}>
            <TouchableOpacity style={styles.horizontalIconBtn} onPress={() => setActiveDressMeLayout(0)}>
              <MaterialCommunityIcons name="layers-outline" size={22} color={activeDressMeLayout === 0 ? "#1A1A1A" : "#B0B0B0"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.horizontalIconBtn} onPress={() => setActiveDressMeLayout(1)}>
              <MaterialCommunityIcons name="human-male" size={24} color={activeDressMeLayout === 1 ? "#1A1A1A" : "#B0B0B0"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.generateOutfitBtnHorizontal} onPress={handleDiceRoll} activeOpacity={0.8}>
              {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : <MaterialCommunityIcons name="shuffle-variant" size={22} color="#FFFFFF" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.horizontalIconBtn} onPress={() => setActiveDressMeLayout(2)}>
              <MaterialCommunityIcons name="layers-triple-outline" size={24} color={activeDressMeLayout === 2 ? "#1A1A1A" : "#B0B0B0"} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  slotsContainer: { paddingTop: 10, paddingBottom: 120 }, 
  pinnedBadge: { flexDirection: 'row', backgroundColor: '#000000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start', marginLeft: 20, marginBottom: 10, gap: 4, alignItems: 'center' },
  pinnedBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  dressMeRowContainer: { width: width, height: height * 0.16, marginBottom: 10 },
  dressMeImageWrapper: { width: width, height: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  dressMeItemImage: { width: '40%', height: '90%', resizeMode: 'contain' }, 
  pinIconContainer: { position: 'absolute', top: 5, right: width * 0.30, padding: 5 }, 
  emptyWardrobeContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyWardrobeText: { fontSize: 16, color: '#888', marginTop: 10 },
  floatingPillContainer: { position: 'absolute', bottom: 25, width: '100%', alignItems: 'center', zIndex: 100 },
  floatingPillHorizontal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 40, paddingHorizontal: 20, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 15, gap: 20 },
  horizontalIconBtn: { padding: 8 },
  generateOutfitBtnHorizontal: { backgroundColor: '#1A1A1A', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});