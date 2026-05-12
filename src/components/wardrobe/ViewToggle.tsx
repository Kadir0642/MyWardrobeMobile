import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  activeView: 'PIECES' | 'LOOKS';
  onViewChange: (view: 'PIECES' | 'LOOKS') => void;
}

export default function ViewToggle({ activeView, onViewChange }: Props) {
  return (
    <View style={styles.toggleWrapper}>
      <TouchableOpacity 
        style={[styles.toggleButton, activeView === 'PIECES' && styles.activeButton]} 
        onPress={() => onViewChange('PIECES')}
        activeOpacity={0.8}
      >
        <Text style={[styles.toggleText, activeView === 'PIECES' && styles.activeText]}>Pieces</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.toggleButton, activeView === 'LOOKS' && styles.activeButton]} 
        onPress={() => onViewChange('LOOKS')}
        activeOpacity={0.8}
      >
        <Text style={[styles.toggleText, activeView === 'LOOKS' && styles.activeText]}>Looks</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // 🚀 Tasarım çok daha kompakt ve yüzen (floating) hale getirildi
  toggleWrapper: { flexDirection: 'row', backgroundColor: '#D9D2C5', borderRadius: 20, padding: 3, width: 140, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5 }, 
  toggleButton: { flex: 1, paddingVertical: 8, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  activeButton: { backgroundColor: '#1A362D' }, 
  toggleText: { fontSize: 12, fontWeight: '700', color: '#666' },
  activeText: { color: '#FFFFFF' }
});