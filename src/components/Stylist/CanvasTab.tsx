import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Animated, PanResponder, Image, Alert, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// 🚀 AKILLI CANVAS EŞYASI 
const DraggableItem = ({ item, isSelected, onSelect }: any) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const baseScale = useRef(1);
  const initialDistance = useRef<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect(item.id); 
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
        initialDistance.current = null;
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (!initialDistance.current) {
            initialDistance.current = distance;
          } else {
            const scaleFactor = distance / initialDistance.current;
            let newScale = baseScale.current * scaleFactor;
            if (newScale < 0.4) newScale = 0.4;
            if (newScale > 3.0) newScale = 3.0;
            scale.setValue(newScale);
          }
        } else if (touches.length === 1 && !initialDistance.current) {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        baseScale.current = (scale as any)._value;
        initialDistance.current = null;
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.draggableBox,
        { top: item.y, left: item.x },
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scale }, { rotate: `${item.rotation || 0}deg` }], zIndex: item.zIndex }
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.imageWrapper, isSelected && styles.selectedWrapper]}>
        <Image source={{ uri: item.uri }} style={styles.canvasImage} />
        {isSelected && (
          <TouchableOpacity 
            style={styles.rotateHandle} 
            onPress={(e) => { 
              e.stopPropagation(); 
              item.onRotate(item.id); 
            }}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#1A1A1A" style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

interface CanvasTabProps {
  allWardrobe: {id: string, uri: string, category: string}[];
}

export default function CanvasTab({ allWardrobe }: CanvasTabProps) {
  const [canvasItems, setCanvasItems] = useState<any[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // 🚀 TEPSE KONTROLÜ (Açık mı, Kapalı mı?)
  const [isTrayOpen, setIsTrayOpen] = useState(false);

  // 🚀 RASTGELE DEĞİL, KULLANICININ SEÇTİĞİ KIYAFETİ EKLER
  const addItemToCanvas = (selectedWardrobeItem: any) => {
    const randomX = width * 0.2 + Math.random() * 50;
    const randomY = height * 0.1 + Math.random() * 100;
    const newItemId = `canvas_${Date.now()}`;
    const newItem = { id: newItemId, uri: selectedWardrobeItem.uri, zIndex: maxZIndex + 1, x: randomX, y: randomY, rotation: 0 };
    setMaxZIndex(maxZIndex + 1);
    setCanvasItems([...canvasItems, newItem]);
    setSelectedItemId(newItemId);
    setIsTrayOpen(false); // Ekledikten sonra tepsiyi kapat
  };

  const handleSelect = (id: string) => { setSelectedItemId(id); setMaxZIndex(prev => prev + 1); setCanvasItems(items => items.map(item => item.id === id ? { ...item, zIndex: maxZIndex + 1 } : item)); };
  const handleDeselectAll = () => { setSelectedItemId(null); setIsTrayOpen(false); };
  const handleBringForward = () => { if (!selectedItemId) return; setMaxZIndex(prev => prev + 1); setCanvasItems(items => items.map(item => item.id === selectedItemId ? { ...item, zIndex: maxZIndex + 1 } : item)); };
  const handleSendBackward = () => { if (!selectedItemId) return; setCanvasItems(items => items.map(item => item.id === selectedItemId ? { ...item, zIndex: Math.max(1, item.zIndex - 1) } : item)); };
  const handleDuplicate = () => { if (!selectedItemId) return; const itemToCopy = canvasItems.find(i => i.id === selectedItemId); if (itemToCopy) { const newItemId = `canvas_copy_${Date.now()}`; setMaxZIndex(prev => prev + 1); const newItem = { ...itemToCopy, id: newItemId, zIndex: maxZIndex + 1, x: itemToCopy.x + 20, y: itemToCopy.y + 20 }; setCanvasItems([...canvasItems, newItem]); setSelectedItemId(newItemId); } };
  const handleDelete = () => { if (!selectedItemId) return; setCanvasItems(items => items.filter(item => item.id !== selectedItemId)); setSelectedItemId(null); };
  const handleRotate = (id: string) => { setCanvasItems(items => items.map(item => item.id === id ? { ...item, rotation: (item.rotation || 0) + 15 } : item)); };

  return (
    <View style={styles.canvasFullArea}>
      
      {/* 🚀 TUVAL (ARKAPLAN) */}
      <TouchableWithoutFeedback onPress={handleDeselectAll}>
        <View style={styles.canvasInteractionLayer}>
          {canvasItems.length === 0 && <Text style={styles.canvasWatermark}>Tap "Add Items" to build your outfit</Text>}
          {canvasItems.map((item) => (
            <DraggableItem key={item.id} item={{...item, onRotate: handleRotate}} isSelected={item.id === selectedItemId} onSelect={handleSelect} />
          ))}
        </View>
      </TouchableWithoutFeedback>

      {/* ARAÇ PALETİ */}
      {selectedItemId && !isTrayOpen && (
        <View style={styles.toolPalette}>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleBringForward}><MaterialCommunityIcons name="flip-to-front" size={22} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleSendBackward}><MaterialCommunityIcons name="flip-to-back" size={22} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleDuplicate}><Ionicons name="copy-outline" size={22} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleDelete}><Feather name="trash-2" size={20} color="#1A1A1A" /></TouchableOpacity>
        </View>
      )}

      {/* DİP BUTONLAR */}
      <View style={styles.canvasBottomControls}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => setCanvasItems([])}><MaterialCommunityIcons name="chevron-double-left" size={24} color="#FFF" /></TouchableOpacity>
        <TouchableOpacity style={styles.neonSaveBtn}><Text style={styles.neonSaveText}>Save</Text></TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn}><Feather name="rotate-ccw" size={20} color="#FFF" /></TouchableOpacity>
      </View>

      {/* 🚀 YENİ EKLENEN AÇILIR KIYAFET TEPSİSİ */}
      {isTrayOpen && (
        <View style={styles.trayContainer}>
          <View style={styles.trayHeader}>
            <Text style={styles.trayTitle}>Select an Item</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayScroll}>
            {allWardrobe.map(item => (
              <TouchableOpacity key={item.id} style={styles.trayItemBox} onPress={() => addItemToCanvas(item)}>
                <Image source={{ uri: item.uri }} style={styles.trayItemImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ADD ITEMS (AÇ/KAPA) BUTONU */}
      <TouchableOpacity 
        style={styles.addItemsBlackBar} 
        onPress={() => {
          if (allWardrobe.length === 0) return Alert.alert("Uyarı", "Dolabınızda kıyafet bulunamadı!");
          setIsTrayOpen(!isTrayOpen);
        }} 
        activeOpacity={0.9}
      >
        <Feather name={isTrayOpen ? "chevron-down" : "chevron-up"} size={24} color="#FFF" />
        <Text style={styles.addItemsBarText}>{isTrayOpen ? "Close Tray" : "Add Items"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasFullArea: { flex: 1, position: 'relative' },
  canvasInteractionLayer: { flex: 1, backgroundColor: '#FAFAFA', overflow: 'hidden' },
  canvasWatermark: { position: 'absolute', top: '40%', alignSelf: 'center', color: '#CCC', fontSize: 16, fontWeight: '700' },
  draggableBox: { position: 'absolute' }, 
  imageWrapper: { padding: 10 },
  selectedWrapper: { borderWidth: 2, borderColor: '#DFFF00', borderStyle: 'dashed', borderRadius: 10 },
  canvasImage: { width: 140, height: 140, resizeMode: 'contain' },
  rotateHandle: { position: 'absolute', bottom: -10, right: -10, backgroundColor: '#DFFF00', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  toolPalette: { position: 'absolute', right: 15, top: '25%', backgroundColor: '#FFFFFF', borderRadius: 30, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10, zIndex: 999 },
  paletteBtn: { paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  canvasBottomControls: { position: 'absolute', bottom: 100, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, zIndex: 10 },
  circleBtn: { backgroundColor: '#1A1A1A', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  neonSaveBtn: { backgroundColor: '#DFFF00', paddingHorizontal: 35, paddingVertical: 14, borderRadius: 30, shadowColor: '#DFFF00', shadowOffset: {width:0, height:4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  neonSaveText: { color: '#1A1A1A', fontSize: 16, fontWeight: '800' },
  addItemsBlackBar: { position: 'absolute', bottom: 0, width: '100%', height: 80, backgroundColor: '#000000', borderTopLeftRadius: 25, borderTopRightRadius: 25, alignItems: 'center', justifyContent: 'center', paddingBottom: 15, zIndex: 30 },
  addItemsBarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 2 },
  
  // 🚀 TEPSİ STİLLERİ
  trayContainer: { position: 'absolute', bottom: 70, width: '100%', height: 160, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20, zIndex: 20 },
  trayHeader: { padding: 15, paddingBottom: 5, alignItems: 'center' },
  trayTitle: { fontSize: 14, fontWeight: '700', color: '#888' },
  trayScroll: { paddingHorizontal: 15, alignItems: 'center' },
  trayItemBox: { width: 90, height: 90, backgroundColor: '#F5F5F5', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#EBE8DF' },
  trayItemImage: { width: '80%', height: '80%', resizeMode: 'contain' }
});