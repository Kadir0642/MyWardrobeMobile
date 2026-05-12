import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface Props {
  outfit: any;
  outfitWidth: number;
  numColumns: number;
  viewMode: 'PIECES' | 'LOOKS'; // 🚀 YENİ: Kart hangi modda olduğunu biliyor
  onPress: (outfit: any) => void;
  onTryOnPress?: (outfit: any) => void; // 🚀 YENİ: ARTryOn'a yönlendirme fonksiyonu
}

export default function OutfitCard({ outfit, outfitWidth, numColumns, viewMode, onPress, onTryOnPress }: Props) {
  const clothesArray = outfit.clothes || [];
  const itemsToShow = clothesArray.slice(0, 4);

  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.outfitCard, { width: outfitWidth }]} onPress={() => onPress(outfit)}>
      
      {/* 🚀 EĞER 'PIECES' MODUNDAYSAK ESKİ GRID GÖRÜNÜMÜ */}
      {viewMode === 'PIECES' ? (
        <View style={styles.outfitImageGrid}>
          {itemsToShow.map((outfitItem: any, index: number) => (
            <View key={index} style={styles.outfitGridCell}>
               <Image source={{ uri: outfitItem.imageUrl }} style={styles.outfitGridImage} />
            </View>
          ))}
          {clothesArray.length > 4 && (
            <View style={styles.moreItemsOverlay}>
              <Text style={[styles.moreItemsText, numColumns === 3 && { fontSize: 12 }]}>+{clothesArray.length - 4}</Text>
            </View>
          )}
        </View>
      ) : (
        /* 🚀 EĞER 'LOOKS' MODUNDAYSAK AR GÖRSELİNİ GÖSTER */
        <View style={styles.lookImageContainer}>
          {outfit.outfitImageUrl ? (
            <Image source={{ uri: outfit.outfitImageUrl }} style={styles.fullLookImage} />
          ) : (
            <View style={styles.emptyLookContainer}>
              <MaterialCommunityIcons name="magic-staff" size={28} color="#A39B8B" />
              <Text style={styles.emptyLookText}>Not worn yet</Text>
              
              {/* Üzerimde Gör (Try On) Butonu */}
              <TouchableOpacity 
                style={styles.tryOnButton} 
                onPress={(e) => { e.stopPropagation(); onTryOnPress && onTryOnPress(outfit); }}
              >
                <Text style={styles.tryOnButtonText}>Try it on</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ALT BİLGİ KISMI AYNEN KALIYOR */}
      <View style={styles.outfitFooter}>
        <Text style={[styles.outfitDateText, numColumns === 3 && { fontSize: 10 }]} numberOfLines={1}>
          {outfit.name || "Kombinim"}
        </Text>
        {numColumns === 2 && (
          <View style={styles.outfitActionRow}>
             <MaterialCommunityIcons name="hanger" size={14} color="#888" />
             <Text style={styles.outfitItemCount}>{clothesArray.length} items</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outfitCard: { margin: 5, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  outfitImageGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', aspectRatio: 1, backgroundColor: '#FAFAFA' },
  outfitGridCell: { width: '50%', height: '50%', padding: 2, borderWidth: 0.5, borderColor: '#F0F0F0' },
  outfitGridImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  moreItemsOverlay: { position: 'absolute', bottom: 2, right: 2, width: '49%', height: '49%', backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  moreItemsText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  
  // 🚀 YENİ: Looks Modu Stilleri
  lookImageContainer: { width: '100%', aspectRatio: 3/4, backgroundColor: '#EBE8DF' },
  fullLookImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyLookContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  emptyLookText: { fontSize: 12, color: '#A39B8B', fontWeight: '600', marginTop: 8, marginBottom: 12 },
  tryOnButton: { backgroundColor: '#1A362D', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12 },
  tryOnButtonText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  outfitFooter: { padding: 12, borderTopWidth: 1, borderColor: '#F5F5F5' },
  outfitDateText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  outfitActionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  outfitItemCount: { fontSize: 11, color: '#888', fontWeight: '600' }
});