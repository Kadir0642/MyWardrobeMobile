import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, SafeAreaView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// VOGUE MINIMALIST PALETTE
const VOGUE = {
  bg: '#FFFFFF',
  text: '#1A1A1A',
  secondary: '#717171',
  border: '#E8E8E8',
  accent: '#000000',
  softBg: '#FAFAFA'
};

const EVENT_TYPES = [
  { id: 'WEDDING', label: 'Wedding / Gala', icon: 'gift' },
  { id: 'DATE', label: 'Dinner / Date', icon: 'heart' },
  { id: 'BUSINESS', label: 'Business / Interview', icon: 'briefcase' },
  { id: 'PARTY', label: 'Night Out / Club', icon: 'music' },
  { id: 'CASUAL', label: 'Casual Meeting', icon: 'coffee' }
];

const VIBE_TYPES = ['CLASSIC', 'SMART CASUAL', 'EDGY', 'MINIMALIST'];

export default function EventPlannerScreen() {
  const navigation = useNavigation<any>();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleGenerate = () => {
    let context = customPrompt || `${selectedEvent} - ${selectedVibe}`;
    navigation.navigate('EventResultScreen', { eventContext: context });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="x" size={24} color={VOGUE.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EVENT CURATOR</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.heroTitle}>Where are you headed?</Text>
          <Text style={styles.heroSub}>Vestify AI will curate alternatives based on your social context.</Text>

          {/* EVENT GRID */}
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

          {/* MAGIC BOX */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Or whisper to Vestify AI</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input}
                placeholder="Ex: First date at a rooftop lounge, want to look sharp but effortless..."
                placeholderTextColor={VOGUE.secondary}
                multiline
                value={customPrompt}
                onChangeText={(t) => { setCustomPrompt(t); setSelectedEvent(null); setSelectedVibe(null); }}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.mainBtn, (!customPrompt && (!selectedEvent || !selectedVibe)) && styles.disabledBtn]}
            disabled={!customPrompt && (!selectedEvent || !selectedVibe)}
            onPress={handleGenerate}
          >
            <Text style={styles.mainBtnText}>CURATE LOOKS</Text>
            <Feather name="arrow-right" size={20} color={VOGUE.bg} />
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VOGUE.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  headerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 3, color: VOGUE.text },
  backBtn: { padding: 5 },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 40, paddingTop: 20 },
  
  heroTitle: { fontSize: 32, fontWeight: '700', color: VOGUE.text, marginBottom: 10, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: VOGUE.secondary, lineHeight: 22, marginBottom: 40 },
  
  section: { marginBottom: 35 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: VOGUE.text, marginBottom: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { paddingVertical: 14, paddingHorizontal: 20, borderWidth: 1, borderColor: VOGUE.border, borderRadius: 2 },
  activeItem: { backgroundColor: VOGUE.accent, borderColor: VOGUE.accent },
  gridLabel: { fontSize: 13, fontWeight: '600', color: VOGUE.text },
  activeLabel: { color: VOGUE.bg },
  
  vibeRow: { gap: 10 },
  vibeBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: VOGUE.softBg, borderRadius: 20 },
  activeVibeBtn: { backgroundColor: VOGUE.accent },
  vibeText: { fontSize: 12, fontWeight: '700', color: VOGUE.secondary },
  activeVibeText: { color: VOGUE.bg },
  
  inputContainer: { backgroundColor: VOGUE.softBg, padding: 20, minHeight: 120, borderLeftWidth: 2, borderLeftColor: VOGUE.accent },
  input: { fontSize: 14, color: VOGUE.text, fontWeight: '500', textAlignVertical: 'top' },
  
  mainBtn: { flexDirection: 'row', backgroundColor: VOGUE.accent, height: 65, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  mainBtnText: { color: VOGUE.bg, fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  disabledBtn: { opacity: 0.2 }
});