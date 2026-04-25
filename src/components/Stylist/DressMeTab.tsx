import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, Image, Animated, Easing, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

import { apiClient } from '../../api/client';
import PremiumToast from '../PremiumToast'; 

const { width, height } = Dimensions.get('window');
const CURRENT_USER_ID = 1; 

interface DressMeTabProps {
  allWardrobe: {id: string, uri: string, category: string}[];
  is3DMode: boolean;
}

const AVAILABLE_CATEGORIES = ['TOPS', 'BOTTOMS', 'FOOTWEAR', 'ACCESSORIES', 'OUTERWEAR', 'FULL BODY'];

export default function DressMeTab({ allWardrobe, is3DMode }: DressMeTabProps) {
  const [dynamicSlots, setDynamicSlots] = useState<{id: string, category: string}[]>([
    { id: `slot_tops_${Date.now()}`, category: 'TOPS' },
    { id: `slot_bottoms_${Date.now()+1}`, category: 'BOTTOMS' },
    { id: `slot_footwear_${Date.now()+2}`, category: 'FOOTWEAR' }
  ]);

  const [pinnedRows, setPinnedRows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRefs = useRef<{ [key: string]: ScrollView | null }>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const [isAiTipVisible, setIsAiTipVisible] = useState(false);
  const [isAddMenuVisible, setIsAddMenuVisible] = useState(false); 
  
  const diceSpin = useRef(new Animated.Value(0)).current;
  const [visibleItemIds, setVisibleItemIds] = useState<{ [slotId: string]: string }>({});

  useEffect(() => {
    const initialVisibleItems: any = {};
    dynamicSlots.forEach(slot => {
        const catItems = allWardrobe.filter(item => (item.category || '').toUpperCase() === slot.category);
        if(catItems.length > 0) {
            initialVisibleItems[slot.id] = catItems[0].id;
        }
    });
    setVisibleItemIds(initialVisibleItems);
  }, [allWardrobe]);

  const addSlot = (category: string) => {
    const newSlot = { id: `slot_${category.toLowerCase()}_${Date.now()}`, category };
    setDynamicSlots([...dynamicSlots, newSlot]);
    setIsAddMenuVisible(false);
    
    const catItems = allWardrobe.filter(item => (item.category || '').toUpperCase() === category);
    if(catItems.length > 0) {
        setVisibleItemIds(prev => ({...prev, [newSlot.id]: catItems[0].id}));
    }
  };

  const removeSlot = (slotId: string) => {
    setDynamicSlots(dynamicSlots.filter(slot => slot.id !== slotId));
    setPinnedRows(pinnedRows.filter(id => id !== slotId));
    
    const newVisibleItems = {...visibleItemIds};
    delete newVisibleItems[slotId];
    setVisibleItemIds(newVisibleItems);
  };

  const togglePin = (rowId: string) => {
    setPinnedRows(prev => prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]);
  };

  // 🚀 ARTIK SHUFFLEDWARDROBE KULLANMIYORUZ! Doğrudan ana listeyi okuyoruz.
  const getCategoryItems = (catName: string) => allWardrobe.filter(item => (item.category || '').toUpperCase() === catName.toUpperCase());

  // 🚀 ZEKİ ZAR ATMA (İNDEK HAVUZU) MANTIĞI BURADA!
  const handleDiceRoll = () => {
    setIsLoading(true);
    Animated.timing(diceSpin, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }).start(() => diceSpin.setValue(0)); 

    const newVisibleItems = { ...visibleItemIds };
    
    // Her kategori için bir sayı torbası oluşturuyoruz
    const categoryIndexPools: { [key: string]: number[] } = {};
    
    dynamicSlots.forEach(slot => {
      if (!pinnedRows.includes(slot.id)) {
        const category = (slot.category || '').toUpperCase();
        const items = getCategoryItems(category);
        const itemCount = items.length;

        if (itemCount > 0) {
          // Eğer torba henüz oluşmadıysa içine 0'dan itemCount'a kadar sayıları at ve karıştır
          if (!categoryIndexPools[category]) {
            let indices = Array.from({ length: itemCount }, (_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            categoryIndexPools[category] = indices;
          }

          // Torbadan bir sayı (indeks) çek! Torba bittiyse rastgele sayı ver.
          let targetIndex = 0;
          if (categoryIndexPools[category].length > 0) {
            targetIndex = categoryIndexPools[category].pop()!; // Çekilen sayıyı torbadan sil
          } else {
            targetIndex = Math.floor(Math.random() * itemCount);
          }

          // ScrollView'ı fiziksel olarak o indekse kaydır (Slot makinesi efekti!)
          const ref = scrollViewRefs.current[slot.id];
          if (ref) {
            ref.scrollTo({ x: targetIndex * width, animated: true });
          }

          // Ekranda görünen yeni item'i hafızaya al
          newVisibleItems[slot.id] = items[targetIndex].id;
        }
      }
    });

    setVisibleItemIds(newVisibleItems);
    setTimeout(() => { setIsLoading(false); }, 600);
  };

  const handleSaveOutfit = async () => {
    const currentOutfitIds = Object.values(visibleItemIds).filter(id => id !== undefined);

    if (currentOutfitIds.length === 0) {
      Alert.alert("Eksik", "Kombin oluşturmak için en az 1 parça seçmelisiniz.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: `My Canvas Creation`, 
        clothingItemIds: currentOutfitIds.map(id => parseInt(id, 10)) 
      };

      await apiClient.post(`/outfits/${CURRENT_USER_ID}/save`, payload);   // Kombin kaydetme
      setToastVisible(true); 

    } catch (error) {
      console.error("Kombin kaydedilemedi", error);
      Alert.alert("Hata", "Kombin kaydedilirken bir sorun oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMomentumScrollEnd = (event: any, slotId: string, items: any[]) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / width);
      if(items[index]){
          setVisibleItemIds(prev => ({...prev, [slotId]: items[index].id}));
      }
  };

  const renderDressMeRow = (slotId: string, category: string) => {
    const items = getCategoryItems(category);
    if (items.length === 0) return null;

    return (
      <View style={styles.dressMeRowContainer} key={slotId}>
        <TouchableOpacity style={styles.removeSlotBtn} onPress={() => removeSlot(slotId)}>
            <Feather name="x" size={16} color="#888" />
        </TouchableOpacity>

        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false} 
          snapToInterval={width} 
          decelerationRate="fast"
          ref={(el) => (scrollViewRefs.current[slotId] = el)}
          onMomentumScrollEnd={(e) => handleMomentumScrollEnd(e, slotId, items)}
        >
          {items.map((item, index) => (
            <View key={`${slotId}-${item.id}-${index}`} style={styles.dressMeImageWrapper}>
              <Image source={{ uri: item.uri }} style={styles.dressMeItemImage} />
              <TouchableOpacity 
                style={[styles.pinIconContainer, pinnedRows.includes(slotId) && { backgroundColor: '#1A1A1A', borderRadius: 15 }]} 
                activeOpacity={0.7} onPress={() => togglePin(slotId)}
              >
                <MaterialCommunityIcons 
                  name={pinnedRows.includes(slotId) ? "pin" : "pin-outline"} 
                  size={22} 
                  color={pinnedRows.includes(slotId) ? "#CCFF00" : "#1A1A1A"} 
                  style={{ transform: [{ rotate: '45deg' }] }} 
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const spinAngle = diceSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <>
      <ScrollView contentContainerStyle={styles.slotsContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.topControlsRow}>
          <View style={styles.pinnedBadge}>
            <MaterialCommunityIcons name="pin" size={12} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
            <Text style={styles.pinnedBadgeText}>{pinnedRows.length} PINNED ITEMS</Text>
          </View>

          <TouchableOpacity style={styles.aiTipContainer} activeOpacity={0.8} onPress={() => setIsAiTipVisible(true)}>
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
          <>
             {dynamicSlots.map(slot => renderDressMeRow(slot.id, slot.category))}
             
             <TouchableOpacity style={styles.addSlotBtn} activeOpacity={0.8} onPress={() => setIsAddMenuVisible(true)}>
                <Feather name="plus" size={24} color="#1A1A1A" />
                <Text style={styles.addSlotText}>Add Item</Text>
             </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {!is3DMode && (
        <View style={styles.floatingPillContainer}>
          <View style={styles.floatingPillHorizontal}>
            
            <TouchableOpacity style={styles.horizontalIconBtn} onPress={handleSaveOutfit} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="#1A1A1A" /> : <Feather name="download" size={24} color="#1A1A1A" />}
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

            <TouchableOpacity style={styles.horizontalIconBtn} onPress={() => setDynamicSlots([])}>
              <Feather name="trash-2" size={24} color="#FF3B30" />
            </TouchableOpacity>

          </View>
        </View>
      )}

      <Modal visible={isAddMenuVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={styles.categoryMenu}>
               <Text style={styles.categoryMenuTitle}>What do you want to add?</Text>
               <View style={styles.categoryGrid}>
                 {AVAILABLE_CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat} style={styles.categoryGridItem} onPress={() => addSlot(cat)}>
                        <Text style={styles.categoryGridText}>{cat}</Text>
                    </TouchableOpacity>
                 ))}
               </View>
               <TouchableOpacity style={styles.modalGotItBtn} onPress={() => setIsAddMenuVisible(false)}>
                  <Text style={styles.modalGotItText}>Cancel</Text>
               </TouchableOpacity>
           </View>
        </View>
      </Modal>

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

      <PremiumToast 
        visible={toastVisible} 
        message="Outfit saved to Wardrobe! 🦋" 
        onHide={() => setToastVisible(false)} 
      />

    </>
  );
}

const styles = StyleSheet.create({
  slotsContainer: { paddingTop: 10, paddingBottom: 150 }, 
  
  topControlsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, alignItems: 'flex-start' },
  pinnedBadge: { flexDirection: 'row', backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4, alignItems: 'center' },
  pinnedBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  
  aiTipContainer: { flexDirection: 'row', backgroundColor: '#21bcf5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 6, alignItems: 'center' },
  aiTipText: { color: '#f8faf0', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  dressMeRowContainer: { width: width, height: height * 0.16, marginBottom: 10, position: 'relative' },
  dressMeImageWrapper: { width: width, height: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  dressMeItemImage: { width: '40%', height: '90%', resizeMode: 'contain' }, 
  pinIconContainer: { position: 'absolute', top: 5, right: width * 0.30, padding: 5 }, 
  
  removeSlotBtn: { position: 'absolute', top: 5, left: 20, zIndex: 10, padding: 5, backgroundColor: '#EBE8DF', borderRadius: 15 },
  addSlotBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#EBE8DF', marginTop: 10, gap: 8 },
  addSlotText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  emptyWardrobeContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyWardrobeText: { fontSize: 16, color: '#888', marginTop: 10 },
  
  floatingPillContainer: { position: 'absolute', bottom: 25, width: '100%', alignItems: 'center', zIndex: 100 },
  floatingPillHorizontal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 40, paddingHorizontal: 20, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 15, gap: 30 },
  horizontalIconBtn: { padding: 8 },
  generateOutfitBtnHorizontal: { backgroundColor: '#1A1A1A', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 25, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
  modalIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#21bcf5', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 15, letterSpacing: 0.5 },
  modalDescription: { fontSize: 14, fontWeight: '500', color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  modalGotItBtn: { backgroundColor: '#1A1A1A', width: '100%', paddingVertical: 14, borderRadius: 30, alignItems: 'center', marginTop: 15 },
  modalGotItText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

  categoryMenu: { backgroundColor: '#FFF', width: '100%', borderRadius: 24, padding: 20, alignItems: 'center' },
  categoryMenuTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  categoryGridItem: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#F5F2EB', borderRadius: 12, borderWidth: 1, borderColor: '#EBE8DF' },
  categoryGridText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' }
});