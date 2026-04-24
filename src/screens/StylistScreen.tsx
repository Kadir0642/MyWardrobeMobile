import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../context/ProfileContext';
import * as Location from 'expo-location';

// 🚀 MERKEZİ API VE TİPLER EKLENDİ
import { apiClient } from '../api/client';
import { ClothingItem } from '../types';

import AISuggestionsTab from '../components/Stylist/AISuggestionsTab';
import DressMeTab from '../components/Stylist/DressMeTab';
import CanvasTab from '../components/Stylist/CanvasTab';

const CURRENT_USER_ID = 1; // 🚀 DOĞRU KULLANICI KİMLİĞİ

export default function StylistScreen() {
  const insets = useSafeAreaInsets();
  const { profileName, profileImage } = useProfile();
  const displayName = profileName || "Jane";
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

  const [activeTab, setActiveTab] = useState('Canvas'); // Test için Canvas'ı varsayılan yaptık
  const [is3DMode, setIs3DMode] = useState(false);
  const [weather, setWeather] = useState({ temp: '--°C', city: 'Konum Bulunuyor...', icon: 'loader' });
  const [allWardrobe, setAllWardrobe] = useState<{id: string, uri: string, category: string}[]>([]);

  // ☁️ HAVA DURUMU SİSTEMİ
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setWeather({ temp: '--', city: 'İzin Yok', icon: 'slash' });
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        const cityName = geocode[0]?.city || geocode[0]?.subregion || 'Konum';
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const data = await res.json();

        if (data.current_weather) {
          const wmoCode = data.current_weather.weathercode;
          const temp = Math.round(data.current_weather.temperature);
          
          let featherIcon = 'sun';
          if (wmoCode >= 1 && wmoCode <= 3) featherIcon = 'cloud'; 
          if (wmoCode >= 45 && wmoCode <= 48) featherIcon = 'align-justify'; 
          if (wmoCode >= 51 && wmoCode <= 67) featherIcon = 'cloud-rain'; 
          if (wmoCode >= 71 && wmoCode <= 77) featherIcon = 'cloud-snow'; 
          if (wmoCode >= 95) featherIcon = 'cloud-lightning'; 

          setWeather({ temp: `${temp}°C`, city: cityName, icon: featherIcon });
        }
      } catch (error) {
        setWeather({ temp: '..°C', city: '..', icon: 'cloud' });
      }
    })();
  }, []);

  // 🧥 VERİTABANINDAN KIYAFET ÇEKME SİSTEMİ (API CLIENT İLE)
  useFocusEffect(
    useCallback(() => {
      const fetchRealWardrobe = async () => {
        try {
          // Kombin yaparken kullanıcının dolabındaki tüm kıyafetleri görebilmesi için size'ı büyük tuttuk
          const response = await apiClient.get(`/clothes/${CURRENT_USER_ID}?size=200`);
          const items: ClothingItem[] = response.data.content || response.data;
          
          const formatted = items.map(item => ({ 
            id: item.id.toString(), 
            uri: item.imageUrl, // URL hatası düzeltildi
            category: item.category 
          }));
          
          setAllWardrobe(formatted.reverse());
        } catch (error: any) { 
          console.error("🚨 Stilist Dolap çekilirken hata: ", error.response?.data || error.message); 
        }
      };
      fetchRealWardrobe();
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: profileImage || defaultAvatar }} style={styles.profileImage} />
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Hey, {displayName} !</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.weatherBadge}>
            <Feather name={weather.icon as any} size={14} color="#555" />
            <Text style={styles.weatherText}>{weather.city}, {weather.temp}</Text>
            <Feather name="chevron-down" size={14} color="#555" />
          </View>
          <TouchableOpacity style={[styles.modeToggle, is3DMode && styles.modeToggleActive]} onPress={() => setIs3DMode(!is3DMode)}>
            <Text style={[styles.modeToggleText, is3DMode && styles.modeToggleTextActive]}>{is3DMode ? '3D' : '2D'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEKMELER MENÜSÜ */}
      <View style={styles.tabsContainer}>
        {['Dress Me', 'Canvas', 'AI Suggestions'].map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🚀 BİLEŞEN YÖNLENDİRİCİ (ROUTER) MANTIĞI */}
      <View style={{ flex: 1 }}>
        {activeTab === 'AI Suggestions' && <AISuggestionsTab allWardrobe={allWardrobe} weather={weather}/>}
        {activeTab === 'Dress Me' && <DressMeTab allWardrobe={allWardrobe} is3DMode={is3DMode} />}
        {activeTab === 'Canvas' && <CanvasTab allWardrobe={allWardrobe} />}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileImage: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#1A1A1A' },
  greetingContainer: { borderBottomWidth: 1, borderBottomColor: '#EBE8DF', paddingBottom: 2 },
  greetingText: { fontSize: 18, fontWeight: '500', color: '#1A1A1A' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, gap: 5 },
  weatherText: { fontSize: 14, fontWeight: '600', color: '#555' },
  modeToggle: { backgroundColor: '#EBE8DF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D1CFC7' },
  modeToggleActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  modeToggleText: { fontSize: 13, fontWeight: '700', color: '#888' },
  modeToggleTextActive: { color: '#DFFF00' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EBE8DF', marginBottom: 5 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#1A1A1A' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#1A1A1A', fontWeight: '800' }
});