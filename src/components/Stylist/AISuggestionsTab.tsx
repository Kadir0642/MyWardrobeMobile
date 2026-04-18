import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// 🚀 ANA EKRANDAN GELEN GERÇEK VERİLER (Hava durumu eklendi)
interface AISuggestionsTabProps {
  allWardrobe: any[];
  weather: { temp: string; city: string; icon: string };
}
//  IZGARA (GRID) KOORDİNATLARI
// Ekran 2 Sütun ve 3 Satır olacak şekilde görünmez 6 odacığa bölündü.
const COLLAGE_POSITIONS = [
  { top: '2%', left: '4%', width: '44%', height: '30%' },    
  { top: '2%', right: '4%', width: '44%', height: '30%' },   
  { top: '34%', left: '4%', width: '44%', height: '30%' },   
  { top: '34%', right: '4%', width: '44%', height: '30%' },  
  { top: '66%', left: '4%', width: '44%', height: '30%' },   
  { top: '66%', right: '4%', width: '44%', height: '30%' }   
];

export default function AISuggestionsTab({ allWardrobe = [], weather }: AISuggestionsTabProps) {
  const [isFeedbackVisible, setFeedbackVisible] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeBlueprintIndex, setActiveBlueprintIndex] = useState<0 | 1 | 2>(0);

  // 3 KATMANLI ŞABLONLAR
  const AI_BLUEPRINTS = [
    ['Tops', 'Bottoms', 'Footwear', 'Accessories'],                                  
    ['Full_body', 'Footwear', 'Accessories', 'Accessories', 'Accessories'],          
    ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories', 'Accessories']       
  ];
// 🎰 AKILLI KOMBİN ÜRETİCİ MOTOR
  const generateNewOutfit = (targetIndex?: number) => {
    setIsLoading(true);
    if (allWardrobe.length === 0) { setIsLoading(false); return; }

    const indexToUse = targetIndex !== undefined ? targetIndex : activeBlueprintIndex;
    const selectedBlueprint = AI_BLUEPRINTS[indexToUse];
    
    const newOutfitItems: any[] = [];
    const usedIds = new Set(); 

    selectedBlueprint.forEach(category => {
      const matchingItems = allWardrobe.filter(item => item.category === category && !usedIds.has(item.id));
      if (matchingItems.length > 0) {
        const randomItem = matchingItems[Math.floor(Math.random() * matchingItems.length)];
        newOutfitItems.push(randomItem);
        usedIds.add(randomItem.id); 
      }
    });

    setTimeout(() => {
      setCurrentOutfit(newOutfitItems);
      setIsLoading(false);
    }, 500); 
  };

  useEffect(() => {
    if (allWardrobe.length > 0 && currentOutfit.length === 0) generateNewOutfit();
  }, [allWardrobe]);

  const handleBlueprintChange = (index: 0 | 1 | 2) => {
    if (index !== activeBlueprintIndex) {
      setActiveBlueprintIndex(index);
      generateNewOutfit(index); 
    }
  };

  // 🌐 JAVA SPRING BOOT API BAĞLANTISI (RLHF VERİ KÖPRÜSÜ)
  const sendFeedbackToAPI = async (feedbackType: string, reasonCode: string = 'NONE') => {
    if (currentOutfit.length === 0) return;

    // Ekranda o an gösterilen kıyafetlerin ID'lerini çıkartıyoruz
    const outfitItemIds = currentOutfit.map(item => parseInt(item.id));

    // Java'daki OutfitFeedbackDto ile birebir eşleşen JSON paketimiz
    const payload = {
      userId: 3, // TODO: Sisteme gerçek Auth eklenince burası dinamik olacak
      outfitItemIds: outfitItemIds,
      feedbackType: feedbackType, // 'LIKE' veya 'DISLIKE'
      reasonCode: reasonCode,     // Örn: 'COLOR_MISMATCH'
      targetItemIds: [],          // Şimdilik boş, ileride spesifik eşya seçimi ekleyebiliriz
      weatherContext: `${weather.city}, ${weather.temp}`
    };

    try {
      // Senin Java API ucun (IP adresini kontrol et)
      const response = await fetch('http://10.87.14.78:8080/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`✅ RLHF Datası Java'ya İletildi! Tip: ${feedbackType}, Sebep: ${reasonCode}`);
      } else {
        console.error("❌ Java API Hatası (HTTP " + response.status + ")");
      }
    } catch (error) {
      console.error("❌ Ağ Bağlantı Hatası: Sunucuya ulaşılamıyor.", error);
    }
  };

  // 🛑 ÇARPI (CEZA) AKSİYONU
  const submitFeedback = (reason: string) => {
    setFeedbackVisible(false);
    sendFeedbackToAPI('DISLIKE', reason); // Önce Java'ya gönder
    generateNewOutfit(); // Sonra ekranı yenile
  };

  // 💚 KALP (ÖDÜL) AKSİYONU
  const handleLike = () => {
    sendFeedbackToAPI('LIKE', 'NONE'); // Önce Java'ya gönder
    generateNewOutfit(); // Sonra ekranı yenile
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
           <Text style={styles.emptyText}>Dolabında bu şablona uygun yeterli eşya yok.</Text>
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
         <TouchableOpacity style={styles.aiActionBtnDislike} onPress={() => setFeedbackVisible(true)}>
           <Feather name="x" size={32} color="#FF3B30" />
         </TouchableOpacity>
         <TouchableOpacity style={styles.aiActionBtnNext} onPress={() => generateNewOutfit()}>
           <MaterialCommunityIcons name="butterfly-outline" size={36} color="#1A1A1A" />
           <Text style={styles.aiNextText}>Next Outfit</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.aiActionBtnLike} onPress={handleLike}>
           <MaterialCommunityIcons name="heart" size={32} color="#34C759" />
         </TouchableOpacity>
      </View>

      {/* 🛑 MICRO-SORU BOTTOM SHEET (MODAL) */}
      <Modal visible={isFeedbackVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
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
                <TouchableOpacity key={opt.id} style={styles.feedbackOptionRow} onPress={() => submitFeedback(opt.id)}>
                  <Text style={styles.feedbackOptionText}>{opt.label}</Text>
                  <Feather name="chevron-right" size={20} color="#C0C0C0" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.cancelFeedbackBtn} onPress={() => setFeedbackVisible(false)}>
              <Text style={styles.cancelFeedbackText}>Cancel</Text>
            </TouchableOpacity>
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
  bottomSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, maxHeight: height * 0.7, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  sheetHandle: { width: 50, height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', fontWeight: '600', marginBottom: 5 },
  sheetTitle: { fontSize: 19, color: '#1A1A1A', textAlign: 'center', fontWeight: '700', marginBottom: 25 },
  feedbackOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  feedbackOptionText: { fontSize: 16, color: '#333', fontWeight: '500' },
  cancelFeedbackBtn: { marginTop: 25, paddingVertical: 15, alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12 },
  cancelFeedbackText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' }
});