import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ScrollView, Dimensions, ActivityIndicator, Animated, PanResponder, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import PremiumToast from '../PremiumToast';
import { apiClient } from '../../api/client';
import { ClothingItem } from '../../types';

const { width, height } = Dimensions.get('window');
const CURRENT_USER_ID = 1;

interface AISuggestionsTabProps {
  allWardrobe: any[]; 
  weather?: { temp: string; city: string; icon: string };
}

const getCollagePositions = (itemCount: number) => {
  if (itemCount <= 4) {
    return [
      { top: '10%', left: '10%', width: '38%', height: '35%' },    
      { top: '10%', right: '10%', width: '38%', height: '35%' },   
      { top: '50%', left: '10%', width: '38%', height: '35%' },   
      { top: '50%', right: '10%', width: '38%', height: '35%' },  
    ];
  } else {
    return [
      { top: '5%', left: '5%', width: '40%', height: '28%' },    
      { top: '5%', right: '5%', width: '40%', height: '28%' },   
      { top: '35%', left: '5%', width: '40%', height: '28%' },   
      { top: '35%', right: '5%', width: '40%', height: '28%' },  
      { top: '65%', left: '5%', width: '40%', height: '28%' },   
      { top: '65%', right: '5%', width: '40%', height: '28%' }   
    ];
  }
};

