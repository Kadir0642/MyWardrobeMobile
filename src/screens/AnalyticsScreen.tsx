import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="pie-chart-outline" size={80} color="#E67E22" />
      <Text style={styles.comingSoonTitle}>Dolap Analizi</Text>
      <Text style={styles.comingSoonText}>Giyilme maliyeti (CPW), kapsül gardırop önerileri ve istatistikler burada yer alacak.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', padding: 20 },
  comingSoonTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginTop: 20, marginBottom: 10 },
  comingSoonText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
});