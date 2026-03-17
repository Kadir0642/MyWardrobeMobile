import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* BAŞLIK VE PROFİL ÖZETİ */}
      <View style={styles.header}>
        <Text style={styles.title}>Dolap Analizi 📊</Text>
        <Text style={styles.subtitle}>Veriler yalan söylemez, tarzını keşfet.</Text>
      </View>

      {/* 1. HIZLI İSTATİSTİKLER (Zirve Veriler) */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>38</Text>
          <Text style={styles.statLabel}>Parça</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>124</Text>
          <Text style={styles.statLabel}>Kombin</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#27AE60' }]}>45₺</Text>
          <Text style={styles.statLabel}>Ort. CPW</Text>
        </View>
      </View>

      {/* 2. OYUNLAŞTIRMA: KULLANIM YÜZDESİ (Cladwell Tarzı) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>GİYİLME ORANI (PERCENT WORN)</Text>
        <View style={styles.percentContainer}>
          <Ionicons name="shirt" size={80} color="#E0E6ED" style={styles.percentIconBackground} />
          <View style={styles.percentFill}>
            <Text style={styles.percentText}>%55</Text>
          </View>
        </View>
        <Text style={styles.insightText}>
          İnsanların çoğu dolaplarının sadece %20'sini giyer. Sen %55'ini aktif kullanıyorsun. Harika bir oran!
        </Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Giyilmeyenleri Gör</Text>
        </TouchableOpacity>
      </View>

      {/* 3. RENK PALETİ ÇATIŞMASI (Indyx Tarzı) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>RENK PALETİN</Text>
        
        <Text style={styles.subTitle}>En Çok Sahip Olduğun (Most Owned)</Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorBlock, { backgroundColor: '#000000', flex: 3 }]}><Text style={styles.colorText}>Siyah (15)</Text></View>
          <View style={[styles.colorBlock, { backgroundColor: '#FFFFFF', flex: 2 }]}><Text style={styles.colorTextDark}>Beyaz (8)</Text></View>
          <View style={[styles.colorBlock, { backgroundColor: '#D2B48C', flex: 1 }]}><Text style={styles.colorTextDark}>Bej (4)</Text></View>
        </View>

        <Text style={[styles.subTitle, { marginTop: 15 }]}>Aslında En Çok Giydiğin (Most Worn)</Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorBlock, { backgroundColor: '#2C3E50', flex: 3 }]}><Text style={styles.colorText}>Lacivert (22)</Text></View>
          <View style={[styles.colorBlock, { backgroundColor: '#000000', flex: 2 }]}><Text style={styles.colorText}>Siyah (12)</Text></View>
          <View style={[styles.colorBlock, { backgroundColor: '#8B0000', flex: 2 }]}><Text style={styles.colorText}>Bordo (10)</Text></View>
        </View>
        <Text style={styles.insightTextMini}>İpucu: Siyah kıyafet almayı seviyorsun ama elin hep lacivert ve bordoya gidiyor!</Text>
      </View>

      {/* 4. GO-TO ITEMS (En Çok Giyilenler) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>KAHRAMAN PARÇALAR (GO-TO ITEMS)</Text>
        <View style={styles.heroesRow}>
          
          <View style={styles.heroItem}>
            <View style={styles.heroImagePlaceholder}>
              <Ionicons name="shirt-outline" size={40} color="#7F8C8D" />
            </View>
            <Text style={styles.heroName}>Basic Siyah Tişört</Text>
            <Text style={styles.heroWears}>14 Kez Giyildi</Text>
          </View>

          <View style={styles.heroItem}>
            <View style={styles.heroImagePlaceholder}>
               <Ionicons name="snow-outline" size={40} color="#7F8C8D" />
            </View>
            <Text style={styles.heroName}>Deri Ceket</Text>
            <Text style={styles.heroWears}>9 Kez Giyildi</Text>
          </View>

        </View>
      </View>

      {/* Alt boşluk */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// PREMIUM CSS GÜNCELLEMESİ (Minimalist, Dergi Tasarımı)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' }, // Sıcak ve premium bir kırık beyaz
  header: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 25, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#888888', marginTop: 6 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 25 },
  statBox: { backgroundColor: '#FFFFFF', width: '31%', paddingVertical: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EFEFEF' },
  statNumber: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#888888', fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  card: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 25, borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#EFEFEF' },
  cardTitle: { fontSize: 12, fontWeight: '800', color: '#A0A0A0', letterSpacing: 1.5, marginBottom: 20 },
  subTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  
  // Percent Worn UI
  percentContainer: { alignItems: 'center', justifyContent: 'center', height: 100 },
  percentIconBackground: { position: 'absolute', opacity: 0.2 },
  percentFill: { backgroundColor: '#7A9E9F', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, zIndex: 2 }, // Daha pastel, asil bir yeşil/mavi
  percentText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  insightText: { fontSize: 14, color: '#555555', textAlign: 'center', marginTop: 20, lineHeight: 22 },
  actionButton: { backgroundColor: '#D9534F', paddingVertical: 14, borderRadius: 8, marginTop: 20, alignItems: 'center' }, // Cladwell kırmızı/kiremit rengi
  actionButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 },

  // Color Palette UI
  colorRow: { flexDirection: 'row', height: 35, borderRadius: 6, overflow: 'hidden' },
  colorBlock: { justifyContent: 'center', alignItems: 'center' },
  colorText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  colorTextDark: { color: '#1A1A1A', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  insightTextMini: { fontSize: 13, color: '#888888', fontStyle: 'italic', marginTop: 15, lineHeight: 20 },

  // Heroes UI
  heroesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroItem: { width: '48%', alignItems: 'center' },
  heroImagePlaceholder: { width: '100%', height: 140, backgroundColor: '#F9F9F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  heroWears: { fontSize: 11, color: '#D9534F', fontWeight: 'bold', marginTop: 6, letterSpacing: 0.5 },
});