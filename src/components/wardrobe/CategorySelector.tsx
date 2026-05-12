import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Kategorileri buraya taşıyarak ana ekranı temiz tutuyoruz
export const CATEGORIES = [
  { id: 'ALL', label: 'All', icon: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100' },
  { id: 'FULL BODY', label: 'Full Body', icon: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=100' },
  { id: 'OUTERWEAR', label: 'Outerwear', icon: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100' },
  { id: 'TOPS', label: 'Tops', icon: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=100' },
  { id: 'BOTTOMS', label: 'Bottoms', icon: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=100' },
  { id: 'FOOTWEAR', label: 'Footwear', icon: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=100' },
  { id: 'ACCESSORIES', label: 'Accessories', icon: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=100' },
];

interface Props {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

export default function CategorySelector({ activeCategory, onSelectCategory }: Props) {
  return (
    <View style={styles.categoriesRow}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={styles.categoryCircleWrapper} 
            onPress={() => onSelectCategory(cat.id)}
          >
            <View style={[styles.categoryCircle, activeCategory === cat.id && styles.categoryCircleActive]}>
              <Image source={{ uri: cat.icon }} style={styles.categoryIcon} />
            </View>
            <Text style={[styles.label, activeCategory === cat.id && styles.labelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.filterIconsBox}>
        <Feather name="heart" size={24} color="#1A1A1A" style={{ marginRight: 15 }} />
        <Feather name="sliders" size={24} color="#1A1A1A" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  categoriesRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#D1CFC7', backgroundColor: '#EBE8DF' },
  categoriesScroll: { paddingVertical: 10, paddingLeft: 10 },
  categoryCircleWrapper: { alignItems: 'center', marginRight: 15 },
  categoryCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#DDD', overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  categoryCircleActive: { borderColor: '#1A1A1A' },
  categoryIcon: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.8 },
  label: { fontSize: 10, fontWeight: '600', color: '#666', marginTop: 4 },
  labelActive: { color: '#1A1A1A', fontWeight: '800' },
  filterIconsBox: { flexDirection: 'row', paddingHorizontal: 15, height: '100%', alignItems: 'center', borderLeftWidth: 1, borderColor: '#D1CFC7', backgroundColor: '#F5F2EB' },
});