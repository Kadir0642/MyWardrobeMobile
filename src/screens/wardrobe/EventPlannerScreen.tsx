import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Dimensions, ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';
import { COLORS } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

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

  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop');

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

  const handleGenerate = async () => {
    let finalContext = customPrompt || `${selectedEvent} - ${selectedVibe}`;
    
    setIsLoading(true);

    try {
      const payload = {
        userId: 1, 
        mode: 'EVENT',
        magicContext: finalContext,
        weatherContext: "Belirtilmedi", 
        days: 1, 
        totalOutfits: 3 
      };

      const response = await apiClient.post('/capsules/generate', payload);

      setIsLoading(false);
      
      navigation.navigate('EventResultScreen', { 
        capsuleData: response.data, 
        eventContext: finalContext 
      });
      
    } catch (error) {
      setIsLoading(false);
      console.error("🚨 Etkinlik Kombini Hatası:", error);
      alert("Kombinler oluşturulurken AI motorunda yoğunluk yaşandı, lütfen tekrar deneyin.");
    }
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.formContainer}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.formIntroText}>Tell us the social context, and Vestify AI will curate three distinct aesthetic directions for you.</Text>

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

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Or whisper details to AI</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: Rooftop party in Manhattan, want to be the sharpest person in the room..."
                  placeholderTextColor={COLORS.textSecondary}
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

            <TouchableOpacity 
              style={[styles.mainBtn, (!customPrompt && (!selectedEvent || !selectedVibe)) && styles.disabledBtn]}
              onPress={handleGenerate}
              disabled={isLoading || (!customPrompt && (!selectedEvent || !selectedVibe))}
            >
              <Text style={styles.mainBtnText}>{isLoading ? 'CURATING...' : 'CURATE ALTERNATIVES'}</Text>
              {!isLoading && <Feather name="arrow-right" size={20} color={COLORS.surface} />}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      
      {/* 🚀 LÜKS YAPAY ZEKA BEKLEME EKRANI */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(248, 246, 240, 0.95)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ transform: [{ scale: 1.5 }] }} />
            <Text style={{ marginTop: 30, fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: 2 }}>
                VESTIFY AI TASARLIYOR
            </Text>
            <Text style={{ marginTop: 10, fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 40 }}>
                Seçtiğiniz konsepte uygun 3 farklı stil alternatifi oluşturuluyor...
            </Text>
        </View>
      </Modal>

    </View>
  );
} // FONKSİYONUN BİTİŞİ (Stiller Dışarıda Olmalı)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  heroBackground: { width: '100%', height: height * 0.35, justifyContent: 'space-between' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 4, color: '#FFF' },
  backBtn: { padding: 5 },
  heroTextContainer: { paddingHorizontal: 30, paddingBottom: 30 },
  heroMainText: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: -1 },

  formContainer: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, overflow: 'hidden' },
  scrollContent: { paddingHorizontal: 30, paddingTop: 30 },
  formIntroText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 35, fontWeight: '500' },
  
  section: { marginBottom: 35 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: COLORS.text, marginBottom: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, backgroundColor: COLORS.surface },
  activeItem: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  gridLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  activeLabel: { color: COLORS.surface },
  
  vibeRow: { gap: 10 },
  vibeBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  activeVibeBtn: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  vibeText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  activeVibeText: { color: COLORS.surface },
  
  inputContainer: { backgroundColor: COLORS.surface, padding: 20, minHeight: 120, borderLeftWidth: 3, borderLeftColor: COLORS.primary, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  input: { fontSize: 14, color: COLORS.text, fontWeight: '500', textAlignVertical: 'top', lineHeight: 20 },
  
  mainBtn: { flexDirection: 'row', backgroundColor: COLORS.text, height: 70, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, borderRadius: 8 },
  mainBtnText: { color: COLORS.surface, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  disabledBtn: { opacity: 0.4 } 
});