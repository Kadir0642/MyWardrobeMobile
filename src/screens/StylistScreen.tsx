import React, { useState, useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClothingItem } from '../types';
import DraggableItem from '../components/DraggableItem';

// Kombin (AI create) ekranı

export default function StylistScreen() {
  const [currentOutfit, setCurrentOutfit] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);

  const route = useRoute<any>(); // Vitrin'den gelen kargoyu (Çapa ID'sini) okumak için
  const anchorItemId = route.params?.anchorItemId; // Eğer Vitrin'den geldiysek burada bir ID olacak

// Ekran açıldığında veya Vitrin'den yeni bir Çapa ID'si geldiğinde çalışır:
  useEffect(() => {
    if (anchorItemId) {
      // 1. SENARYO: Kullanıcı "Sihirli Değnek" ile geldi! Java'daki yepyeni Çapa Algoritmanı çalıştır!
      fetchOutfitFromAnchor(anchorItemId);
    } else {
      // 2. SENARYO: Kullanıcı normal menüden tıkladı (Varsayılan Günün Önerisi)
      fetchDefaultRecommendation();
    }
  }, [anchorItemId]);

  // JAVA'DAKİ YENİ ÇAPA (ANCHOR) ENDPOINT'İMİZİ ÇAĞIRAN FONKSİYON!
  const fetchOutfitFromAnchor = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://10.87.14.78:8080/api/v1/clothes/${id}/generate-outfit`);
      if (response.ok) {
        const data: ClothingItem[] = await response.json();
        setCurrentOutfit(data); // Java'nın ürettiği muazzam kombini ekrana bas!
      }
    } catch (error) {
      console.error("Çapa Kombin Hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Varsayılan öneri sistemimiz (Normal tıklamalar için)
  const fetchDefaultRecommendation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://10.87.14.78:8080/api/v1/clothes/3');
      if (response.ok) {
        const data: ClothingItem[] = await response.json();
        setCurrentOutfit(data.slice(0, 3)); 
      }
    } catch (error) {
      console.error("AI Bağlantı Hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = () => {
    Alert.alert("Harika!", "Bu kombini günün kombini (OOTD) olarak kaydettik.");
    fetchDefaultRecommendation();
  };

  const submitFeedback = (reason: string) => {
    setIsFeedbackVisible(false);
    console.log("Feedback Gönderildi:", reason);
    fetchDefaultRecommendation();
  };

  return (
    <View style={styles.stylistContainer}>
      
      <View style={styles.weatherHeader}>
        <View style={styles.dateBox}>
          <Ionicons name="calendar-outline" size={20} color="#7F8C8D" />
          <Text style={styles.dateText}>16 Mart Pazartesi</Text>
        </View>
        <View style={styles.weatherBox}>
          <Text style={styles.weatherTemp}>18°C</Text>
          <Ionicons name="partly-sunny" size={24} color="#F39C12" />
          <Text style={styles.weatherCity}>İstanbul</Text>
        </View>
      </View>

      <Text style={styles.stylistTitle}>Günün Önerisi ✨</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#3498DB" style={{ marginTop: 100 }} />
      ) : (
        <>
          <View style={styles.outfitCanvas}>
            {currentOutfit.map((item, index) => (
              <DraggableItem key={item.id} item={item} initialX={100} initialY={index * 120} zIndex={10 - index} />
            ))}
          </View>

          <View style={styles.feedbackContainer}>
            <TouchableOpacity style={styles.dislikeButton} onPress={() => setIsFeedbackVisible(true)}>
              <Ionicons name="close" size={40} color="#E74C3C" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <Ionicons name="heart" size={40} color="#2ECC71" />
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={isFeedbackVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Bu kombinde neyi sevmedin?</Text>
            <Text style={styles.sheetSubtitle}>Bunu bilmek tarzını daha iyi öğrenmemi sağlayacak.</Text>
            <TouchableOpacity style={styles.reasonButton} onPress={() => submitFeedback("Renkler Uyumsuz")}><Text style={styles.reasonText}>🎨 Renkler birbirine uymadı</Text></TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={() => submitFeedback("Hava Durumuna Ters")}><Text style={styles.reasonText}>🌤️ Hava durumuna uygun değil</Text></TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={() => submitFeedback("Tarzım Değil")}><Text style={styles.reasonText}>👗 Benim tarzım değil</Text></TouchableOpacity>
            <TouchableOpacity style={styles.reasonButton} onPress={() => submitFeedback("Aynı Parçalar")}><Text style={styles.reasonText}>🔄 Bunları hep giyiyorum</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelSheetButton} onPress={() => setIsFeedbackVisible(false)}><Text style={styles.cancelSheetText}>Vazgeç</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  stylistContainer: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50, alignItems: 'center' },
  stylistTitle: { fontSize: 26, fontWeight: '800', color: '#2C3E50' },
  outfitCanvas: { flex: 1, width: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, marginVertical: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, position: 'relative', overflow: 'hidden' },
  feedbackContainer: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', paddingBottom: 20 },
  likeButton: { backgroundColor: '#EAFAF1', padding: 15, borderRadius: 40, elevation: 2 },
  dislikeButton: { backgroundColor: '#FDEDEC', padding: 15, borderRadius: 40, elevation: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.2, shadowRadius: 10 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E50', marginBottom: 5 },
  sheetSubtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 20, textAlign: 'center' },
  reasonButton: { width: '100%', backgroundColor: '#F8F9FA', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#E5E8E8' },
  reasonText: { fontSize: 16, fontWeight: '600', color: '#34495E' },
  cancelSheetButton: { marginTop: 10, padding: 10 },
  cancelSheetText: { fontSize: 16, fontWeight: 'bold', color: '#E74C3C' },
  
  // Hava Durumu Başlığı Stilleri
  weatherHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '90%', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 15, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#34495E' },
  weatherBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weatherTemp: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  weatherCity: { fontSize: 12, color: '#7F8C8D' },
});