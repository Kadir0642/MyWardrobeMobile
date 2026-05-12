import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OutfitCard from '../../components/wardrobe/OutfitCard';

const { width } = Dimensions.get('window');

interface Props {
  outfits: any[];
  numColumns: number;
  viewMode: 'PIECES' | 'LOOKS'; // 🚀 YENİ: Ana ekrandan prop olarak alıyoruz
  isLoadingMore: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  onOutfitPress: (outfit: any) => void;
  onTryOnNavigate: (clothes: any[]) => void;
}

// 🚀 İÇERİDEKİ useState ve <ViewToggle /> tamamen silindi!
export default function OutfitsTabView({ outfits, numColumns, viewMode, isLoadingMore, refreshing, onRefresh, onEndReached, onOutfitPress, onTryOnNavigate }: Props) {
  const outfitWidth = (width - (numColumns + 1) * 10) / numColumns;

  const renderOutfit = ({ item }: { item: any }) => {
    return (
      <OutfitCard 
        outfit={item} 
        outfitWidth={outfitWidth} 
        numColumns={numColumns} 
        viewMode={viewMode}
        onPress={onOutfitPress} 
        onTryOnPress={(outfitData) => onTryOnNavigate(outfitData.clothes)}
      />
    );
  };

  return (
    <FlatList
      key={`outfits-${numColumns}`} 
      data={outfits} 
      numColumns={numColumns}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderOutfit}
      contentContainerStyle={styles.outfitListContainer}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached} 
      onEndReachedThreshold={0.5} 
      ListFooterComponent={isLoadingMore ? <View style={{ paddingVertical: 20 }}><ActivityIndicator size="small" color="#1A1A1A" /></View> : null}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="hanger" size={56} color="#000000" />
          <Text style={styles.emptyText}>Henüz bir kombin kaydetmediniz.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  outfitListContainer: { paddingHorizontal: 5, paddingTop: 10, paddingBottom: 120 }, // Butonlar örtmesin diye alt boşluğu artırdık
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 15, fontSize: 16, fontWeight: '600', color: '#888' },
});