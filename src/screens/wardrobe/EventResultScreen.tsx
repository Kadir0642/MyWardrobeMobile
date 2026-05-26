import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, FlatList, SafeAreaView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../theme/theme'; 
import PremiumToast from '../../components/PremiumToast';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

// Şimdilik UI'ı test etmek için oluşturduğumuz MOCK (Sahte) Veri.
// Java Backend'i bağladığımızda bu veriler API'den (Gemini'den) dinamik gelecek.
const MOCK_EVENT_RESULTS = {
  eventTitle: "Düğün & Klasik Şıklık",
  aiContext: "Eski sevgilimin düğününe gidiyorum, çok iddialı olmalıyım.",
  options: [
    {
      id: "opt_1",
      optionName: "Gözler Üzerinde",
      optionBadge: "En İddialı",
      userItems: [
        { id: "12", uri: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=200&auto=format&fit=crop" }, // Ceket
        { id: "45", uri: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=200&auto=format&fit=crop" }, // Gömlek
        { id: "88", uri: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=200&auto=format&fit=crop" }  // Pantolon
      ],
      partnerItem: {
        brand: "Rolex",
        name: "Submariner Date",
        price: "Premium",
        category: "Aksesuar"
      },
      stylistPitch: "Koyu renk takım elbisenin yarattığı keskin ve maskülen havayı, çelik bir Rolex ile tamamlamak mekana girdiğiniz an tüm dikkatleri üzerinize çekecek."
    },
    {
      id: "opt_2",
      optionName: "Modern Janti",
      optionBadge: "Smart Casual",
      userItems: [
        { id: "15", uri: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=200&auto=format&fit=crop" },
        { id: "92", uri: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=200&auto=format&fit=crop" }
      ],
      partnerItem: {
        brand: "Prada",
        name: "Deri Loafer",
        price: "24.500 TL",
        category: "Ayakkabı"
      },
      stylistPitch: "Aşırıya kaçmadan şık görünmenin anahtarı kaliteli bir loafer ayakkabıdır. Bu Prada ayakkabı, kombininize zahmetsiz bir elitlik katıyor."
    },
    {
      id: "opt_3",
      optionName: "Güvenli Liman",
      optionBadge: "Klasik",
      userItems: [
        { id: "19", uri: "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=200&auto=format&fit=crop" },
        { id: "33", uri: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=200&auto=format&fit=crop" }
      ],
      partnerItem: {
        brand: "Massimo Dutti",
        name: "İpek Kravat",
        price: "1.299 TL",
        category: "Aksesuar"
      },
      stylistPitch: "Geleneksel çizgilerden şaşmayan, ancak detaylardaki ipek dokunuşuyla kalitesini belli eden asil bir görünüm."
    }
  ]
};

export default function EventResultScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const [toastVisible, setToastVisible] = useState(false);

  // İleride AISuggestionsTab'dan gelen veriyi buradan alacağız
  // const { eventData } = route.params || {};
  const eventData = MOCK_EVENT_RESULTS; // Şimdilik UI test için MOCK veri

  const handleSaveLook = (optionName: string) => {
    // İleride Backend'e kaydetme kodu buraya gelecek
    setToastVisible(true);
  };

  const renderOutfitOption = ({ item, index }: { item: any, index: number }) => (
    <View style={styles.outfitCard}>
      
      {/* Kart Başlığı */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.optionLabel}>Alternatif {index + 1}</Text>
          <Text style={styles.optionName}>{item.optionName}</Text>
        </View>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{item.optionBadge}</Text>
        </View>
      </View>

      {/* Dolabından Seçilen Parçalar */}
      <View style={styles.userItemsSection}>
        <Text style={styles.sectionTitle}>Sizin Dolabınızdan</Text>
        <View style={styles.userItemsGrid}>
          {item.userItems.map((uItem: any, idx: number) => (
            <View key={idx} style={styles.userItemBox}>
              <Image source={{ uri: uItem.uri }} style={styles.itemImage} />
            </View>
          ))}
        </View>
      </View>

      {/* Vestify Upsell (Partner Önerisi) */}
      <View style={styles.partnerSection}>
        <View style={styles.partnerHeader}>
          <View style={styles.partnerIconWrap}>
            <Feather name="star" size={14} color="#FFF" />
          </View>
          <Text style={styles.partnerTitle}>Eksik Parça Önerisi</Text>
        </View>
        
        <View style={styles.partnerItemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerBrand}>{item.partnerItem.brand}</Text>
            <Text style={styles.partnerName}>{item.partnerItem.name}</Text>
          </View>
          <TouchableOpacity style={styles.buyBtn}>
            <Text style={styles.buyBtnText}>İncele</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.stylistPitch}>"{item.stylistPitch}"</Text>
      </View>

      {/* Aksiyon Butonu */}
      <TouchableOpacity 
        style={styles.saveBtn} 
        activeOpacity={0.8}
        onPress={() => handleSaveLook(item.optionName)}
      >
        <MaterialCommunityIcons name="hanger" size={20} color="#FFF" />
        <Text style={styles.saveBtnText}>Bu Kombini Dolaba Ekle</Text>
      </TouchableOpacity>

    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Üst Kısım (Header) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Vestify AI Özel Etkinlik</Text>
        </View>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Etkinlik Bilgisi */}
        <View style={styles.contextSection}>
          <Text style={styles.contextMainTitle}>{eventData.eventTitle}</Text>
          {eventData.aiContext && (
            <View style={styles.aiContextBox}>
              <MaterialCommunityIcons name="robot-outline" size={16} color={COLORS.primary} style={{ marginTop: 2 }}/>
              <Text style={styles.aiContextText}>"{eventData.aiContext}"</Text>
            </View>
          )}
        </View>

        {/* 3'lü Alternatif Carousel */}
        <View style={styles.carouselWrapper}>
          <FlatList
            data={eventData.options}
            renderItem={renderOutfitOption}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 20} 
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 20, paddingBottom: 20 }}
          />
        </View>

      </ScrollView>

      <PremiumToast visible={toastVisible} message="Kombin başarıyla kaydedildi! 🦋" onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 40 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 1 },

  contextSection: { paddingHorizontal: 25, marginBottom: 30 },
  contextMainTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, lineHeight: 34 },
  aiContextBox: { flexDirection: 'row', backgroundColor: '#F0F5F2', padding: 12, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#D0E3D9', alignItems: 'flex-start', gap: 8 },
  aiContextText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '600', fontStyle: 'italic', lineHeight: 20 },

  carouselWrapper: { width: '100%' },
  
  outfitCard: { width: CARD_WIDTH, backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.medium },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  optionLabel: { fontSize: 11, fontWeight: '800', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  optionName: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  badgeContainer: { backgroundColor: COLORS.text, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: COLORS.surface, fontSize: 10, fontWeight: '700' },

  userItemsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
  userItemsGrid: { flexDirection: 'row', gap: 10 },
  userItemBox: { width: 65, height: 65, backgroundColor: COLORS.background, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  itemImage: { width: '70%', height: '70%', resizeMode: 'contain' },

  partnerSection: { backgroundColor: '#F9FBF9', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#D0E3D9', marginBottom: 25 },
  partnerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  partnerIconWrap: { backgroundColor: COLORS.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  partnerTitle: { fontSize: 12, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase' },
  
  partnerItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  partnerBrand: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  partnerName: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },
  buyBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  buyBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.text },
  
  stylistPitch: { fontSize: 13, fontStyle: 'italic', color: COLORS.textSecondary, lineHeight: 20 },

  saveBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, ...SHADOWS.light },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});