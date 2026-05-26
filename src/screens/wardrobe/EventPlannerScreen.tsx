import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Dimensions, ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// 🎨 VOGUE RUTHLESS MINIMALISM PALETTE
const VOGUE = {
  bg: '#FFFFFF',
  text: '#1A1A1A',
  secondary: '#717171',
  border: '#1A1A1A',
  softBg: '#F9F9F9',
  line: '#EFEFEF'
};

const EVENT_TYPES = [
  { id: 'WEDDING', label: 'Wedding / Gala', search: 'luxury+gala+event' },
  { id: 'DATE', label: 'Dinner / Date', search: 'romantic+dinner+date' },
  { id: 'BUSINESS', label: 'Business / Office', search: 'office+business+meeting' },
  { id: 'PARTY', label: 'Night Out / Club', search: 'night+club+party' },
  { id: 'CASUAL', label: 'Casual Meeting', search: 'coffee+shop+casual' }
];

const VIBE_TYPES = ['CLASSIC', 'SMART CASUAL', 'EDGY', 'MINIMALIST'];

export default function EventPlannerScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🚀 DİNAMİK ARKA PLAN MOTORU
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop');

  // Debounced Arkaplan Güncelleme (Sihirli Kutu veya Seçim Değişince)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (customPrompt.trim().length > 3) {
        setBgImage(`https://loremflickr.com/800/600/${encodeURIComponent(customPrompt)}+fashion/all`);
      } else if (selectedEvent) {
        const eventSearch = EVENT_TYPES.find(e => e.id === selectedEvent)?.search;
        setBgImage(`https://loremflickr.com/800/600/${eventSearch}/all`);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [customPrompt, selectedEvent]);

  const handleGenerate = () => {
    let finalContext = customPrompt || `${selectedEvent} - ${selectedVibe}`;
    
    setIsLoading(true);
    // Yapay Zeka Analiz Simülasyonu
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('EventResultScreen', { eventContext: finalContext });
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* 🚀 SİNEMATİK BAŞLIK */}
      <ImageBackground source={{ uri: bgImage }} style={styles.heroBackground} imageStyle={{ opacity: 0.85 }}>
        <View style={styles.heroOverlay} />
        
        <View style={{ paddingTop: insets.top }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="x" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EVENT CURATOR</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        <View style={styles.heroTextContainer}>
           <Text style={styles.heroMainText}>
             {selectedEvent ? EVENT_TYPES.find(e => e.id === selectedEvent)?.label.toUpperCase() : 'WHERE TO?'}
           </Text>
        </View>
      </ImageBackground>

      {/* 🚀 VOGUE FORM (Tam Ekran Deneyimi) */}
      <View style={styles.formContainer}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            
            <Text style={styles.formIntroText}>Tell us the social context, and Vestify AI will curate three distinct aesthetic directions for you.</Text>

            {/* OCCASION SELECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>The Occasion</Text>
              <View style={styles.grid}>
                {EVENT_TYPES.map(item => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.gridItem, selectedEvent === item.id && styles.activeItem]}
                    onPress={() => { setSelectedEvent(item.id); setCustomPrompt(''); }}
                  >
                    <Text style={[styles.gridLabel, selectedEvent === item.id && styles.activeLabel]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* VIBE SELECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>The Impression</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vibeRow}>
                {VIBE_TYPES.map(vibe => (
                  <TouchableOpacity 
                    key={vibe} 
                    style={[styles.vibeBtn, selectedVibe === vibe && styles.activeVibeBtn]}
                    onPress={() => { setSelectedVibe(vibe); setCustomPrompt(''); }}
                  >
                    <Text style={[styles.vibeText, selectedVibe === vibe && styles.activeVibeText]}>{vibe}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* MAGIC BOX (SİHİRLİ KUTU) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Or whisper details to AI</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: Rooftop party in Manhattan, want to be the sharpest person in the room..."
                  placeholderTextColor={VOGUE.secondary}
                  multiline
                  maxLength={150}
                  value={customPrompt}
                  onChangeText={(t) => {
                    setCustomPrompt(t);
                    if(t.length > 0) { setSelectedEvent(null); setSelectedVibe(null); }
                  }}
                />
              </View>
            </View>

            {/* ACTION BUTTON */}
            <TouchableOpacity 
              style={[styles.mainBtn, (!customPrompt && (!selectedEvent || !selectedVibe)) && styles.disabledBtn]}
              onPress={handleGenerate}
              disabled={isLoading || (!customPrompt && (!selectedEvent || !selectedVibe))}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.mainBtnText}>CURATE ALTERNATIVES</Text>
                  <Feather name="arrow-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VOGUE.bg },
  
  // CINEMATIC HEADER STYLES
  heroBackground: { width: '100%', height: height * 0.35, justifyContent: 'space-between' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 4, color: '#FFF' },
  backBtn: { padding: 5 },
  heroTextContainer: { paddingHorizontal: 30, paddingBottom: 30 },
  heroMainText: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: -1 },

  // VOGUE FORM CONTAINER
  formContainer: { flex: 1, backgroundColor: VOGUE.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, overflow: 'hidden' },
  scrollContent: { paddingHorizontal: 30, paddingTop: 30 },
  formIntroText: { fontSize: 13, color: VOGUE.secondary, lineHeight: 22, marginBottom: 35, fontWeight: '500' },
  
  section: { marginBottom: 35 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: VOGUE.text, marginBottom: 15 },
  
  // TILES STYLES
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1, borderColor: '#EEE', borderRadius: 4 },
  activeItem: { backgroundColor: VOGUE.text, borderColor: VOGUE.text },
  gridLabel: { fontSize: 13, fontWeight: '600', color: VOGUE.text },
  activeLabel: { color: VOGUE.bg },
  
  // VIBE PILLS
  vibeRow: { gap: 10 },
  vibeBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: VOGUE.softBg, borderRadius: 24, borderWidth: 1, borderColor: '#F0F0F0' },
  activeVibeBtn: { backgroundColor: VOGUE.text, borderColor: VOGUE.text },
  vibeText: { fontSize: 12, fontWeight: '700', color: VOGUE.secondary },
  activeVibeText: { color: VOGUE.bg },
  
  // MAGIC BOX STYLES
  inputContainer: { backgroundColor: VOGUE.softBg, padding: 20, minHeight: 120, borderLeftWidth: 3, borderLeftColor: VOGUE.text, borderRadius: 4 },
  input: { fontSize: 14, color: VOGUE.text, fontWeight: '500', textAlignVertical: 'top', lineHeight: 20 },
  
  // MAIN BUTTON
  mainBtn: { flexDirection: 'row', backgroundColor: VOGUE.text, height: 70, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, borderRadius: 4 },
  mainBtnText: { color: VOGUE.bg, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  disabledBtn: { opacity: 0.1 }
});