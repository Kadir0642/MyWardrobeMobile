import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; 
import { useProfile } from '../context/ProfileContext';
// 🚀 DÜZELTME: Dosya yolu "components" klasörünü gösterecek şekilde güncellendi
import PremiumAlert from '../components/PremiumAlert'; 

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Trending', 'Vintage', 'Y2K', 'Sneakers', 'Streetwear'];

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { profileImage } = useProfile();
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

  const [activeCategory, setActiveCategory] = useState('All');
  const [notifyAlertVisible, setNotifyAlertVisible] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 🚀 Havalı VIP Bildirim Uyarısı */}
      <PremiumAlert
        visible={notifyAlertVisible}
        title="You're on the list! 💌"
        message="We've saved your spot. You will be the first to experience the Beyond marketplace once it goes live."
        onCancel={() => setNotifyAlertVisible(false)}
        onConfirm={() => setNotifyAlertVisible(false)}
        confirmText="Awesome"
        cancelText="Close"
        iconName="bell"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: profileImage || defaultAvatar }} style={styles.profileImage} />
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.logoText}>VESTIFY</Text>
          
          <View style={styles.beyondWrapper}>
            <MaterialCommunityIcons name="wave" size={24} color="#1A1A1A" style={styles.waveIcon} />
            <TouchableOpacity style={styles.beyondPill} activeOpacity={0.8}>
              <Text style={styles.beyondText}>Beyond</Text>
            </TouchableOpacity>
            <MaterialCommunityIcons name="wave" size={24} color="#1A1A1A" style={[styles.waveIcon, { transform: [{ scaleX: -1 }] }]} />
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="bell" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="bar-chart-2" size={24} color="#1A1A1A" style={{ transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        
        {/* SADECE ARAMA VE KATEGORİLER KALDI (MOCK LİSTE SİLİNDİ) */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="#888" />
            <TextInput 
              placeholder="Search in Beyond..." 
              placeholderTextColor="#888" 
              style={styles.searchInput}
              editable={false} 
            />
            <TouchableOpacity>
              <Feather name="sliders" size={20} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat)}
                disabled={true} 
              >
                <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 🚀 PREMIUM BLUR MASKESİ (Arka planda sadece arama çubuğu silüeti kalacak) */}
        <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFillObject}>
          <View style={styles.comingSoonOverlay}>
            <View style={styles.iconCircle}>
              <Feather name="lock" size={32} color="#1A1A1A" />
            </View>
            <Text style={styles.comingSoonTitle}>Beyond is Evolving</Text>
            <Text style={styles.comingSoonText}>
              We are crafting the ultimate global marketplace for you to buy and sell unique pieces. Stay tuned for the revolution!
            </Text>
            
            <TouchableOpacity style={styles.notifyButton} onPress={() => setNotifyAlertVisible(true)}>
              <Text style={styles.notifyButtonText}>Notify Me</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F4' }, 
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerLeft: { flex: 1, alignItems: 'flex-start' },
  profileImage: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#E0E0E0' },
  
  headerCenter: { flex: 2, alignItems: 'center' },
  logoText: { fontSize: 22, fontWeight: '800', letterSpacing: 2, color: '#1A1A1A', marginBottom: 6 },
  
  beyondWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  waveIcon: { opacity: 0.7, marginTop: 2 },
  beyondPill: { 
    backgroundColor: '#FAF9F4', 
    paddingHorizontal: 16, 
    paddingVertical: 4, 
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#00E676', 
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4
  },
  beyondText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.5 },

  headerRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingTop: 5 },
  iconBtn: { padding: 4 },

  searchSection: { paddingHorizontal: 20, paddingBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 15, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  categoryScroll: { gap: 10, paddingRight: 20 },
  categoryChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEB' },
  categoryChipActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#888' },
  categoryTextActive: { color: '#FFFFFF' },

  comingSoonOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', 
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  notifyButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  notifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});