import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // 🚀 useNavigation eklendi
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../context/ProfileContext';
import * as Location from 'expo-location';

import { apiClient } from '../api/client';
import { ClothingItem } from '../types';

import AISuggestionsTab from '../components/Stylist/AISuggestionsTab';
import DressMeTab from '../components/Stylist/DressMeTab';
import CanvasTab from '../components/Stylist/CanvasTab';
import ARTryOnTab from '../components/Stylist/ARTryOnTab'; // 🚀 YENİ EKLENEN AR BÖLMESİ

const CURRENT_USER_ID = 1; 

export default function StylistScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>(); //  Yönlendirme motoru
  const { profileImage } = useProfile();
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

  const [activeTab, setActiveTab] = useState('Dress Me'); 
  const [is3DMode, setIs3DMode] = useState(false); 
 // 🚀 SABİT TARİH (Sadece bugünü gösterir) 
  const currentDate = new Date();
// ☁️ PREMIUM HAVA DURUMU STATE'İ
  const [weather, setWeather] = useState({ 
    temp: '--°', 
    city: 'Konum', 
    icon: 'weather-cloudy-clock', 
    color: '#D1CFC7' 
  });
  
  const [allWardrobe, setAllWardrobe] = useState<{id: string, uri: string, category: string, brand?: string}[]>([]); // 1. DÜZELTME: brand eklendi
  const [allOutfits, setAllOutfits] = useState<any[]>([]); // 2. DÜZELTME: allOutfits state'i eklendi

  // ☁️ HAVA DURUMU SİSTEMİ
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        const cityName = geocode[0]?.city || geocode[0]?.subregion || 'Konum';

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const data = await res.json();

        if (data.current_weather) {
          const wmoCode = data.current_weather.weathercode;
          const temp = Math.round(data.current_weather.temperature);
          
          let materialIcon = 'weather-sunny';
          let iconColor = '#FFD700'; 

          if (wmoCode === 0) { materialIcon = 'weather-sunny'; iconColor = '#FFCA28'; }
          else if (wmoCode >= 1 && wmoCode <= 2) { materialIcon = 'weather-partly-cloudy'; iconColor = '#FFCA28'; }
          else if (wmoCode === 3) { materialIcon = 'weather-cloudy'; iconColor = '#90A4AE'; }
          else if (wmoCode >= 45 && wmoCode <= 48) { materialIcon = 'weather-fog'; iconColor = '#B0BEC5'; }
          else if (wmoCode >= 51 && wmoCode <= 67) { materialIcon = 'weather-pouring'; iconColor = '#4FC3F7'; }
          else if (wmoCode >= 71 && wmoCode <= 77) { materialIcon = 'weather-snowy'; iconColor = '#E1F5FE'; }
          else if (wmoCode >= 95) { materialIcon = 'weather-lightning'; iconColor = '#FF9800'; }

          setWeather({ temp: `${temp}°`, city: cityName, icon: materialIcon, color: iconColor });
        }
      } catch (error) {
        console.error("Hava durumu çekilemedi:", error);
      }
    })();
  }, []);

