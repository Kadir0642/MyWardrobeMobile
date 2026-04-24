import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, Image, Animated, Easing, Modal } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface DressMeTabProps {
  allWardrobe: {id: string, uri: string, category: string}[];
  is3DMode: boolean;
}

export default function DressMeTab({ allWardrobe, is3DMode }: DressMeTabProps) {
  const [activeDressMeLayout, setActiveDressMeLayout] = useState<0 | 1 | 2>(0);
  const [pinnedRows, setPinnedRows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRefs = useRef<{ [key: string]: ScrollView | null }>({});

  // 🚀 PREMIUM MODAL İÇİN YENİ STATE
  const [isAiTipVisible, setIsAiTipVisible] = useState(false);

  const [shuffledWardrobe, setShuffledWardrobe] = useState(allWardrobe);

  useEffect(() => {
    setShuffledWardrobe(allWardrobe);
  }, [allWardrobe]);

  const diceSpin = useRef(new Animated.Value(0)).current;

  const togglePin = (rowId: string) => {
    setPinnedRows(prev => prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]);
  };

  const shuffleArray = (array: any[]) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleDiceRoll = () => {
    setIsLoading(true);
    
    Animated.timing(diceSpin, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.back(1.5)), 
      useNativeDriver: true
    }).start(() => diceSpin.setValue(0)); 

    let newlyShuffledList = [...shuffledWardrobe];
    
    dressMeRows.forEach(row => {
      if (!pinnedRows.includes(row.id)) {
        const rowItems = newlyShuffledList.filter(i => (i.category || '').toUpperCase() === row.catName.toUpperCase());
        const mixedItems = shuffleArray(rowItems);
        
        newlyShuffledList = newlyShuffledList.map(item => {
          if ((item.category || '').toUpperCase() === row.catName.toUpperCase()) {
            return mixedItems.shift() || item; 
          }
          return item;
        });

        const ref = scrollViewRefs.current[row.id];
        if (ref) {
           ref.scrollTo({ x: 0, animated: true });
        }
      }
    });

    setShuffledWardrobe(newlyShuffledList);
    
    setTimeout(() => { setIsLoading(false); }, 600);
  };

  const getCategoryItems = (catName: string) => shuffledWardrobe.filter(item => (item.category || '').toUpperCase() === catName.toUpperCase());

  const DRESS_ME_LAYOUTS = [
    ['TOPS', 'BOTTOMS', 'FOOTWEAR', 'ACCESSORIES'],
    ['FULL BODY', 'FOOTWEAR', 'ACCESSORIES', 'ACCESSORIES'],
    ['OUTERWEAR', 'TOPS', 'BOTTOMS', 'FOOTWEAR', 'ACCESSORIES']
  ];

  const currentLayoutCategories = DRESS_ME_LAYOUTS[activeDressMeLayout];
  
  const dressMeRows = currentLayoutCategories.map((catName, index) => {
    return {
      id: `${catName.toLowerCase()}_${index}`,
      catName: catName, 
      data: getCategoryItems(catName)
    };
  }).filter(row => row.data.length > 0);

  const renderDressMeRow = (rowId: string, items: any[]) => (
    <View style={styles.dressMeRowContainer} key={rowId}>
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false} 
        snapToInterval={width} 
        decelerationRate="fast"
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

  const spinAngle = diceSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <>
      <ScrollView contentContainerStyle={styles.slotsContainer} showsVerticalScrollIndicator={false}>
        
        {/* 🚀 ÜST KONTROL SATIRI */}
        <View style={styles.topControlsRow}>
          
          <View style={styles.pinnedBadge}>
            <MaterialCommunityIcons name="pin" size={12} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
            <Text style={styles.pinnedBadgeText}>{pinnedRows.length} PINNED ITEMS</Text>
          </View>

          {/* PREMIUM BİLGİLENDİRME BUTONU */}
          <TouchableOpacity 
            style={styles.aiTipContainer} 
            activeOpacity={0.8}
            onPress={() => setIsAiTipVisible(true)}
          >
            <MaterialCommunityIcons name="butterfly" size={14} color="#1b1c19" />
            <Text style={styles.aiTipText}>Verify AI tags</Text>
          </TouchableOpacity>

        </View>

        {allWardrobe.length === 0 ? (
          <View style={styles.emptyWardrobeContainer}>
            <MaterialCommunityIcons name="hanger" size={48} color="#D1CFC7" />
            <Text style={styles.emptyWardrobeText}>Your wardrobe is currently empty.</Text>
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
              {isLoading ? (
                <ActivityIndicator color="#CCFF00" size="small" />
              ) : (
                <Animated.View style={{ transform: [{ rotate: spinAngle }] }}>
                  <MaterialCommunityIcons name="shuffle-variant" size={22} color="#CCFF00" />
                </Animated.View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.horizontalIconBtn} onPress={() => setActiveDressMeLayout(2)}>
              <MaterialCommunityIcons name="layers-triple-outline" size={24} color={activeDressMeLayout === 2 ? "#1A1A1A" : "#B0B0B0"} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 🚀 PREMIUM AI BİLGİLENDİRME MODALI (Tamamen İngilizce) */}
      <Modal visible={isAiTipVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalIconBox}>
              <MaterialCommunityIcons name="butterfly" size={32} color="#1b1c19" />
            </View>

            <Text style={styles.modalTitle}>✨ AI Tip ✨</Text>
            
            <Text style={styles.modalDescription}>
              AI automatically tags clothes but can rarely make mistakes.
              {"\n\n"}
              To provide you with perfect outfit suggestions, we recommend quickly checking the categories (Tops, Bottoms, etc.) of your items when uploading them. 
            </Text>

            <TouchableOpacity style={styles.modalGotItBtn} onPress={() => setIsAiTipVisible(false)} activeOpacity={0.8}>
              <Text style={styles.modalGotItText}>Got it!</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({
  slotsContainer: { paddingTop: 10, paddingBottom: 120 }, 
  
  topControlsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, alignItems: 'flex-start' },
  pinnedBadge: { flexDirection: 'row', backgroundColor: '#000000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4, alignItems: 'center' },
  pinnedBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  
  aiTipContainer: { flexDirection: 'row', backgroundColor: '#21bcf5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 6, alignItems: 'center' },
  aiTipText: { color: '#f8faf0', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

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

  // 🚀 YENİ PREMIUM MODAL STİLLERİ
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 25, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
  modalIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#21bcf5', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 15, letterSpacing: 0.5 },
  modalDescription: { fontSize: 14, fontWeight: '500', color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  modalGotItBtn: { backgroundColor: '#1A1A1A', width: '100%', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  modalGotItText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }
});