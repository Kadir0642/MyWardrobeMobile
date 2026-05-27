import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Dimensions, ActivityIndicator, ImageBackground, Modal, FlatList, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { apiClient } from '../../api/client'; 
import { COLORS } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const TRIP_VIBES = [
  { id: 'BUSINESS', label: 'Business' },
  { id: 'VACATION', label: 'Vacation' },
  { id: 'ADVENTURE', label: 'Adventure' },
  { id: 'ROMANTIC', label: 'Romantic' }
];

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
  const insets = useSafeAreaInsets(); 
  
  const [destination, setDestination] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('VACATION');
  const [isLoading, setIsLoading] = useState(false);

  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop'); 

  const [startDate, setStartDate] = useState(UPCOMING_DATES[0]);
  const [endDate, setEndDate] = useState(UPCOMING_DATES[3]); 
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'START' | 'END'>('START');

  const sheetPanY = useRef(new Animated.Value(height)).current;

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

  const calculateDays = () => {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0 ? 1 : diffDays;
  };

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
      if (date >= endDate) {
        const newEndDate = new Date(date);
        newEndDate.setDate(date.getDate() + 3);
        setEndDate(newEndDate);
      }
    } else {
      if (date < startDate) {
        alert("Bitiş tarihi, gidiş tarihinden önce olamaz.");
        return;
      }
      setEndDate(date);
    }
    closeCalendar();
  };

  const fetchRealWeather = async (city: string) => {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) return "Bilinmiyor";
      const { latitude, longitude } = geoData.results[0];

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();
      
      return `${weatherData.current_weather.temperature}°C`;
    } catch (error) {
      console.error("Hava durumu çekilemedi:", error);
      return "Bilinmiyor";
    }
  };

  const handleGenerateSuitcase = async () => {
    if (!destination) {
      alert("Lütfen bir rota belirleyin.");
      return;
    }
    
    const tripDays = calculateDays();
    const totalOutfitsToGenerate = tripDays + 5; 
    
    setIsLoading(true);
    
    try {
      const realTemp = await fetchRealWeather(destination);
      const dynamicWeatherContext = realTemp !== "Bilinmiyor" ? `${realTemp} civarı` : "Hava durumu bilinmiyor";

      const payload = {
        userId: 1, 
        mode: 'TRAVEL',
        magicContext: `${destination} seyahati. Tarz: ${selectedVibe}`,
        weatherContext: dynamicWeatherContext, 
        days: tripDays,
        totalOutfits: totalOutfitsToGenerate
      };

      const response = await apiClient.post('/capsules/generate', payload);

      setIsLoading(false);
      
      navigation.navigate('TravelResultScreen', { 
        capsuleData: response.data, 
        destination, 
        duration: tripDays,
        vibe: selectedVibe
      });
      
    } catch (error) {
      setIsLoading(false);
      console.error("🚨 Seyahat Kapsülü Hatası:", error);
      alert("Kapsül oluşturulurken bir sorun yaşandı.");
    }
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

      <View style={styles.formContainer}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.formIntroText}>Vestify AI will engineer the perfect capsule wardrobe for your journey, including alternative options.</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Where to?</Text>
            <View style={styles.inputWrapper}>
              <Feather name="map-pin" size={18} color={COLORS.text} />
              <TextInput 
                style={styles.input}
                placeholder="Destination (e.g. Paris, Tokyo...)"
                placeholderTextColor={COLORS.textSecondary}
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>When?</Text>
            <View style={styles.dateRow}>
               <TouchableOpacity style={styles.dateBox} activeOpacity={0.7} onPress={() => openCalendar('START')}>
                  <Text style={styles.dateLabel}>DEPARTURE</Text>
                  <Text style={styles.dateValue}>{formatDateLabel(startDate)}</Text>
               </TouchableOpacity>
               
               <Feather name="arrow-right" size={20} color={COLORS.textSecondary} />
               
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
            <Text style={styles.mainBtnText}>{isLoading ? 'ANALYZING WARDROBE...' : 'CURATE CAPSULE'}</Text>
            {!isLoading && <Feather name="briefcase" size={20} color={COLORS.surface} />}
          </TouchableOpacity>

        </ScrollView>
      </View>

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
                    {isSelected && <Feather name="check" size={20} color={COLORS.surface} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        </View>
      </Modal>

      {/* 🚀 LÜKS YAPAY ZEKA BEKLEME EKRANI */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(248, 246, 240, 0.95)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ transform: [{ scale: 1.5 }] }} />
            <Text style={{ marginTop: 30, fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: 2 }}>
                VESTIFY AI DÜŞÜNÜYOR
            </Text>
            <Text style={{ marginTop: 10, fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 40 }}>
                {destination ? `${destination} hava durumu analiz ediliyor ve dolabınızdaki en iyi parçalar eşleştiriliyor...` : 'Dolabınız analiz ediliyor, en iyi kombinler eşleştiriliyor...'}
            </Text>
        </View>
      </Modal>

    </View>
  );
} // FONKSİYON BURADA BİTİYOR

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  heroBackground: { width: '100%', height: height * 0.35, justifyContent: 'space-between' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 4, color: '#FFF' },
  backBtn: { padding: 5 },
  
  heroTextContainer: { paddingHorizontal: 30, paddingBottom: 30 },
  heroMainText: { fontSize: 42, fontWeight: '800', color: '#FFF', letterSpacing: -1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 10 },

  formContainer: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, overflow: 'hidden' },
  scrollContent: { paddingHorizontal: 30, paddingTop: 30 },
  
  formIntroText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 35, fontWeight: '500' },
  
  section: { marginBottom: 35 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: COLORS.text, marginBottom: 12 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.text, paddingVertical: 10 },
  input: { flex: 1, fontSize: 18, color: COLORS.text, fontWeight: '700', marginLeft: 10 },
  
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dateBox: { flex: 1, backgroundColor: COLORS.surface, padding: 15, borderRadius: 8, alignItems: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  dateLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 4 },
  dateValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  dateInfoText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 5, textAlign: 'left' },
  
  vibeList: { gap: 8 },
  vibeBtn: { paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, backgroundColor: COLORS.surface },
  vibeBtnActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  vibeText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  vibeTextActive: { color: COLORS.surface },
  
  mainBtn: { flexDirection: 'row', backgroundColor: COLORS.text, height: 70, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, borderRadius: 8 },
  mainBtnText: { color: COLORS.surface, fontSize: 13, fontWeight: '900', letterSpacing: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingTop: 15, maxHeight: height * 0.7 },
  sheetHandle: { width: 40, height: 5, backgroundColor: COLORS.border, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  
  dateListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dateListItemActive: { backgroundColor: COLORS.text, borderRadius: 12, paddingHorizontal: 20, borderBottomWidth: 0, marginVertical: 5 },
  dateListText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  dateListTextActive: { color: COLORS.surface, fontWeight: '800' }
});