useFocusEffect(
    useCallback(() => {
      const fetchRealData = async () => {
        
        // 1. KIYAFETLERİ ÇEKME (Kendi Koruma Kalkanı Var)
        try {
          const response = await apiClient.get(`/clothes/${CURRENT_USER_ID}?size=200`);
          const items: ClothingItem[] = response.data.content || response.data;
          const formatted = items.map(item => ({ 
            id: item.id.toString(), 
            uri: item.imageUrl, 
            category: item.category,
            brand: item.brand 
          }));
          setAllWardrobe(formatted.reverse());
        } catch (error: any) { 
          console.error("🚨 Kıyafetler çekilirken hata: ", error.message); 
        }

        // 2. KOMBİNLERİ ÇEKME (Kendi Koruma Kalkanı Var)
        try {
          // 2. KOMBİNLERİ ÇEKME (Clothes Sorunu Çözüldü)
          const outfitsRes = await apiClient.get(`/outfits/user/${CURRENT_USER_ID}?size=200`);
          const rawOutfits = outfitsRes.data.content || outfitsRes.data || [];

          const formattedOutfits = rawOutfits.map((outfit: any) => {
            // 🚀 LOGDAN GELEN GERÇEK VERİ: Java'daki listenin adı "clothes"
            const outfitItemsArray = outfit.clothes || []; 

            return {
              id: outfit.id.toString(),
              name: outfit.name, 
              items: outfitItemsArray.map((item: any) => ({
                id: item.id.toString(),
                uri: item.imageUrl || item.uri, 
                category: item.category,
                brand: item.brand
              }))
            };
          });
          setAllOutfits(formattedOutfits.reverse());
        } catch (error: any) { 
          // 🚀 500 HATASI BURAYA DÜŞECEK AMA UYGULAMAYI BOZMAYACAK
          console.error("🚨 Kombinler çekilirken (500) backend hatası: ", error.message); 
        }

      };
      fetchRealData();
    }, [])
  );

  // 4'lü sekme isimlerimiz (Ekrana sığması için optimize edildi)
  const TABS = ['Dress Me', 'Canvas', 'AI-Suggest', 'AR Try-On'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* HEADER ALANI */}      
      <View style={styles.header}>
        
        {/* SOL: Profil Fotoğrafı */}
        <View style={styles.headerLeft}>
          <Image source={{ uri: profileImage || defaultAvatar }} style={styles.profileImage} />
        </View>
        
        {/* ORTA: Sabit, Minimalist Tarih Hapı */}
        <View style={styles.headerCenter}>
          {/* 🚀 TARİH HAPI ARTIK TIKLANABİLİR VE PLANNER'A GİDİYOR */}
          <TouchableOpacity 
            style={styles.dateSelector} 
            activeOpacity={0.7} 
            onPress={() => navigation.navigate('Planner')} // Yönlendirme (Route adının Navigator'da 'Planner' olduğundan emin ol)
          >
            <Text style={styles.dateText}>
              {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SAĞ: Şık Hava Durumu */}
        <View style={styles.weatherContainer}>
          <MaterialCommunityIcons name={weather.icon as any} size={28} color={weather.color} style={styles.weatherIcon} />
          <Text style={styles.weatherText}>{weather.temp}</Text>
        </View>

      </View>

      {/* SEKMELER MENÜSÜ (4'lü yapıya uyarlandı) */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]} 
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* BİLEŞEN YÖNLENDİRİCİ */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Dress Me' && <DressMeTab allWardrobe={allWardrobe} is3DMode={is3DMode} />}
        {activeTab === 'Canvas' && <CanvasTab allWardrobe={allWardrobe} />}
        {activeTab === 'AI-Suggest' && <AISuggestionsTab allWardrobe={allWardrobe} weather={weather}/>}
        {activeTab === 'AR Try-On' && <ARTryOnTab allWardrobe={allWardrobe} allOutfits={allOutfits} />}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, 
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 20 
  },
  headerLeft: { 
    flex: 1, 
    alignItems: 'flex-start' 
  },
  profileImage: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    borderWidth: 1, 
    borderColor: '#E0E0E0' 
  },
  
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  // 🚀 DAHA KÜÇÜK VE ZARİF TARİH HAPI
  dateSelector: { 
    backgroundColor: '#F5F5F5', 
    borderRadius: 20, 
    paddingHorizontal: 32, 
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#EBE8DF'
  },
  dateText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#1A1A1A', 
    letterSpacing: 1.0 
  },
  
  weatherContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end',
    gap: 4
  },
  weatherIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  weatherText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#D1CFC7' 
  },

// 🚀 4'lü yapı için tab stilleri ufak güncellendi (Yazı boyutu biraz küçüldü)
  tabsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 10, // Kenar boşlukları kısıldı ki 4 sekme sığsın
    borderBottomWidth: 1, 
    borderBottomColor: '#EBE8DF', 
    marginBottom: 5 
  },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#1A1A1A' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#A0A0A0' }, // 14'ten 13'e çekildi
  tabTextActive: { color: '#1A1A1A', fontWeight: '800' }
});