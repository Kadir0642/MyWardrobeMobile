import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const VOGUE = {
  bg: '#FFFFFF',
  text: '#1A1A1A',
  secondary: '#717171',
  border: '#1A1A1A', // Jilet gibi keskin siyah çizgiler
  softBg: '#F9F9F9'
};

const TRIP_VIBES = [
  { id: 'BUSINESS', label: 'Business', icon: 'briefcase' },
  { id: 'VACATION', label: 'Vacation', icon: 'sun' },
  { id: 'ADVENTURE', label: 'Adventure', icon: 'map' },
  { id: 'ROMANTIC', label: 'Romantic', icon: 'heart' }
];

export default function TravelPlannerScreen() {
  const navigation = useNavigation<any>();
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [selectedVibe, setSelectedVibe] = useState('VACATION');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSuitcase = () => {
    if (!destination) {
      alert("Please enter a destination.");
      return;
    }
    
    setIsLoading(true);
    // 🚀 BURASI KRİTİK: Java CapsuleService'e gidecek veri!
    // Şimdilik 2 saniye loading gösterip sonuç ekranına uçuyoruz.
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('CapsuleResultScreen', { 
        destination, 
        duration: days,
        vibe: selectedVibe 
      });
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={VOGUE.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TRAVEL CURATOR</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.heroTitle}>Pack your bags.</Text>
        <Text style={styles.heroSub}>Vestify AI will engineer the perfect capsule wardrobe for your journey.</Text>

        {/* DESTINATION */}
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

        {/* DURATION & VIBE ROW */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 15 }]}>
            <Text style={styles.sectionLabel}>How many days?</Text>
            <View style={styles.inputWrapper}>
               <TextInput 
                 style={styles.input}
                 keyboardType="numeric"
                 value={days}
                 onChangeText={setDays}
               />
            </View>
          </View>

          <View style={[styles.section, { flex: 2 }]}>
            <Text style={styles.sectionLabel}>Trip Type</Text>
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
        </View>

        {/* STYLIST NOTE (AESTHETIC) */}
        <View style={styles.infoBox}>
           <MaterialCommunityIcons name="format-quote-open" size={24} color={VOGUE.text} />
           <Text style={styles.infoText}>
             "The key to a successful journey is not what you take, but what you leave behind. We curate only the essentials."
           </Text>
        </View>

        {/* CTA BUTTON */}
        <TouchableOpacity 
          style={styles.mainBtn} 
          onPress={handleGenerateSuitcase}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.mainBtnText}>GENERATE SUITCASE</Text>
              <Feather name="briefcase" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VOGUE.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  headerTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 4, color: VOGUE.text },
  backBtn: { padding: 5 },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 40, paddingTop: 20 },
  
  heroTitle: { fontSize: 40, fontWeight: '700', color: VOGUE.text, marginBottom: 8, letterSpacing: -1 },
  heroSub: { fontSize: 14, color: VOGUE.secondary, lineHeight: 22, marginBottom: 40, fontWeight: '400' },
  
  section: { marginBottom: 30 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: VOGUE.text, marginBottom: 12 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: VOGUE.text, paddingVertical: 10 },
  input: { flex: 1, fontSize: 16, color: VOGUE.text, fontWeight: '600', marginLeft: 10 },
  
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  
  vibeList: { gap: 8 },
  vibeBtn: { paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#DDD', borderRadius: 2 },
  vibeBtnActive: { backgroundColor: VOGUE.text, borderColor: VOGUE.text },
  vibeText: { fontSize: 12, fontWeight: '700', color: VOGUE.secondary },
  vibeTextActive: { color: VOGUE.bg },

  infoBox: { marginVertical: 30, padding: 25, backgroundColor: VOGUE.softBg, borderLeftWidth: 4, borderLeftColor: VOGUE.text },
  infoText: { fontSize: 14, color: VOGUE.text, fontStyle: 'italic', lineHeight: 24, fontWeight: '500' },
  
  mainBtn: { flexDirection: 'row', backgroundColor: VOGUE.text, height: 70, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 },
  mainBtnText: { color: VOGUE.bg, fontSize: 13, fontWeight: '900', letterSpacing: 2 }
});