export default function AISuggestionsTab({ allWardrobe = [], weather }: AISuggestionsTabProps) {
  const [currentOutfit, setCurrentOutfit] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeBlueprintIndex, setActiveBlueprintIndex] = useState<0 | 1 | 2>(0);
  // BİLDİRİM BURAYA GELDİ
  const [toastVisible, setToastVisible] = useState(false);
  const [isFeedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<'REASON' | 'SELECT_ITEMS'>('REASON');
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('NONE');
  const [selectedTargetItems, setSelectedTargetItems] = useState<number[]>([]);

  const sheetPanY = useRef(new Animated.Value(height)).current;
  
  // UX DETAYI: LIKE Butonu Kalp Atış Animasyonu
  const likeScale = useRef(new Animated.Value(1)).current;

  const openFeedbackModal = () => {
    setFeedbackVisible(true);
    Animated.spring(sheetPanY, { 
      toValue: 0, 
      bounciness: 4, 
      useNativeDriver: true 
    }).start();
  };

  const closeFeedbackModal = () => {
    Animated.timing(sheetPanY, { 
      toValue: height, 
      duration: 250, 
      useNativeDriver: true 
    }).start(() => {
      setFeedbackVisible(false);
      setTimeout(() => {
        setFeedbackStep('REASON');
        setSelectedTargetItems([]);
      }, 100); 
    });
  };

  const feedbackPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10 && gesture.vy > 0.1, 
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          sheetPanY.setValue(gesture.dy); 
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > height * 0.25 || gesture.vy > 1.2) {
          closeFeedbackModal();
        } else {
          Animated.spring(sheetPanY, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
        }
      }
    })
  ).current;

  const fetchOutfitFromAPI = async (blueprintIndex: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/outfits/suggest?userId=${CURRENT_USER_ID}&blueprintIndex=${blueprintIndex}`);
      
      if (response.status === 200 && Array.isArray(response.data)) {
        const formattedData = response.data.map((item: any) => ({
          id: (item.id || item.clothingId || item.itemId || "").toString(),
          uri: item.imageUrl || item.uri, 
          category: item.category
        }));
        setCurrentOutfit(formattedData.filter(item => item.id !== ""));
      }
    } catch (error: any) {
      console.error("🚨 Java Kombin Getirme Hatası:", error.response?.data || error.message);
      setCurrentOutfit([]);
    } finally {
      setTimeout(() => setIsLoading(false), 300); 
    }
  };

  useEffect(() => {
    fetchOutfitFromAPI(activeBlueprintIndex);
  }, []);

  const handleBlueprintChange = (index: 0 | 1 | 2) => {
    if (index !== activeBlueprintIndex) {
      setActiveBlueprintIndex(index);
      fetchOutfitFromAPI(index); 
    }
  };

  const sendFeedbackToAPI = async (feedbackType: string, reasonCode: string, targetIds: number[]) => {
    if (currentOutfit.length === 0) return;

    const safeOutfitItemIds = currentOutfit
      .map(item => parseInt(item.id, 10))
      .filter(id => !isNaN(id) && id > 0);

    const safeTargetIds = targetIds
      .map(id => parseInt(id.toString(), 10))
      .filter(id => !isNaN(id) && id > 0);

    const weatherString = weather && weather.temp !== '--°C' 
        ? `${weather.city}, ${weather.temp}, ${weather.icon}` 
        : "UNKNOWN_WEATHER";

    const payload = {
      user_id: CURRENT_USER_ID, 
      outfit_item_ids: safeOutfitItemIds, 
      feedback_type: feedbackType, 
      reason_code: reasonCode,     
      target_item_ids: safeTargetIds, 
      weather_context: weatherString
    };

    try {
      await apiClient.post('/feedback', payload);
      console.log(`✅ Feedback İletildi: [${feedbackType}] Sebep: ${reasonCode}`);
    } catch (error: any) {
      console.error("🚨 Java API Feedback Hatası:", error.response?.data || error.message);
    }
  };

// 🚀 GÜNCELLENMİŞ OUTFIT KAYDETME MOTORU
  const saveOutfitToDatabase = async (outfitItems: any[]) => {
    if (outfitItems.length === 0) return;
    try {
      const safeItemIds = outfitItems
        .map(item => parseInt(item.id, 10))
        .filter(id => !isNaN(id) && id > 0);

      // 📦 Java DTO'sunun tam olarak beklediği paket (name ve clothingItemIds)
      const payload = {
        name: `AI Suggestion - ${new Date().toLocaleDateString('tr-TR')}`, // Java isim bekliyor!
        clothingItemIds: safeItemIds, 
      };

      // 📍 Java'nın beklediği tam adres: /outfits/{userId}/save
      await apiClient.post(`/outfits/${CURRENT_USER_ID}/save`, payload);
      console.log("✨ Kombin dolaba başarıyla kaydedildi!");
    } catch (error: any) {
      console.error("🚨 Kombin kaydedilirken hata:", error.message);
    }
  }

  const handleReasonSelect = (reasonId: string) => {
    const requiresItemSelection = [
      'DONT_PAIR_THESE',        
      'TOO_WARM_FOR_WEATHER',   
      'TOO_COOL_FOR_WEATHER',   
      'MISMATCHED_CATEGORIES'   
    ];

    if (requiresItemSelection.includes(reasonId)) {
      setSelectedReasonCode(reasonId);
      setSelectedTargetItems([]); 
      setFeedbackStep('SELECT_ITEMS'); 
    } else {
      executeDislike(reasonId, []);
    }
  };

  const toggleTargetItem = (id: string) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;

    setSelectedTargetItems(prev => 
      prev.includes(numId) ? prev.filter(i => i !== numId) : [...prev, numId]
    );
  };

  const executeDislike = (reason: string, targets: number[]) => {
    closeFeedbackModal(); 
    sendFeedbackToAPI('DISLIKE', reason, targets); 
    fetchOutfitFromAPI(activeBlueprintIndex); 
  };

// 🚀 GÜNCELLENMİŞ LIKE BUTONU (Premium Bildirimli)
  const handleLike = () => {
    // 1. Kullanıcıya "Basıldı" hissi vermek için kalbi şişir
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.timing(likeScale, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start(() => {
      // 2. Animasyon bitince verileri Java'ya gönder
      sendFeedbackToAPI('LIKE', 'NONE', []); 
      saveOutfitToDatabase(currentOutfit); 
      
      // 3. Eski çirkin Alert YERİNE, Premium Bildirim şalterini aç!
      setToastVisible(true);
      
      // 4. Kullanıcıyı hiç bekletmeden otomatik olarak yeni kombini çek!
      fetchOutfitFromAPI(activeBlueprintIndex);
    });
  };

  const currentPositions = getCollagePositions(currentOutfit.length);

  return (
    <View style={styles.aiTabContainer}>
      
      <View style={styles.aiTitleWrap}>
        <Text style={styles.aiTitleEmoji}>🦋</Text>
        <Text style={styles.aiTitleText}>Tell us which outfits you love</Text>
        <Text style={styles.aiTitleEmoji}>🦋</Text>
      </View>

      <View style={styles.premiumPillWrapper}>
        <View style={styles.premiumPill}>
          <TouchableOpacity style={[styles.pillBtn, activeBlueprintIndex === 0 && styles.pillBtnActive]} onPress={() => handleBlueprintChange(0)}>
            <MaterialCommunityIcons name="layers-outline" size={20} color={activeBlueprintIndex === 0 ? "#1A1A1A" : "#C0C0C0"} />
            {activeBlueprintIndex === 0 && <Text style={styles.pillTextActive}>Basic</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillBtn, activeBlueprintIndex === 1 && styles.pillBtnActive]} onPress={() => handleBlueprintChange(1)}>
            <MaterialCommunityIcons name="account-outline" size={22} color={activeBlueprintIndex === 1 ? "#1A1A1A" : "#C0C0C0"} />
            {activeBlueprintIndex === 1 && <Text style={styles.pillTextActive}>Full</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillBtn, activeBlueprintIndex === 2 && styles.pillBtnActive]} onPress={() => handleBlueprintChange(2)}>
            <MaterialCommunityIcons name="layers-triple-outline" size={20} color={activeBlueprintIndex === 2 ? "#1A1A1A" : "#C0C0C0"} />
            {activeBlueprintIndex === 2 && <Text style={styles.pillTextActive}>Layered</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.aiOutfitGrid}>
        {isLoading ? (
           <ActivityIndicator size="large" color="#CCFF00" style={{ marginTop: 100 }} />
        ) : currentOutfit.length === 0 ? (
           <Text style={styles.emptyText}>Bu şablona uygun eşya bulunamadı.</Text>
        ) : (
           currentOutfit.map((item, index) => {
             const posStyle = currentPositions[index % currentPositions.length]; 
             return (
               <View key={`${item.id}-${index}`} style={[styles.dynamicItemContainer, posStyle as any]}>
                 <Image source={{ uri: item.uri }} style={styles.dynamicItemImage} />
               </View>
             );
           })
        )}
      </View>

      <View style={styles.aiActionRow}>
         <TouchableOpacity style={styles.aiActionBtnDislike} onPress={openFeedbackModal} activeOpacity={0.8}>
           <Feather name="x" size={32} color="#FF3B30" />
         </TouchableOpacity>
         
         <TouchableOpacity style={styles.aiActionBtnNext} onPress={() => fetchOutfitFromAPI(activeBlueprintIndex)} activeOpacity={0.7}>
           <MaterialCommunityIcons name="butterfly-outline" size={36} color="#1A1A1A" />
           <Text style={styles.aiNextText}>Next Outfit</Text>
         </TouchableOpacity>
         
         <TouchableOpacity style={styles.aiActionBtnLike} onPress={handleLike} activeOpacity={0.9}>
           {/* 🚀 ANİMASYONLU KALP */}
           <Animated.View style={{ transform: [{ scale: likeScale }] }}>
             <MaterialCommunityIcons name="heart" size={32} color="#34C759" />
           </Animated.View>
         </TouchableOpacity>
      </View>

      {/* 🛑 KAYDIRILABİLİR BOTTOM SHEET (MODAL) */}
      <Modal visible={isFeedbackVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeFeedbackModal} />
          
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetPanY }] }]}>
            <View style={{ width: '100%', paddingVertical: 10 }} {...feedbackPanResponder.panHandlers}>
              <View style={styles.sheetHandle} />
            </View>

            {feedbackStep === 'REASON' && (
              <>
                <Text style={styles.sheetSubtitle}>Don't like this recommendation?</Text>
                <Text style={styles.sheetTitle}>Please select the reason you don't like this</Text>
                
                <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
                  {[
                    { id: 'MISMATCHED_CATEGORIES', label: 'Mismatched categories' },
                    { id: 'COLOR_MISMATCH', label: "I don't like the color match" },
                    { id: 'TOO_COOL_FOR_WEATHER', label: 'I want a warmer outfit' },
                    { id: 'TOO_WARM_FOR_WEATHER', label: 'I want a cooler outfit' },
                    { id: 'DONT_PAIR_THESE', label: 'There are item(s) I want to exclude from my suggestions' }
                  ].map(opt => (
                    <TouchableOpacity key={opt.id} style={styles.feedbackOptionRow} onPress={() => handleReasonSelect(opt.id)}>
                      <Text style={styles.feedbackOptionText}>{opt.label}</Text>
                      <Feather name="chevron-right" size={20} color="#C0C0C0" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.cancelFeedbackBtn} onPress={closeFeedbackModal}>
                  <Text style={styles.cancelFeedbackText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {feedbackStep === 'SELECT_ITEMS' && (
              <>
                <Text style={styles.sheetTitle}>
                  {selectedReasonCode === 'TOO_WARM_FOR_WEATHER' ? "Select items that are too warm" :
                   selectedReasonCode === 'TOO_COOL_FOR_WEATHER' ? "Select items that are too cool" :
                   selectedReasonCode === 'MISMATCHED_CATEGORIES' ? "Select the mismatched items" :
                   "Select items to exclude"}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  The selected clothes will be adjusted according to your feedback.
                </Text>
                
                <ScrollView contentContainerStyle={styles.selectionGrid} showsVerticalScrollIndicator={false}>
                  {currentOutfit.map(item => {
                    const isSelected = selectedTargetItems.includes(parseInt(item.id, 10));
                    return (
                      <TouchableOpacity 
                        key={`select-${item.id}`} 
                        style={[styles.selectionCard, isSelected && styles.selectionCardActive]}
                        onPress={() => toggleTargetItem(item.id)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: item.uri }} style={styles.selectionImage} />
                        <View style={[styles.checkboxIcon, isSelected && styles.checkboxIconActive]}>
                          {isSelected && <Feather name="check" size={14} color="#FFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity 
                  style={[styles.doneBtn, selectedTargetItems.length === 0 && { opacity: 0.5 }]} 
                  disabled={selectedTargetItems.length === 0}
                  onPress={() => executeDislike(selectedReasonCode, selectedTargetItems)}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>
        </View>
      </Modal>

      <PremiumToast // Bildirim Toast bildirimi
        visible={toastVisible} 
        message="Kombin Dolabına Eklendi 💖" 
        onHide={() => setToastVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  aiTabContainer: { flex: 1, backgroundColor: '#FAFAFA', alignItems: 'center' },
  aiTitleWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EBE8DF', paddingBottom: 15, marginTop: 15, width: '85%', justifyContent: 'center', gap: 10 },
  aiTitleEmoji: { fontSize: 18 },
  aiTitleText: { fontSize: 18, fontWeight: '500', color: '#1A1A1A' },
  premiumPillWrapper: { width: '100%', alignItems: 'center', marginTop: 15, zIndex: 50 },
  premiumPill: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 30, padding: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.08, shadowRadius: 15, elevation: 10 },
  pillBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, gap: 8 },
  pillBtnActive: { backgroundColor: '#CCFF00', shadowColor: '#CCFF00', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8 },
  pillTextActive: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  
  aiOutfitGrid: { flex: 1, width: '100%', marginTop: 10, position: 'relative' },
  dynamicItemContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  dynamicItemImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  
  emptyText: { color: '#888', marginTop: 100, fontSize: 14, fontWeight: '500', alignSelf: 'center' },
  
  aiActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 40, gap: 40 },
  aiActionBtnDislike: { backgroundColor: '#FFF5F5', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3B30', shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  aiActionBtnLike: { backgroundColor: '#F0FFF4', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#34C759', shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  aiActionBtnNext: { alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  aiNextText: { fontSize: 12, color: '#1A1A1A', fontWeight: '700', marginTop: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingBottom: 40, maxHeight: height * 0.8, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  sheetHandle: { width: 50, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center' },
  sheetSubtitle: { fontSize: 13, color: '#888', textAlign: 'center', fontWeight: '500', marginBottom: 5 },
  sheetTitle: { fontSize: 18, color: '#1A1A1A', textAlign: 'center', fontWeight: '700', marginBottom: 25 },
  feedbackOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  feedbackOptionText: { fontSize: 15, color: '#333', fontWeight: '500' },
  cancelFeedbackBtn: { marginTop: 15, paddingVertical: 15, alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12 },
  cancelFeedbackText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

  selectionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  selectionCard: { width: '48%', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 10, marginBottom: 15, position: 'relative', height: 140, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectionCardActive: { borderColor: '#FF6B81', backgroundColor: '#FFF0F2' },
  selectionImage: { width: '80%', height: '80%', resizeMode: 'contain' },
  checkboxIcon: { position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  checkboxIconActive: { backgroundColor: '#FF6B81', borderColor: '#FF6B81' },
  doneBtn: { backgroundColor: '#1A1A1A', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});