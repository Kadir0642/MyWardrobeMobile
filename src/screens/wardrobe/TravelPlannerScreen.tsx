import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Dimensions, ActivityIndicator, ImageBackground } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// 🎨 VOGUE MINIMALIST PALET
const VOGUE = {
  bg: '#FFFFFF',
  text: '#1A1A1A',
  secondary: '#717171',
  border: '#1A1A1A',
  softBg: '#F9F9F9'
};

const TRIP_VIBES = [
  { id: 'BUSINESS', label: 'Business' },
  { id: 'VACATION', label: 'Vacation' },
  { id: 'ADVENTURE', label: 'Adventure' },
  { id: 'ROMANTIC', label: 'Romantic' }
];

export default function TravelPlannerScreen() {
  const navigation = useNavigation<any>();
  
  const [destination, setDestination] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('VACATION');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🚀 TAKVİM STATE'LERİ (Mock Data - İleride DatePicker kütüphanesi bağlanabilir)
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 3))); // Varsayılan 3 gün sonrası

  // 🚀 DİNAMİK ARKA PLAN MOTORU
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop');

  // Kullanıcı şehir yazdıkça arkaplanı dinamik değiştiren simülasyon (LoremFlickr kullanıyoruz)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (destination.trim().length > 2) {
        // Not: Gerçek projede buraya kendi Unsplash/Pexels API'ni bağlayabilirsin. Şimdilik test için dinamik görsel çekiyoruz.
        setBgImage(`https://loremflickr.com/800/600/${encodeURIComponent(destination)}+city/all`);
      } else {
        setBgImage('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop');
      }
    }, 800); // 800ms bekler, kullanıcı yazmayı bitirince fotoğrafı çeker (Performans için)

    return () => clearTimeout(delayDebounceFn);
  }, [destination]);

  // Gün Sayısı Hesaplama
  const calculateDays = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  const handleGenerateSuitcase = () => {
    if (!destination) {
      alert("Lütfen bir rota belirleyin.");
      return;
    }
    
    const tripDays = calculateDays();
    // 🚀 STRATEJİK HAMLE: Gidilecek gün + 5 yedek kombin!
    const totalOutfitsToGenerate = tripDays + 5; 
    
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      // Backend'e totalOutfitsToGenerate sayısını yollayacağız.
      console.log(`Seyahat: ${tripDays} gün. Üretilecek Kombin: ${totalOutfitsToGenerate} adet (5 Yedek)`);
      navigation.navigate('CapsuleResultScreen', { 
        destination, 
        duration: tripDays,
        totalOutfits: totalOutfitsToGenerate, // Yeni parametre
        vibe: selectedVibe 
      });
    }, 2000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      
      {/* 🚀 SİNEMATİK DİNAMİK BAŞLIK (Cinematic Hero Image) */}
      <ImageBackground source={{ uri: bgImage }} style={styles.heroBackground} imageStyle={{ opacity: 0.8 }}>
        {/* Karartma katmanı (Yazıların okunması için) */}
        <View style={styles.heroOverlay} />
        
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>TRAVEL CURATOR</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        <View style={styles.heroTextContainer}>
           <Text style={styles.heroMainText}>{destination ? destination.toUpperCase() : 'PACK YOUR BAGS.'}</Text>
        </View>
      </ImageBackground>

      {/* 🚀 VOGUE FORMU (Bembeyaz ve Keskin) */}
      <View style={styles.formContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.formIntroText}>Vestify AI will engineer the perfect capsule wardrobe for your journey, including alternative options.</Text>

          {/* ROTA SEÇİMİ */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Where to?</Text>
            <View style={styles.inputWrapper}>
              <Feather name="map-pin" size={18} color={VOGUE.text} />
              <TextInput 
                style={styles.input}
                placeholder="Destination (e.g. Paris, Tokyo...)"
                placeholderTextColor={VOGUE.secondary}
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          {/* 🚀 TAKVİM (BAŞLANGIÇ VE BİTİŞ) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>When?</Text>
            <View style={styles.dateRow}>
               <TouchableOpacity style={styles.dateBox} activeOpacity={0.7} onPress={() => alert('Takvim Modalı Açılacak')}>
                  <Text style={styles.dateLabel}>DEPARTURE</Text>
                  <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
               </TouchableOpacity>
               <Feather name="arrow-right" size={20} color={VOGUE.secondary} />
               <TouchableOpacity style={styles.dateBox} activeOpacity={0.7} onPress={() => alert('Takvim Modalı Açılacak')}>
                  <Text style={styles.dateLabel}>RETURN</Text>
                  <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
               </TouchableOpacity>
            </View>
            <Text style={styles.dateInfoText}>
               {calculateDays()} days trip. We'll pack <Text style={{fontWeight: '800'}}>{calculateDays() + 5} outfits</Text> for you.
            </Text>
          </View>

          {/* SEYAHAT TARZI */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Trip Vibe</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vibeList}>
              {TRIP_VIBES.map(vibe => (
                <TouchableOpacity 
                  key={vibe.id} 
                  style={[styles.vibeBtn, selectedVibe === vibe.id && styles.vibeBtnActive]}
                  onPress={() => setSelectedVibe(vibe.id)}
                >
                  <Text style={[styles.vibeText, selectedVibe === vibe.id && styles.vibeTextActive]}>{vibe.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* CTA BUTONU */}
          <TouchableOpacity 
            style={styles.mainBtn} 
            onPress={handleGenerateSuitcase}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.mainBtnText}>CURATE CAPSULE</Text>
                <Feather name="briefcase" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VOGUE.bg },
  
  // SİNEMATİK BAŞLIK STİLLERİ
  heroBackground: { width: '100%', height: height * 0.35, justifyContent: 'space-between' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }, // Siyah transparanlık
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 4, color: '#FFF' },
  backBtn: { padding: 5 },
  
  heroTextContainer: { paddingHorizontal: 30, paddingBottom: 30 },
  heroMainText: { fontSize: 42, fontWeight: '800', color: '#FFF', letterSpacing: -1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 10 },

  // VOGUE FORM STİLLERİ (Beyaz Zemin)
  formContainer: { flex: 1, backgroundColor: VOGUE.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, overflow: 'hidden' },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 40, paddingTop: 30 },
  
  formIntroText: { fontSize: 13, color: VOGUE.secondary, lineHeight: 22, marginBottom: 35, fontWeight: '500' },
  
  section: { marginBottom: 35 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: VOGUE.text, marginBottom: 12 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: VOGUE.text, paddingVertical: 10 },
  input: { flex: 1, fontSize: 18, color: VOGUE.text, fontWeight: '700', marginLeft: 10 },
  
  // TAKVİM STİLLERİ
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dateBox: { flex: 1, backgroundColor: VOGUE.softBg, padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  dateLabel: { fontSize: 10, fontWeight: '800', color: VOGUE.secondary, letterSpacing: 1, marginBottom: 4 },
  dateValue: { fontSize: 18, fontWeight: '700', color: VOGUE.text },
  dateInfoText: { fontSize: 12, color: VOGUE.secondary, fontStyle: 'italic', marginTop: 5, textAlign: 'center' },
  
  vibeList: { gap: 8 },
  vibeBtn: { paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: '#DDD', borderRadius: 24 },
  vibeBtnActive: { backgroundColor: VOGUE.text, borderColor: VOGUE.text },
  vibeText: { fontSize: 12, fontWeight: '700', color: VOGUE.secondary },
  vibeTextActive: { color: VOGUE.bg },
  
  mainBtn: { flexDirection: 'row', backgroundColor: VOGUE.text, height: 70, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, borderRadius: 4 },
  mainBtnText: { color: VOGUE.bg, fontSize: 13, fontWeight: '900', letterSpacing: 2 }
});