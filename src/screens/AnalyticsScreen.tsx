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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#2C3E50' },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginTop: 5 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20 },
  statBox: { backgroundColor: '#FFFFFF', width: '30%', paddingVertical: 15, borderRadius: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  statNumber: { fontSize: 24, fontWeight: '900', color: '#E74C3C' },
  statLabel: { fontSize: 12, color: '#95A5A6', fontWeight: '600', marginTop: 2 },

  card: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#95A5A6', letterSpacing: 1.5, marginBottom: 15 },
  subTitle: { fontSize: 13, fontWeight: '700', color: '#34495E', marginBottom: 8 },
  
  // Percent Worn UI
  percentContainer: { alignItems: 'center', justifyContent: 'center', height: 120 },
  percentIconBackground: { position: 'absolute', opacity: 0.5 },
  percentFill: { backgroundColor: '#1ABC9C', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, zIndex: 2, elevation: 5 },
  percentText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  insightText: { fontSize: 14, color: '#34495E', textAlign: 'center', marginTop: 15, lineHeight: 22 },
  actionButton: { backgroundColor: '#E74C3C', paddingVertical: 12, borderRadius: 10, marginTop: 15, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  // Color Palette UI
  colorRow: { flexDirection: 'row', height: 40, borderRadius: 10, overflow: 'hidden' },
  colorBlock: { justifyContent: 'center', alignItems: 'center' },
  colorText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  colorTextDark: { color: '#333333', fontSize: 10, fontWeight: 'bold' },
  insightTextMini: { fontSize: 12, color: '#7F8C8D', fontStyle: 'italic', marginTop: 10 },

  // Heroes UI
  heroesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroItem: { width: '48%', alignItems: 'center' },
  heroImagePlaceholder: { width: '100%', height: 120, backgroundColor: '#F8F9FA', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEEEEE', marginBottom: 10 },
  heroName: { fontSize: 13, fontWeight: '700', color: '#2C3E50', textAlign: 'center' },
  heroWears: { fontSize: 11, color: '#E74C3C', fontWeight: 'bold', marginTop: 4 },
});