import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ClothingItem } from '../../types';

interface Props {
  item: ClothingItem;
  cardWidth: number;
  isNewItem: boolean;
  onPress: (item: ClothingItem) => void;
}

export default function ClothingItemCard({ item, cardWidth, isNewItem, onPress }: Props) {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => onPress(item)}
      style={[styles.cardContainer, { width: cardWidth }, isNewItem && styles.newCardBorder]}
    >
      <View style={styles.cardImageWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        {isNewItem && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        <View style={styles.likeContainer}>
          <Feather name="heart" size={18} color="#1A1A1A" />
          {item.wearCount > 0 && <Text style={styles.likeText}>{item.wearCount}</Text>}
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.brandText} numberOfLines={1}>{item.brand || 'AI Item'}</Text> 
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: { margin: 1, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#D1CFC7' },
  newCardBorder: { borderColor: '#DFFF00', borderWidth: 2 },
  newBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#DFFF00', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, zIndex: 10 },
  newBadgeText: { fontSize: 9, fontWeight: '900', color: '#1A1A1A', letterSpacing: 0.5 },
  cardImageWrapper: { width: '100%', aspectRatio: 3/4, backgroundColor: '#F9F9F9' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  likeContainer: { position: 'absolute', top: 10, right: 10, alignItems: 'center' },
  likeText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', marginTop: 2 },
  cardFooter: { padding: 8, borderTopWidth: 1, borderColor: '#F0F0F0' },
  brandText: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'capitalize' },
});