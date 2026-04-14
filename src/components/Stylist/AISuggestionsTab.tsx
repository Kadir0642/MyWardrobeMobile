import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// 🚀 ANA EKRANDAN GELEN GERÇEK DOLAP VERİSİ
interface AISuggestionsTabProps {
  allWardrobe: any[];
}

// 🎨 DİNAMİK KOLAJ KOORDİNATLARI (Eşya sayısına göre ekrana dağılım)
const COLLAGE_POSITIONS = [
  { top: 20, left: 20, width: 140, height: 170, zIndex: 2 },           // 0: Sol Üst
  { top: 50, right: 20, width: 130, height: 150, zIndex: 1 },          // 1: Sağ Üst
  { bottom: 30, left: 40, width: 130, height: 220, zIndex: 3 },        // 2: Sol Alt
  { bottom: 70, right: 40, width: 120, height: 100, zIndex: 4 },       // 3: Sağ Alt
  { top: '38%', left: '35%', width: 100, height: 100, zIndex: 10 },    // 4: Merkez (Aksesuar vb.)
  { top: 10, left: '35%', width: 90, height: 90, zIndex: 5 }           // 5: Üst Merkez
];

export default function AISuggestionsTab({ allWardrobe }: AISuggestionsTabProps) {
  const [isFeedbackVisible, setFeedbackVisible] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🧠 SENİN TASARLADIĞIN 3 KATMANLI ŞABLONLAR
  const AI_BLUEPRINTS = [
    ['Tops', 'Bottoms', 'Footwear', 'Accessories'],
    ['Full_body', 'Footwear', 'Accessories', 'Accessories', 'Accessories'],
    ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories', 'Accessories']
  ];

  // 🎰 AKILLI KOMBİN ÜRETİCİ MOTOR
  const generateNewOutfit = () => {
    setIsLoading(true);
    
    // Dolap boşsa işlem yapma
    if (!allWardrobe || allWardrobe.length === 0) {
      setIsLoading(false);
      return;
    }

    // 1. Rastgele bir şablon (Blueprint) seç
    const selectedBlueprint = AI_BLUEPRINTS[Math.floor(Math.random() * AI_BLUEPRINTS.length)];
    
    // 2. Şablondaki her kategori için gardıroptan rastgele bir eşya seç
    const newOutfitItems: any[] = [];
    const usedIds = new Set(); // Aynı aksesuarı iki kere basmamak için

    selectedBlueprint.forEach(category => {
      const matchingItems = allWardrobe.filter(item => item.category === category && !usedIds.has(item.id));
      
      if (matchingItems.length > 0) {
        const randomItem = matchingItems[Math.floor(Math.random() * matchingItems.length)];
        newOutfitItems.push(randomItem);
        usedIds.add(randomItem.id); // Eşyayı kullanıldı olarak işaretle
      }
    });

    // Hızlı bir yükleniyor animasyonu hissi için gecikme
    setTimeout(() => {
      setCurrentOutfit(newOutfitItems);
      setIsLoading(false);
    }, 500);
  };

  // Bileşen ilk yüklendiğinde ve dolap verisi geldiğinde ilk kombini oluştur
  useEffect(() => {
    if (allWardrobe.length > 0 && currentOutfit.length === 0) {
      generateNewOutfit();
    }
  }, [allWardrobe]);

  // 🛑 GERİ BİLDİRİM (CEZA) AKSİYONU
  const submitFeedback = (reason: string) => {
    console.log("RLHF Ceza Gönderildi:", reason);
    setFeedbackVisible(false);
    generateNewOutfit(); // Beğenilmediği için yenisini getir
  };

  // 💚 BEĞENME (ÖDÜL) AKSİYONU
  const handleLike = () => {
    console.log("RLHF Ödül Eklendi! (+1 Puan)");
    generateNewOutfit(); // Kaydetti, yenisine geç
  };

  return (
    <View style={styles.aiTabContainer}>
      <View style={styles.aiTitleWrap}>
        <Text style={styles.aiTitleEmoji}>🦋</Text>
        <Text style={styles.aiTitleText}>Tell us which outfits you love</Text>
        <Text style={styles.aiTitleEmoji}>🦋</Text>
      </View>

      {/* 🚀 DİNAMİK AI KOMBİN KOLAJ ALANI */}
      <View style={styles.aiOutfitGrid}>
        {isLoading ? (
           <ActivityIndicator size="large" color="#1A1A1A" style={{ marginTop: 100 }} />
        ) : currentOutfit.length === 0 ? (
           <Text style={styles.emptyText}>Dolabınızda bu şablona uygun yeterli eşya yok.</Text>
        ) : (
           currentOutfit.map((item, index) => {
             // 6 eşyadan fazlası gelirse diye mod alıyoruz ki çökmüş görünmesin
             const posStyle = COLLAGE_POSITIONS[index % COLLAGE_POSITIONS.length]; 
             return (
               <Image 
                 key={`${item.id}-${index}`} 
                 source={{ uri: item.uri }} 
                 style={[styles.dynamicItemImage, posStyle as any]} 
               />
             );
           })
        )}
      </View>

      {/* AKSİYON BUTONLARI (X, Kelebek, Kalp) */}
      <View style={styles.aiActionRow}>
         <TouchableOpacity style={styles.aiActionBtnDislike} onPress={() => setFeedbackVisible(true)}>
           <Feather name="x" size={32} color="#FF3B30" />
         </TouchableOpacity>

         <TouchableOpacity style={styles.aiActionBtnNext} onPress={generateNewOutfit}>
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
  aiTitleWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D1CFC7', paddingBottom: 15, marginTop: 15, width: '85%', justifyContent: 'center', gap: 10 },
  aiTitleEmoji: { fontSize: 18 },
  aiTitleText: { fontSize: 18, fontWeight: '500', color: '#1A1A1A' },
  
  aiOutfitGrid: { flex: 1, width: '100%', marginTop: 20, position: 'relative', alignItems: 'center' },
  dynamicItemImage: { position: 'absolute', resizeMode: 'contain' },
  emptyText: { color: '#888', marginTop: 100, fontSize: 14, fontWeight: '500' },

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