import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface AISuggestionsTabProps {
  allWardrobe: any[]; // Artık sadece yedek/fallback olarak duruyor
  weather?: { temp: string; city: string; icon: string };
}

const COLLAGE_POSITIONS = [
  { top: '2%', left: '4%', width: '44%', height: '30%' },    
  { top: '2%', right: '4%', width: '44%', height: '30%' },   
  { top: '34%', left: '4%', width: '44%', height: '30%' },   
  { top: '34%', right: '4%', width: '44%', height: '30%' },  
  { top: '66%', left: '4%', width: '44%', height: '30%' },   
  { top: '66%', right: '4%', width: '44%', height: '30%' }   
];

export default function AISuggestionsTab({ allWardrobe = [], weather }: AISuggestionsTabProps) {
  const [currentOutfit, setCurrentOutfit] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeBlueprintIndex, setActiveBlueprintIndex] = useState<0 | 1 | 2>(0);

  // 🛑 MODAL VE GERİ BİLDİRİM STATE'LERİ
  const [isFeedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<'REASON' | 'SELECT_ITEMS'>('REASON');
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('NONE');
  const [selectedTargetItems, setSelectedTargetItems] = useState<number[]>([]);

  // 🌐 1. JAVA API'DEN KOMBİN ÇEKME MOTORU (THIN CLIENT)
  const fetchOutfitFromAPI = async (blueprintIndex: number) => {
    setIsLoading(true);
    try {
      // Senin Java API Ucun (GET İsteği)
      const response = await fetch(`http://10.87.14.78:8080/api/v1/outfits/suggest?userId=3&blueprintIndex=${blueprintIndex}`);
      if (response.ok) {
        const data = await response.json();
        // Java'dan gelen veriyi (resim url'lerini vs) state'e atıyoruz
        // Eğer backend 'imageUrl' dönüyorsa ve biz 'uri' kullanıyorsak mapliyoruz:
        const formattedData = data.map((item: any) => ({
          id: item.id.toString(),
          uri: item.imageUrl || item.uri, 
          category: item.category
        }));
        setCurrentOutfit(formattedData);
      } else {
        console.error("Java Kombin Getirme Hatası:", response.status);
      }
    } catch (error) {
      console.error("Ağ Hatası (Kombin Çekilemedi):", error);
    } finally {
      setTimeout(() => setIsLoading(false), 300); // UI pürüzsüzlüğü için ufak gecikme
    }
  };

  // Bileşen ilk yüklendiğinde Kombini Java'dan çek
  useEffect(() => {
    fetchOutfitFromAPI(activeBlueprintIndex);
  }, []);

  const handleBlueprintChange = (index: 0 | 1 | 2) => {
    if (index !== activeBlueprintIndex) {
      setActiveBlueprintIndex(index);
      fetchOutfitFromAPI(index); 
    }
  };

  // 🌐 2. JAVA API'YE GERİ BİLDİRİM (LOG) GÖNDERME
  const sendFeedbackToAPI = async (feedbackType: string, reasonCode: string, targetIds: number[]) => {
    if (currentOutfit.length === 0) return;

    const outfitItemIds = currentOutfit.map(item => parseInt(item.id));
    const weatherString = weather ? `${weather.city}, ${weather.temp}` : "Bilinmiyor";

    const payload = {
      userId: 3, 
      outfitItemIds: outfitItemIds,
      feedbackType: feedbackType, 
      reasonCode: reasonCode,     
      targetItemIds: targetIds,   // 🚀 Kullanıcının seçtiği spesifik eşyalar!
      weatherContext: weatherString
    };

    try {
      await fetch('http://10.87.14.78:8080/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log(`✅ Feedback İletildi. Sebep: ${reasonCode}, Seçilenler: ${targetIds}`);
    } catch (error) {
      console.error("Java API Bağlantı Hatası:", error);
    }
  };

  // 🛑 MODAL İÇİ MANTIKLAR
  const handleReasonSelect = (reasonId: string) => {
    // Eğer sebep spesifik eşya seçimi gerektiriyorsa (Referans görsellerindeki gibi)
    if (['DONT_PAIR_THESE', 'TOO_WARM_FOR_WEATHER', 'TOO_COOL_FOR_WEATHER', 'EXCLUDE_SPECIFIC_ITEM'].includes(reasonId)) {
      setSelectedReasonCode(reasonId);
      setSelectedTargetItems([]); // Önceki seçimleri temizle
      setFeedbackStep('SELECT_ITEMS'); // Alt ekrana geç
    } else {
      // Eşya seçimi gerektirmeyen bir sebepse (Örn: Mismatched Categories) direkt gönder
      executeDislike(reasonId, []);
    }
  };

  const toggleTargetItem = (id: string) => {
    const numId = parseInt(id);
    setSelectedTargetItems(prev => 
      prev.includes(numId) ? prev.filter(i => i !== numId) : [...prev, numId]
    );
  };

  const executeDislike = (reason: string, targets: number[]) => {
    setFeedbackVisible(false);
    setFeedbackStep('REASON'); // Modalı sıfırla
    sendFeedbackToAPI('DISLIKE', reason, targets); 
    fetchOutfitFromAPI(activeBlueprintIndex); // Java'dan yeni kombin iste
  };

  const handleLike = () => {
    sendFeedbackToAPI('LIKE', 'NONE', []); 
    fetchOutfitFromAPI(activeBlueprintIndex); 
  };

  return (
    <View style={styles.aiTabContainer}>
      
      <View style={styles.aiTitleWrap}>
        <Text style={styles.aiTitleEmoji}>🦋</Text>
        <Text style={styles.aiTitleText}>Tell us which outfits you love</Text>
        <Text style={styles.aiTitleEmoji}>🦋</Text>
      </View>

      {/* 👑 PREMIUM KATMALI MENÜ */}
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

      {/* 🚀 DİNAMİK AI KOMBİN IZGARA ALANI */}
      <View style={styles.aiOutfitGrid}>
        {isLoading ? (
           <ActivityIndicator size="large" color="#1A1A1A" style={{ marginTop: 100 }} />
        ) : currentOutfit.length === 0 ? (
           <Text style={styles.emptyText}>Bu şablona uygun eşya bulunamadı.</Text>
        ) : (
           currentOutfit.map((item, index) => {
             const posStyle = COLLAGE_POSITIONS[index % COLLAGE_POSITIONS.length]; 
             return (
               <View key={`${item.id}-${index}`} style={[styles.dynamicItemContainer, posStyle as any]}>
                 <Image source={{ uri: item.uri }} style={styles.dynamicItemImage} />
               </View>
             );
           })
        )}
      </View>

      {/* AKSİYON BUTONLARI */}
      <View style={styles.aiActionRow}>
         <TouchableOpacity style={styles.aiActionBtnDislike} onPress={() => { setFeedbackStep('REASON'); setFeedbackVisible(true); }}>
           <Feather name="x" size={32} color="#FF3B30" />
         </TouchableOpacity>
         <TouchableOpacity style={styles.aiActionBtnNext} onPress={() => fetchOutfitFromAPI(activeBlueprintIndex)}>
           <MaterialCommunityIcons name="butterfly-outline" size={36} color="#1A1A1A" />
           <Text style={styles.aiNextText}>Next Outfit</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.aiActionBtnLike} onPress={handleLike}>
           <MaterialCommunityIcons name="heart" size={32} color="#34C759" />
         </TouchableOpacity>
      </View>

      {/* 🛑 GELİŞMİŞ MICRO-SORU BOTTOM SHEET (MODAL) */}
      <Modal visible={isFeedbackVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            {/* ADIM 1: SEBEP SEÇİMİ */}
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
                <TouchableOpacity style={styles.cancelFeedbackBtn} onPress={() => setFeedbackVisible(false)}>
                  <Text style={styles.cancelFeedbackText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ADIM 2: SPESİFİK EŞYA SEÇİMİ (Referans Tasarıma Göre) */}
            {feedbackStep === 'SELECT_ITEMS' && (
              <>
                <Text style={styles.sheetTitle}>Select items to exclude</Text>
                <Text style={styles.sheetSubtitle}>The selected clothes won't show up according to your feedback.</Text>
                
                <ScrollView contentContainerStyle={styles.selectionGrid} showsVerticalScrollIndicator={false}>
                  {currentOutfit.map(item => {
                    const isSelected = selectedTargetItems.includes(parseInt(item.id));
                    return (
                      <TouchableOpacity 
                        key={`select-${item.id}`} 
                        style={[styles.selectionCard, isSelected && styles.selectionCardActive]}
                        onPress={() => toggleTargetItem(item.id)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: item.uri }} style={styles.selectionImage} />
                        {/* Seçim İkonu (Pembe Tik) */}
                        <View style={[styles.checkboxIcon, isSelected && styles.checkboxIconActive]}>
                          {isSelected && <Feather name="check" size={14} color="#FFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* SİYAH DONE BUTONU */}
                <TouchableOpacity 
                  style={[styles.doneBtn, selectedTargetItems.length === 0 && { opacity: 0.5 }]} 
                  disabled={selectedTargetItems.length === 0}
                  onPress={() => executeDislike(selectedReasonCode, selectedTargetItems)}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, maxHeight: height * 0.8, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  sheetHandle: { width: 50, height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetSubtitle: { fontSize: 13, color: '#888', textAlign: 'center', fontWeight: '500', marginBottom: 5 },
  sheetTitle: { fontSize: 18, color: '#1A1A1A', textAlign: 'center', fontWeight: '700', marginBottom: 25 },
  feedbackOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  feedbackOptionText: { fontSize: 15, color: '#333', fontWeight: '500' },
  cancelFeedbackBtn: { marginTop: 15, paddingVertical: 15, alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12 },
  cancelFeedbackText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

  // 🛑 EŞYA SEÇİM EKRANI STİLLERİ (Referans tasarıma uygun)
  selectionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  selectionCard: { width: '48%', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 10, marginBottom: 15, position: 'relative', height: 140, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectionCardActive: { borderColor: '#FF6B81', backgroundColor: '#FFF0F2' },
  selectionImage: { width: '80%', height: '80%', resizeMode: 'contain' },
  checkboxIcon: { position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  checkboxIconActive: { backgroundColor: '#FF6B81', borderColor: '#FF6B81' },
  doneBtn: { backgroundColor: '#1A1A1A', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});