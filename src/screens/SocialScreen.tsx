import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SocialScreen() {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="people-circle-outline" size={80} color="#9B59B6" />
      <Text style={styles.comingSoonTitle}>Keşfet & İlham Al</Text>
      <Text style={styles.comingSoonText}>İnsanların kombinlerini aşağı kaydırarak görebileceğin sosyal akış ekranı çok yakında burada!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', padding: 20 },
  comingSoonTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginTop: 20, marginBottom: 10 },
  comingSoonText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
});