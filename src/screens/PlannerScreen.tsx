import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
// 🚀 MİMARIN SİHİRLİ KALKANI: Çentik ve Sistem Tuşlarından Korur
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

const { width } = Dimensions.get('window');

export default function PlannerScreen() {
  const insets = useSafeAreaInsets(); // Telefonun fiziksel sınırlarını hesaplar

  const weekDays = [
    { day: 'Mon', date: '16', isActive: false },
    { day: 'Tue', date: '17', isActive: false },
    { day: 'Wed', date: '18', isActive: false },
    { day: 'Thu', date: '19', isActive: false },
    { day: 'Fri', date: '20', isActive: false },
    { day: 'Sat', date: '21', isActive: false },
    { day: 'Sun', date: '22', isActive: true }, 
  ];

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  return (
    // SafeAreaView yerine View kullanıp paddingTop değerini dinamik olarak veriyoruz!
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 1. ÜST BAŞLIK: Vestify */}
      <View style={styles.brandHeader}>
        <Text style={styles.brandText}>Vestify</Text>
        <View style={styles.greenAccentLine} />
      </View>

      {/* Ekranın Geri Kalanı (Flex ile tam oturur) */}
      <View style={styles.mainContent}>
        
        {/* ÜST BÖLGE: Takvim */}
        <View style={styles.topSection}>
          <View style={styles.dateHeaderRow}>
            <View>
              <Text style={styles.dayText}>Sunday</Text>
              <Text style={styles.dateText}>22 Mar 2026</Text>
            </View>
            
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                style={[styles.togglePill, notificationsEnabled && styles.togglePillActive]}
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={notificationsEnabled ? "notifications" : "notifications-off-outline"} 
                  size={14} 
                  color={notificationsEnabled ? "#FFF" : "#1A1A1A"} 
                  style={styles.toggleIcon} 
                />
                <View style={[styles.toggleCircle, notificationsEnabled && styles.toggleCircleActive]} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.calendarIconBtn}>
                <Feather name="calendar" size={18} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekStrip}>
            {weekDays.map((item, index) => (
              <TouchableOpacity key={index} style={styles.dayColumn}>
                <Text style={styles.stripDayText}>{item.day}</Text>
                <View style={[styles.dateCircle, item.isActive && styles.dateCircleActive]}>
                  <Text style={[styles.stripDateText, item.isActive && styles.stripDateTextActive]}>{item.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ORTA BÖLGE: Hero + Grid (Ferah Alan) */}
        <View style={styles.middleSection}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroText}>Track today's outfit.</Text>
            <Text style={styles.heroText}>Plan tomorrow's.</Text>
          </View>

          <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridBox} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="wardrobe-outline" size={28} color="#00CFFF" />
                <View style={styles.plusBadge}><Feather name="plus" size={10} color="#FFF" /></View>
              </View>
              <Text style={styles.gridText}>Add{'\n'}from wardrobe</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridBox} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="tshirt-crew-outline" size={28} color="#B388FF" />
                <MaterialCommunityIcons name="star-four-points-outline" size={14} color="#1A1A1A" style={styles.sparkleIcon} />
              </View>
              <Text style={styles.gridText}>Create{'\n'}new outfit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridBox} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <View style={styles.orangeCircle}>
                  <Text style={styles.orangeCircleText}>W</Text>
                </View>
              </View>
              <Text style={styles.gridText}>Discover{'\n'}new outfits</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridBox} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <Feather name="image" size={26} color="#8BC34A" />
                <View style={[styles.plusBadge, { backgroundColor: '#7CB342' }]}><Feather name="plus" size={10} color="#FFF" /></View>
              </View>
              <Text style={styles.gridText}>Add{'\n'}outfit photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ALT BÖLGE: Güvenli Boşluk Bırakılmış Buton */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.eventButton} activeOpacity={0.8}>
            <Feather name="layout" size={18} color="#1A1A1A" style={{marginRight: 10}} />
            <Text style={styles.eventButtonText}>Add or view events</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  brandHeader: { alignItems: 'center', paddingTop: 10, paddingBottom: 15, position: 'relative' },
  brandText: { fontSize: 24, fontStyle: 'italic', fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  greenAccentLine: { position: 'absolute', bottom: 0, width: width * 0.9, height: 2, backgroundColor: '#CCFF00', borderRadius: 2 }, 

  mainContent: { flex: 1, paddingHorizontal: 25, paddingTop: 20, justifyContent: 'space-between' },

  topSection: { marginBottom: 15 },
  dateHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dayText: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  dateText: { fontSize: 13, color: '#888888', marginTop: 4, fontWeight: '500' },
  
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  togglePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAEAEA', width: 50, height: 28, borderRadius: 14, paddingHorizontal: 4 },
  togglePillActive: { backgroundColor: '#1A1A1A' },
  toggleIcon: { marginRight: 'auto' },
  toggleCircle: { width: 22, height: 22, backgroundColor: '#FFFFFF', borderRadius: 11, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  toggleCircleActive: { transform: [{ translateX: -22 }] }, 
  calendarIconBtn: { width: 36, height: 36, backgroundColor: '#F9F9F9', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EBEBEB' },

  weekStrip: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center' },
  stripDayText: { fontSize: 12, color: '#888888', marginBottom: 8, fontWeight: '600' },
  dateCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dateCircleActive: { backgroundColor: '#CCFF00', shadowColor: '#CCFF00', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }, 
  stripDateText: { fontSize: 14, color: '#444444', fontWeight: '600' },
  stripDateTextActive: { fontWeight: '900', color: '#1A1A1A' },

  middleSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  heroTextContainer: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
  heroText: { fontSize: 17, fontWeight: '600', color: '#1A1A1A', letterSpacing: -0.3, lineHeight: 24 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', gap: 15 },
  
  gridBox: { 
    width: '47%', 
    height: 135,
    backgroundColor: '#FAFAFA', 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2
  },
  
  iconWrapper: { marginBottom: 12, position: 'relative', width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  plusBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#00CFFF', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FAFAFA' },
  sparkleIcon: { position: 'absolute', top: -4, right: -4 },
  orangeCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FF8A65', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1A1A1A' },
  orangeCircleText: { fontWeight: '900', color: '#1A1A1A', fontSize: 14 },

  gridText: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#444444', lineHeight: 18 },

  bottomSection: { 
    paddingTop: 10,
    // Alt navigatörün üstüne binmemesi için güvenli mesafe
    paddingBottom: Platform.OS === 'ios' ? 20 : 30, 
  },
  eventButton: { flexDirection: 'row', backgroundColor: '#F4EBFF', borderRadius: 16, paddingVertical: 16, justifyContent: 'center', alignItems: 'center' },
  eventButtonText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
});