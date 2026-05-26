import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Dimensions, ActivityIndicator, ImageBackground, Modal, FlatList, Animated, PanResponder } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 GÜVENLİ ALAN İÇİN EKLENDİ

const { width, height } = Dimensions.get('window');

// 🎨 VOGUE MINIMALIST PALET
const VOGUE = {
  bg: '#FFFFFF',
  text: '#1A1A1A',
  secondary: '#717171',
  border: '#1A1A1A',
  softBg: '#F9F9F9',
  line: '#EFEFEF'
};

const TRIP_VIBES = [
  { id: 'BUSINESS', label: 'Business' },
  { id: 'VACATION', label: 'Vacation' },
  { id: 'ADVENTURE', label: 'Adventure' },
  { id: 'ROMANTIC', label: 'Romantic' }
];

// 🚀 GELECEK 60 GÜNÜ ÜRETEN MOTOR (Lüks Takvim İçin)
const generateUpcomingDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};
const UPCOMING_DATES = generateUpcomingDates();

export default function TravelPlannerScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets(); // 🚀 TELEFONUN ALT/ÜST BOŞLUKLARINI HESAPLAR
  
  const [destination, setDestination] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('VACATION');
  const [isLoading, setIsLoading] = useState(false);

  // sbt uçak  fotosu
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop'); 

  // 🚀 TAKVİM STATE'LERİ
  const [startDate, setStartDate] = useState(UPCOMING_DATES[0]);
  const [endDate, setEndDate] = useState(UPCOMING_DATES[3]); // Varsayılan 3 gün
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'START' | 'END'>('START');

  // Modal Animasyonu
  const sheetPanY = useRef(new Animated.Value(height)).current;

  // Dinamik Arkaplan
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (destination.trim().length > 2) {
        setBgImage(`https://loremflickr.com/800/600/${encodeURIComponent(destination)}+city/all`);
      } else {
        setBgImage('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop');
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [destination]);

  // Gün Hesaplama Motoru
  const calculateDays = () => {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0 ? 1 : diffDays;
  };

  // 🚀 LÜKS TAKVİM MODALI AÇILIŞ/KAPANIŞ
  const openCalendar = (type: 'START' | 'END') => {
    setSelectingFor(type);
    setIsCalendarVisible(true);
    Animated.spring(sheetPanY, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
  };

  const closeCalendar = () => {
    Animated.timing(sheetPanY, { toValue: height, duration: 250, useNativeDriver: true }).start(() => {
      setIsCalendarVisible(false);
    });
  };

  const handleDateSelect = (date: Date) => {
    if (selectingFor === 'START') {
      setStartDate(date);
      // Eğer kullanıcı Başlangıcı, Bitişten sonraya seçerse; Bitişi otomatik olarak Başlangıcın 3 gün sonrasına at! (Mükemmel UX)
      if (date >= endDate) {
        const newEndDate = new Date(date);
        newEndDate.setDate(date.getDate() + 3);
        setEndDate(newEndDate);
      }
    } else {
      // Bitiş tarihi Başlangıçtan önce olamaz koruması
      if (date < startDate) {
        alert("Bitiş tarihi, gidiş tarihinden önce olamaz.");
        return;
      }
      setEndDate(date);
    }
    closeCalendar();
  };

  const handleGenerateSuitcase = () => {
    if (!destination) {
      alert("Please enter a destination.");
      return;
    }
    
    const tripDays = calculateDays();
    const totalOutfitsToGenerate = tripDays + 5; 
    
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('CapsuleResultScreen', { 
        destination, 
        duration: tripDays,
        totalOutfits: totalOutfitsToGenerate,
        vibe: selectedVibe 
      });
    }, 2000);
  };

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      
      <ImageBackground source={{ uri: bgImage }} style={styles.heroBackground} imageStyle={{ opacity: 0.8 }}>
        <View style={styles.heroOverlay} />
        <View style={{ paddingTop: insets.top }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>TRAVEL CURATOR</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        <View style={styles.heroTextContainer}>
           <Text style={styles.heroMainText}>{destination ? destination.toUpperCase() : 'PACK YOUR BAGS.'}</Text>
        </View>
      </ImageBackground>

      {/* VOGUE FORMU (Safe Area destekli) */}
      <View style={styles.formContainer}>
        {/* 🚀 DÜZELTME: paddingBottom'a insets.bottom eklendi. Ekranın altına taşma/buton gizlenme sorunu bitti! */}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.formIntroText}>Vestify AI will engineer the perfect capsule wardrobe for your journey, including alternative options.</Text>

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

          {/* 🚀 DİNAMİK TAKVİM ALANI */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>When?</Text>
            <View style={styles.dateRow}>
               <TouchableOpacity style={styles.dateBox} activeOpacity={0.7} onPress={() => openCalendar('START')}>
                  <Text style={styles.dateLabel}>DEPARTURE</Text>
                  <Text style={styles.dateValue}>{formatDateLabel(startDate)}</Text>
               </TouchableOpacity>
               
               <Feather name="arrow-right" size={20} color={VOGUE.secondary} />
               
               <TouchableOpacity style={styles.dateBox} activeOpacity={0.7} onPress={() => openCalendar('END')}>
                  <Text style={styles.dateLabel}>RETURN</Text>
                  <Text style={styles.dateValue}>{formatDateLabel(endDate)}</Text>
               </TouchableOpacity>
            </View>
            <Text style={styles.dateInfoText}>
               {calculateDays()} days trip. We'll pack <Text style={{fontWeight: '800'}}>{calculateDays() + 5} outfits</Text> for you.
            </Text>
          </View>

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

      {/* 🚀 VOGUE LÜKS TAKVİM MODALI (Dış Kütüphanesiz) */}
      <Modal visible={isCalendarVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeCalendar} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetPanY }] }]}>
            
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select {selectingFor === 'START' ? 'Departure' : 'Return'} Date</Text>

            <FlatList
              data={UPCOMING_DATES}
              keyExtractor={(item) => item.toISOString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              renderItem={({ item }) => {
                // Seçili olan tarihi bul
                const isSelected = selectingFor === 'START' 
                  ? item.toDateString() === startDate.toDateString() 
                  : item.toDateString() === endDate.toDateString();

                return (
                  <TouchableOpacity 
                    style={[styles.dateListItem, isSelected && styles.dateListItemActive]} 
                    onPress={() => handleDateSelect(item)}
                  >
                    <Text style={[styles.dateListText, isSelected && styles.dateListTextActive]}>
                      {formatDateLabel(item)}
                    </Text>
                    {isSelected && <Feather name="check" size={20} color={VOGUE.bg} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VOGUE.bg },
  
  heroBackground: { width: '100%', height: height * 0.35, justifyContent: 'space-between' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 4, color: '#FFF' },
  backBtn: { padding: 5 },
  
  heroTextContainer: { paddingHorizontal: 30, paddingBottom: 30 },
  heroMainText: { fontSize: 42, fontWeight: '800', color: '#FFF', letterSpacing: -1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 10 },

  formContainer: { flex: 1, backgroundColor: VOGUE.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, overflow: 'hidden' },
  scrollContent: { paddingHorizontal: 30, paddingTop: 30 },
  
  formIntroText: { fontSize: 13, color: VOGUE.secondary, lineHeight: 22, marginBottom: 35, fontWeight: '500' },
  
  section: { marginBottom: 35 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: VOGUE.text, marginBottom: 12 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: VOGUE.text, paddingVertical: 10 },
  input: { flex: 1, fontSize: 18, color: VOGUE.text, fontWeight: '700', marginLeft: 10 },
  
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dateBox: { flex: 1, backgroundColor: VOGUE.softBg, padding: 15, borderRadius: 8, alignItems: 'flex-start', borderWidth: 1, borderColor: VOGUE.line },
  dateLabel: { fontSize: 10, fontWeight: '800', color: VOGUE.secondary, letterSpacing: 1, marginBottom: 4 },
  dateValue: { fontSize: 16, fontWeight: '700', color: VOGUE.text },
  dateInfoText: { fontSize: 12, color: VOGUE.secondary, fontStyle: 'italic', marginTop: 5, textAlign: 'left' },
  
  vibeList: { gap: 8 },
  vibeBtn: { paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: '#DDD', borderRadius: 24 },
  vibeBtnActive: { backgroundColor: VOGUE.text, borderColor: VOGUE.text },
  vibeText: { fontSize: 12, fontWeight: '700', color: VOGUE.secondary },
  vibeTextActive: { color: VOGUE.bg },
  
  mainBtn: { flexDirection: 'row', backgroundColor: VOGUE.text, height: 70, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, borderRadius: 4 },
  mainBtnText: { color: VOGUE.bg, fontSize: 13, fontWeight: '900', letterSpacing: 2 },

  // LÜKS TAKVİM MODALI STİLLERİ
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: VOGUE.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingTop: 15, maxHeight: height * 0.7 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: VOGUE.text, marginBottom: 20, textAlign: 'center' },
  
  dateListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: VOGUE.line },
  dateListItemActive: { backgroundColor: VOGUE.text, borderRadius: 12, paddingHorizontal: 20, borderBottomWidth: 0, marginVertical: 5 },
  dateListText: { fontSize: 16, fontWeight: '600', color: VOGUE.text },
  dateListTextActive: { color: VOGUE.bg, fontWeight: '800' }
});