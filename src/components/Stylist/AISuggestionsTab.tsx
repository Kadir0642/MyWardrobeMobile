import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ScrollView, Dimensions, ActivityIndicator, Animated, PanResponder, ImageBackground } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PremiumToast from '../PremiumToast';
import { apiClient } from '../../api/client';
import { COLORS, SHADOWS } from '../../theme/theme'; 

const { width, height } = Dimensions.get('window');
const CURRENT_USER_ID = 1;

const AVAILABLE_CATEGORIES = ['TOPS', 'BOTTOMS', 'FOOTWEAR', 'ACCESSORIES', 'OUTERWEAR', 'FULL_BODY'];

// 🎨 VOGUE RUTHLESS MINIMALISM PALETTE
const VOGUE = {
  bg: '#FFFFFF',
  text: '#1A1A1A',
  secondary: '#717171',
  border: '#E8E8E8',
  accent: '#000000',
  softBg: '#F9F9F9',
  brandText: '#A1A1A1' 
};

interface AISuggestionsTabProps {
  allWardrobe: any[]; 
  weather?: { temp: string; city: string; icon: string };
}

export default function AISuggestionsTab({ allWardrobe = [], weather }: AISuggestionsTabProps) {
  const navigation = useNavigation<any>(); 

  const [dynamicSlots, setDynamicSlots] = useState<{id: string, category: string}[]>([
    { id: `slot_tops_${Date.now()}`, category: 'TOPS' },
    { id: `slot_bottoms_${Date.now()+1}`, category: 'BOTTOMS' },
    { id: `slot_footwear_${Date.now()+2}`, category: 'FOOTWEAR' }
  ]);

  const [suggestedItems, setSuggestedItems] = useState<{ [slotId: string]: {id: string, uri: string, category: string, brand?: string} }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAddMenuVisible, setIsAddMenuVisible] = useState(false);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [isFeedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<'REASON' | 'SELECT_ITEMS'>('REASON');
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('NONE');
  const [selectedTargetItems, setSelectedTargetItems] = useState<number[]>([]);

  const sheetPanY = useRef(new Animated.Value(height)).current;
  const likeScale = useRef(new Animated.Value(1)).current;

  const fetchOutfitFromAPI = async (currentSlots: {id: string, category: string}[]) => {
    if (currentSlots.length === 0) return;
    setIsLoading(true);
    try {
      const requestedCategories = currentSlots.map(s => s.category).join(',');
      const response = await apiClient.get(`/outfits/suggest?userId=${CURRENT_USER_ID}&categories=${requestedCategories}`);
      
      if (response.status === 200 && Array.isArray(response.data)) {
        const newSuggested: any = {};
        let availableItems = [...response.data];

        currentSlots.forEach((slot) => {
            const normalizedSlotCat = slot.category.replace('_', ' ').toUpperCase();
            const matchIndex = availableItems.findIndex(item => 
                (item.category || '').replace('_', ' ').toUpperCase() === normalizedSlotCat
            );

            if (matchIndex !== -1) {
                const matched = availableItems[matchIndex];
                newSuggested[slot.id] = {
                    id: matched.id?.toString() || matched.clothingId?.toString(),
                    uri: matched.imageUrl || matched.uri,
                    category: matched.category,
                    // Not: Java DTO güncellendiğinde burası gerçek marka dolacak.
                    brand: matched.brand || "VESTIFY" 
                };
                availableItems.splice(matchIndex, 1); 
            } 
        });
        setSuggestedItems(newSuggested);
      }
    } catch (error: any) {
      console.error("🚨 AI Kombin Hatası:", error.message);
    } finally {
      setTimeout(() => setIsLoading(false), 300); 
    }
  };

  useEffect(() => { fetchOutfitFromAPI(dynamicSlots); }, []);

  const addSlot = (category: string) => {
    const newSlot = { id: `slot_${category.toLowerCase()}_${Date.now()}`, category };
    const updatedSlots = [...dynamicSlots, newSlot];
    setDynamicSlots(updatedSlots);
    setIsAddMenuVisible(false);
    fetchOutfitFromAPI(updatedSlots);
  };

  const removeSlot = (slotId: string) => {
    const updatedSlots = dynamicSlots.filter(slot => slot.id !== slotId);
    setDynamicSlots(updatedSlots);
    const newSuggested = {...suggestedItems};
    delete newSuggested[slotId];
    setSuggestedItems(newSuggested);
    fetchOutfitFromAPI(updatedSlots);
  };

  const openFeedbackModal = () => {
    setFeedbackVisible(true);
    Animated.spring(sheetPanY, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
  };

  const closeFeedbackModal = () => {
    Animated.timing(sheetPanY, { toValue: height, duration: 250, useNativeDriver: true }).start(() => {
      setFeedbackVisible(false);
      setTimeout(() => { setFeedbackStep('REASON'); setSelectedTargetItems([]); }, 100); 
    });
  };

  const feedbackPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10 && gesture.vy > 0.1, 
      onPanResponderMove: (_, gesture) => { if (gesture.dy > 0) sheetPanY.setValue(gesture.dy); },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > height * 0.25 || gesture.vy > 1.2) closeFeedbackModal();
        else Animated.spring(sheetPanY, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
      }
    })
  ).current;

  const sendFeedbackToAPI = async (feedbackType: string, reasonCode: string, targetIds: number[]) => {
     const outfitIds = Object.values(suggestedItems).map(item => parseInt(item.id, 10)).filter(id => !isNaN(id));
     if(outfitIds.length === 0) return;

     const payload = {
       user_id: CURRENT_USER_ID, 
       outfit_item_ids: outfitIds, 
       feedback_type: feedbackType, 
       reason_code: reasonCode,     
       target_item_ids: targetIds, 
       weather_context: weather ? `${weather.city}, ${weather.temp}` : "UNKNOWN"
     };

     try {
       await apiClient.post('/feedback', payload);
     } catch (error) {}
  };

  const handleReasonSelect = (reasonId: string) => {
    const requiresSelection = ['DONT_PAIR_THESE', 'MISMATCHED_CATEGORIES', 'TOO_WARM_FOR_WEATHER', 'TOO_COOL_FOR_WEATHER'];
    if (requiresSelection.includes(reasonId)) {
      setSelectedReasonCode(reasonId);
      setFeedbackStep('SELECT_ITEMS'); 
    } else {
      executeDislike(reasonId, []);
    }
  };

  const executeDislike = (reason: string, targets: number[]) => {
    closeFeedbackModal(); 
    sendFeedbackToAPI('DISLIKE', reason, targets); 
    fetchOutfitFromAPI(dynamicSlots); 
  };

  const toggleTargetItem = (id: string) => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;
    setSelectedTargetItems(prev => prev.includes(numId) ? prev.filter(i => i !== numId) : [...prev, numId]);
  };

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.timing(likeScale, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start(async () => {
      const outfitIds = Object.values(suggestedItems).map(item => parseInt(item.id, 10)).filter(id => !isNaN(id));
      if(outfitIds.length > 0) {
          try {
             await apiClient.post(`/outfits/${CURRENT_USER_ID}/save`, { name: `AI Match - ${new Date().toLocaleDateString('tr-TR')}`, clothingItemIds: outfitIds });
             setToastVisible(true);
             fetchOutfitFromAPI(dynamicSlots);
          } catch(e) {}
      }
    });
  };

  // 🚀 DÜZELTME: Kıyafet Detay Sayfasına Gitme (Hata Giderildi)
  const navigateToItemDetail = (item: any) => {
    if (!item || !item.uri) return;
    navigation.navigate('ItemDetail', { 
        id: item.id, // Sayfanın çökmemesi için ID de yolluyoruz
        imageUrl: item.uri, 
        isAiGenerated: true 
    });
  };

  const currentOutfitArray = dynamicSlots.map(slot => suggestedItems[slot.id]).filter(Boolean);

  return (
    <View style={styles.container}>
      
{/* 🚀 LÜKS AKSİYON BANNERLARI (Tam Oturan Resimler) */}
      <View style={styles.vogueActionHub}>
        
        {/* SEYAHAT BANNER'I */}
        <View style={styles.vogueBannerShadow}>
          <TouchableOpacity style={styles.vogueBannerInner} activeOpacity={0.9} onPress={() => navigation.navigate('TravelPlannerScreen')}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop' }} 
              style={styles.bannerAbsoluteImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerTextWrap}>
              <Text style={styles.bannerTitle}>travel plan?</Text>
              <Text style={styles.bannerSub}>pack your bags</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ETKİNLİK BANNER'I */}
        <View style={styles.vogueBannerShadow}>
          <TouchableOpacity style={styles.vogueBannerInner} activeOpacity={0.9} onPress={() => navigation.navigate('EventPlannerScreen')}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop' }} 
              style={styles.bannerAbsoluteImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerTextWrap}>
              <Text style={styles.bannerTitle}>where to?</Text>
              <Text style={styles.bannerSub}>find the perfect outfit</Text>
            </View>
          </TouchableOpacity>
        </View>
        
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 🚀 DÜZELTME: Ortalanmış Başlık ve Kaldırılan Izgara Tuşu */}
        <View style={styles.headerRow}>
           <View style={styles.aiTitleWrap}>
             <Text style={styles.aiTitleEmoji}>🦋</Text>
             <Text style={styles.infoTitle}>Tell us which outfits you love</Text>
             <Text style={styles.aiTitleEmoji}>🦋</Text>
           </View>
        </View>

        {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
        ) : dynamicSlots.length === 0 ? (
            <View style={styles.emptyContainer}>
               <Feather name="layers" size={40} color={COLORS.textSecondary} />
               <Text style={styles.emptyText}>Henüz bir slot eklemediniz.</Text>
            </View>
        ) : (
            <View style={styles.gridContainer}>
              {dynamicSlots.map((slot) => {
                 const item = suggestedItems[slot.id];
                 return (
                     // 🚀 DÜZELTME: Sadece 3'lü kolon (gridCard) stili kullanılıyor
                     <View key={slot.id} style={styles.gridCard}>
                         
                         {/* Kıyafet Kutusu */}
                         <TouchableOpacity 
                           activeOpacity={0.8} 
                           onPress={() => navigateToItemDetail(item)}
                           style={styles.suggestedItemBox}
                         >
                             {item ? (
                               <Image source={{ uri: item.uri }} style={styles.itemImage} />
                             ) : (
                               <Text style={styles.noItemText}>Eşya yok</Text>
                             )}
                         </TouchableOpacity>
                         
                         {/* Zarif Marka Alanı */}
                         <View style={styles.brandRow}>
                           <Text style={styles.brandText} numberOfLines={1}>
                             {item && item.brand ? item.brand : "VESTIFY"}
                           </Text>
                           <TouchableOpacity onPress={() => removeSlot(slot.id)} style={styles.removeBtn}>
                               <Feather name="trash-2" size={12} color={VOGUE.secondary} />
                           </TouchableOpacity>
                         </View>

                     </View>
                 );
              })}
            </View>
        )}

        <TouchableOpacity style={styles.addSlotBtn} activeOpacity={0.8} onPress={() => setIsAddMenuVisible(true)}>
           <Feather name="plus" size={22} color={COLORS.text} />
           <Text style={styles.addSlotText}>Kategori Ekle</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* FLOATİNG AKSİYON BÖLGESİ */}
      <View style={styles.floatingActionArea}>
         <TouchableOpacity style={styles.actionBtnDislike} onPress={openFeedbackModal} activeOpacity={0.8}>
           <Feather name="x" size={28} color={COLORS.error} />
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionBtnRefresh} onPress={() => fetchOutfitFromAPI(dynamicSlots)} activeOpacity={0.7}>
           <MaterialCommunityIcons name="butterfly-outline" size={32} color="#FFF" />
           <Text style={styles.refreshText}>Yenile</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionBtnLike} onPress={handleLike} activeOpacity={0.9}>
           <Animated.View style={{ transform: [{ scale: likeScale }] }}>
             <MaterialCommunityIcons name="heart" size={28} color={COLORS.primary} />
           </Animated.View>
         </TouchableOpacity>
      </View>

      {/* MODALLAR */}
      <Modal visible={isAddMenuVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={styles.categoryMenu}>
               <Text style={styles.categoryMenuTitle}>Hangi kategoriyi eklemek istersin?</Text>
               <View style={styles.categoryGrid}>
                 {AVAILABLE_CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat} style={styles.categoryGridItem} onPress={() => addSlot(cat)}>
                        <Text style={styles.categoryGridText}>{cat}</Text>
                    </TouchableOpacity>
                 ))}
               </View>
               <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsAddMenuVisible(false)}>
                  <Text style={styles.modalCancelText}>Kapat</Text>
               </TouchableOpacity>
           </View>
        </View>
      </Modal>

      <Modal visible={isFeedbackVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeFeedbackModal} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetPanY }] }]}>
            <View style={{ width: '100%', paddingVertical: 10 }} {...feedbackPanResponder.panHandlers}>
              <View style={styles.sheetHandle} />
            </View>

            {feedbackStep === 'REASON' && (
              <>
                <Text style={styles.sheetTitle}>Neden beğenmediniz?</Text>
                <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
                  {[
                    { id: 'MISMATCHED_CATEGORIES', label: 'Parçalar birbiriyle uyumsuz' },
                    { id: 'COLOR_MISMATCH', label: "Renk uyumunu beğenmedim" },
                    { id: 'TOO_COOL_FOR_WEATHER', label: 'Hava durumuna göre çok ince' },
                    { id: 'TOO_WARM_FOR_WEATHER', label: 'Hava durumuna göre çok kalın' },
                    { id: 'DONT_PAIR_THESE', label: 'Belirli parçaları birlikte önerme' }
                  ].map(opt => (
                    <TouchableOpacity key={opt.id} style={styles.feedbackOptionRow} onPress={() => handleReasonSelect(opt.id)}>
                      <Text style={styles.feedbackOptionText}>{opt.label}</Text>
                      <Feather name="chevron-right" size={20} color={COLORS.border} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={closeFeedbackModal}>
                  <Text style={styles.modalCancelText}>Vazgeç</Text>
                </TouchableOpacity>
              </>
            )}

            {feedbackStep === 'SELECT_ITEMS' && (
              <>
                <Text style={styles.sheetTitle}>
                  {selectedReasonCode === 'TOO_WARM_FOR_WEATHER' ? "Fazla kalın olan parçaları seçin" :
                   selectedReasonCode === 'TOO_COOL_FOR_WEATHER' ? "Fazla ince olan parçaları seçin" :
                   selectedReasonCode === 'MISMATCHED_CATEGORIES' ? "Uyumsuz bulduğunuz parçaları seçin" :
                   "Önerilmesini istemediğiniz parçaları seçin"}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  Seçtiğiniz eşyalar Vestify zeka motoruna öğretilecek.
                </Text>
                
                <ScrollView contentContainerStyle={styles.selectionGrid} showsVerticalScrollIndicator={false}>
                  {currentOutfitArray.map(item => {
                    if (!item) return null;
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
                  <Text style={styles.doneBtnText}>Tamamla ve Yenile</Text>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>
        </View>
      </Modal>

      <PremiumToast visible={toastVisible} message="Kombin dolaba eklendi! 🦋" onHide={() => setToastVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 150, paddingTop: 10 },
  
// 🚀 SİNEMATİK BANNER STİLLERİ (Kusursuz Oturan Yapı)
  vogueActionHub: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 15, gap: 10 },
  
  vogueBannerShadow: { width: '48.5%', height: height * 0.12, ...SHADOWS.medium },
  vogueBannerInner: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: COLORS.surface },
  
  bannerAbsoluteImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' }, 
  
  bannerTextWrap: { flex: 1, justifyContent: 'flex-end', padding: 15, zIndex: 2 },
  bannerTitle: { fontSize: 13, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 },
  bannerSub: { fontSize: 11, color: '#F0F0F0', fontWeight: '500', fontStyle: 'italic' },

  // 🚀 DÜZELTME: Ortalanmış Başlık
  headerRow: { alignItems: 'center', marginTop: 25, marginBottom: 15 },
  aiTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  aiTitleEmoji: { fontSize: 16 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },

  // 🚀 DÜZELTME: Sabit 3'lü Izgara Yapısı
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'flex-start', gap: '3%' },
  gridCard: { width: '31.3%', backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 15, padding: 8, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 8 },
  brandText: { fontSize: 9, fontWeight: '800', color: VOGUE.brandText, letterSpacing: 1.5, flex: 1, textTransform: 'uppercase' }, 
  removeBtn: { padding: 2, marginLeft: 5 },
  
  suggestedItemBox: { width: '100%', height: height * 0.11, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12 },
  itemImage: { width: '85%', height: '90%', resizeMode: 'contain' },
  noItemText: { fontSize: 9, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center' },

  addSlotBtn: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, marginTop: 10, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light, gap: 8 },
  addSlotText: { fontSize: 14, fontWeight: '700', color: COLORS.text },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 15, fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },

  floatingActionArea: { position: 'absolute', bottom: 30, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30 },
  actionBtnDislike: { backgroundColor: COLORS.surface, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
  actionBtnLike: { backgroundColor: COLORS.surface, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
  actionBtnRefresh: { backgroundColor: COLORS.primary, width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
  refreshText: { color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(74, 46, 27, 0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  categoryMenu: { backgroundColor: COLORS.surface, width: '90%', borderRadius: 24, padding: 25, alignItems: 'center', marginBottom: height * 0.3, ...SHADOWS.medium },
  categoryMenuTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  categoryGridItem: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  categoryGridText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  modalCancelBtn: { marginTop: 20, paddingVertical: 12, width: '100%', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12 },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  bottomSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingBottom: 40, width: '100%', maxHeight: height * 0.8, ...SHADOWS.medium },
  sheetHandle: { width: 50, height: 5, backgroundColor: COLORS.border, borderRadius: 3, alignSelf: 'center' },
  sheetTitle: { fontSize: 18, color: COLORS.text, textAlign: 'center', fontWeight: '800', marginBottom: 5 },
  sheetSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '500', marginBottom: 20 },
  feedbackOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  feedbackOptionText: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  selectionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  selectionCard: { width: '48%', backgroundColor: COLORS.background, borderRadius: 12, padding: 10, marginBottom: 15, position: 'relative', height: 140, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectionCardActive: { borderColor: COLORS.error, backgroundColor: '#FDF7F7' },
  selectionImage: { width: '80%', height: '80%', resizeMode: 'contain' },
  checkboxIcon: { position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  checkboxIconActive: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  doneBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});