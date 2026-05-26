import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ScrollView, Dimensions, ActivityIndicator, Animated, PanResponder } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PremiumToast from '../PremiumToast';
import { apiClient } from '../../api/client';
import { COLORS, SHADOWS } from '../../theme/theme'; 

const { width, height } = Dimensions.get('window');
const CURRENT_USER_ID = 1;

const AVAILABLE_CATEGORIES = ['TOPS', 'BOTTOMS', 'FOOTWEAR', 'ACCESSORIES', 'OUTERWEAR', 'FULL_BODY'];

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

  const [suggestedItems, setSuggestedItems] = useState<{ [slotId: string]: {id: string, uri: string, category: string} }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAddMenuVisible, setIsAddMenuVisible] = useState(false);
  
  const [isThreeColView, setIsThreeColView] = useState(false);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [isFeedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<'REASON' | 'SELECT_ITEMS'>('REASON');
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('NONE');
  const [selectedTargetItems, setSelectedTargetItems] = useState<number[]>([]);

  const [isEventModalVisible, setEventModalVisible] = useState(false);

  // 🚀 YENİ: Etkinlik Formu State'leri
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);

  const EVENT_TYPES = [
    { id: 'WEDDING', label: 'Düğün / Nişan', icon: 'gift' },
    { id: 'DATE', label: 'Akşam Yemeği / Date', icon: 'heart' },
    { id: 'BUSINESS', label: 'İş Toplantısı', icon: 'briefcase' },
    { id: 'PARTY', label: 'Gece Kulübü / Parti', icon: 'music' },
    { id: 'CASUAL', label: 'Günlük Buluşma', icon: 'coffee' }
  ];

  const VIBE_TYPES = [
    { id: 'FORMAL', label: 'Klasik & Şık' },
    { id: 'SMART_CASUAL', label: 'Smart Casual' },
    { id: 'EDGY', label: 'İddialı & Dikkat Çekici' },
    { id: 'COMFORT', label: 'Rahat & Salaş' }
  ];

  // Form Gönderme Aksiyonu
  const handleEventSubmit = () => {
    if (!selectedEvent || !selectedVibe) {
       alert("Lütfen bir etkinlik ve tarz seçin.");
       return;
    }
    setEventModalVisible(false);
    // İleride buraya Python AI motoruna "Düğün" ve "Klasik" parametrelerini yollayacağımız kodu ekleyeceğiz!
    console.log("Seçilen Etkinlik:", selectedEvent, "Tarz:", selectedVibe);
    alert("Vestify AI etkinliğinize özel parçaları seçiyor...");
  };

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
                    category: matched.category
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

  // Feedback Animasyonları ve Mekanizması (Eksiksiz)
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
     } catch (error) {
       console.error("🚨 Feedback Hatası:", error);
     }
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

  const currentOutfitArray = dynamicSlots.map(slot => suggestedItems[slot.id]).filter(Boolean);

  return (
    <View style={styles.container}>
      
      {/* 🚀 YENİ VİTRİN: Yan Yana (Split Cards) Aksiyon Merkezi */}
      <View style={styles.actionHubContainer}>
        
        {/* SEYAHAT KARTI */}
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => navigation.navigate('Planner')}>
          <View style={[styles.cardIconBox, { backgroundColor: COLORS.primary }]}>
            <Feather name="briefcase" size={20} color="#FFF" />
          </View>
          <Text style={styles.cardTitle}>Seyahat Planı</Text>
          <Text style={styles.cardSub}>Hadi bavulunu hazırlayalım</Text>
        </TouchableOpacity>

        {/* ETKİNLİK KARTI */}
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => setEventModalVisible(true)}>
          <View style={[styles.cardIconBox, { backgroundColor: COLORS.accent }]}>
            <Feather name="star" size={20} color={COLORS.text} />
          </View>
          <Text style={styles.cardTitle}>Özel Etkinlik ✨</Text>
          <Text style={styles.cardSub}>Kusursuz kombini bul</Text>
        </TouchableOpacity>
        
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 🚀 KLASİK VE SEVİLEN BAŞLIK */}
        <View style={styles.headerRow}>
           <View style={styles.aiTitleWrap}>
             <Text style={styles.aiTitleEmoji}>🦋</Text>
             <Text style={styles.infoTitle}>Tell us which outfits you love</Text>
           </View>
           <TouchableOpacity style={styles.viewToggleBtn} onPress={() => setIsThreeColView(!isThreeColView)}>
             <MaterialCommunityIcons name={isThreeColView ? "view-grid-outline" : "view-grid"} size={22} color={COLORS.primary} />
           </TouchableOpacity>
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
                     <View key={slot.id} style={isThreeColView ? styles.threeColCard : styles.twoColCard}>
                         <View style={styles.rowHeader}>
                             <Text style={[styles.rowCategory, isThreeColView && { fontSize: 9 }]} numberOfLines={1}>{slot.category}</Text>
                             <TouchableOpacity onPress={() => removeSlot(slot.id)} style={styles.removeBtn}>
                                 <Feather name="trash-2" size={isThreeColView ? 14 : 16} color={COLORS.error} />
                             </TouchableOpacity>
                         </View>
                         <View style={[styles.suggestedItemBox, isThreeColView && { height: height * 0.11 }]}>
                             {item ? <Image source={{ uri: item.uri }} style={styles.itemImage} /> : <Text style={[styles.noItemText, isThreeColView && { fontSize: 9 }]}>Eşya yok</Text>}
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

      {/* FLOATİNG AKSİYON BÖLGESİ (OnPress hatası düzeltildi) */}
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

      {/* 1. KATEGORİ MODALI */}
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

      {/* 2. GERİBİLDİRİM (RLHF) MODALI - Tam ve Eksiksiz */}
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

      {/* 3. ÖZEL ETKİNLİK MODALI (Yeni Tasarım) */}
      <Modal visible={isEventModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setEventModalVisible(false)} />
          
          <View style={styles.eventBottomSheet}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.eventHeader}>
               <View style={styles.eventIconWrap}>
                 <Feather name="star" size={24} color={COLORS.text} />
               </View>
               <Text style={styles.eventTitle}>Nereye Gidiyoruz?</Text>
               <Text style={styles.eventSub}>Vestify AI, mekana ve konsepte en uygun parçaları seçecek.</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              <Text style={styles.eventSectionTitle}>Etkinlik Türü</Text>
              <View style={styles.eventGrid}>
                {EVENT_TYPES.map(evt => (
                  <TouchableOpacity 
                    key={evt.id} 
                    style={[styles.eventOptionBtn, selectedEvent === evt.id && styles.eventOptionBtnActive]}
                    onPress={() => setSelectedEvent(evt.id)}
                    activeOpacity={0.7}
                  >
                    <Feather name={evt.icon as any} size={18} color={selectedEvent === evt.id ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.eventOptionText, selectedEvent === evt.id && styles.eventOptionTextActive]}>
                      {evt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.eventSectionTitle, { marginTop: 20 }]}>Yaratmak İstediğin İzlenim</Text>
              <View style={styles.vibeGrid}>
                {VIBE_TYPES.map(vibe => (
                  <TouchableOpacity 
                    key={vibe.id} 
                    style={[styles.vibeOptionBtn, selectedVibe === vibe.id && styles.vibeOptionBtnActive]}
                    onPress={() => setSelectedVibe(vibe.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.vibeOptionText, selectedVibe === vibe.id && styles.vibeOptionTextActive]}>
                      {vibe.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.generateEventBtn, (!selectedEvent || !selectedVibe) && { opacity: 0.5 }]} 
                activeOpacity={0.8}
                onPress={handleEventSubmit}
                disabled={!selectedEvent || !selectedVibe}
              >
                <Text style={styles.generateEventBtnText}>Kusursuz Kombinimi Bul</Text>
                <Feather name="arrow-right" size={20} color={COLORS.text} />
              </TouchableOpacity>
              
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PremiumToast visible={toastVisible} message="Kombin dolaba eklendi! 🦋" onHide={() => setToastVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 150, paddingTop: 10 },
  
  // 🚀 YENİ VİTRİN: YAN YANA KARTLAR (Split Cards)
  actionHubContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 15 },
  actionCard: { width: '48%', backgroundColor: COLORS.surface, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  cardIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  cardSub: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },

  // Başlık Alanı
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  aiTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiTitleEmoji: { fontSize: 16 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  viewToggleBtn: { backgroundColor: COLORS.surface, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'flex-start', gap: '3%' },
  twoColCard: { width: '48%', backgroundColor: COLORS.surface, borderRadius: 20, marginBottom: 15, padding: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  threeColCard: { width: '31%', backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: 12, padding: 8, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.background, paddingBottom: 6 },
  rowCategory: { fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5, flex: 1 },
  removeBtn: { padding: 2 },
  
  suggestedItemBox: { width: '100%', height: height * 0.16, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12 },
  itemImage: { width: '80%', height: '90%', resizeMode: 'contain' },
  noItemText: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center' },

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
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // 🚀 ÖZEL ETKİNLİK MODALI STİLLERİ
  eventBottomSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 25, paddingTop: 15, paddingBottom: 40, width: '100%', maxHeight: height * 0.85, ...SHADOWS.medium },
  eventHeader: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  eventIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 12, ...SHADOWS.light },
  eventTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  eventSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '500', paddingHorizontal: 10 },
  
  eventSectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  eventOptionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  eventOptionBtnActive: { backgroundColor: '#F0F5F2', borderColor: COLORS.primary }, // Hafif şeffaf yeşil Gofrik efekti
  eventOptionText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  eventOptionTextActive: { color: COLORS.primary, fontWeight: '700' },

  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vibeOptionBtn: { backgroundColor: COLORS.background, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  vibeOptionBtnActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  vibeOptionText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  vibeOptionTextActive: { color: COLORS.surface, fontWeight: '700' },

  generateEventBtn: { flexDirection: 'row', backgroundColor: COLORS.accent, paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 30, gap: 10, ...SHADOWS.light },
  generateEventBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '800' }
});