import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ClothingItemCard from '../../components/wardrobe/ClothingItemCard';
import { ClothingItem } from '../../types';

const { width } = Dimensions.get('window');

interface Props {
  items: ClothingItem[];
  numColumns: number;
  isLoadingMore: boolean;
  refreshing: boolean;
  newItemIds: number[];
  onRefresh: () => void;
  onEndReached: () => void;
  onItemPress: (item: ClothingItem) => void;
}

export default function ItemsTabView({ items, numColumns, isLoadingMore, refreshing, newItemIds, onRefresh, onEndReached, onItemPress }: Props) {
  const cardWidth = (width - 2) / numColumns;

  const renderItem = ({ item }: { item: ClothingItem }) => {
    const isNewItem = newItemIds.includes(item.id);
    return (
      <ClothingItemCard 
        item={item} 
        cardWidth={cardWidth} 
        isNewItem={isNewItem} 
        onPress={onItemPress} 
      />
    );
  };

  return (
    <FlatList
      key={`items-${numColumns}`} 
      data={items} 
      numColumns={numColumns}
      keyExtractor={(item) => item.id.toString()}
      initialNumToRender={6}
      maxToRenderPerBatch={4}
      windowSize={5} 
      removeClippedSubviews={true} 
      renderItem={renderItem}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached} 
      onEndReachedThreshold={0.5}  
      ListFooterComponent={        
        isLoadingMore ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator size="small" color="#E07A5F" />
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={48} color="#D1CFC7" />
          <Text style={styles.emptyText}>Bu kategoride ürün bulunamadı.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  gridContainer: { paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 15, fontSize: 16, fontWeight: '600', color: '#888' },
});