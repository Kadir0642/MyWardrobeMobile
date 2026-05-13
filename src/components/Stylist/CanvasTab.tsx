import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Animated, PanResponder, Image, Alert, TouchableWithoutFeedback, ScrollView, FlatList } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot'; 
import PremiumToast from '../PremiumToast';
import { apiClient } from '../../api/client';
import { useProfile } from '../../context/ProfileContext';

const { width, height } = Dimensions.get('window');

const DraggableItem = ({ item, isSelected, onSelect, onUpdateTransform }: any) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const panVal = useRef({ x: 0, y: 0 });
  const scaleVal = useRef(1);
  const rotVal = useRef(0);

  useEffect(() => {
    const pid = pan.addListener(val => { panVal.current = val; });
    const sid = scale.addListener(({ value }) => { scaleVal.current = value; });
    const rid = rotation.addListener(({ value }) => { rotVal.current = value; });
    return () => { pan.removeListener(pid); scale.removeListener(sid); rotation.removeListener(rid); };
  }, []);

  const startScale = useRef(1);
  const startRot = useRef(0);

  const reportTransforms = () => {
    if (onUpdateTransform) {
      onUpdateTransform(item.id, { translateX: panVal.current.x, translateY: panVal.current.y, scale: scaleVal.current, rotation: rotVal.current });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (onSelect) onSelect(item.id);
        pan.setOffset({ x: panVal.current.x, y: panVal.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => { pan.flattenOffset(); reportTransforms(); },
      onPanResponderTerminate: () => { pan.flattenOffset(); reportTransforms(); }
    })
  ).current;

  const scalePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true, 
      onPanResponderGrant: () => {
        if (onSelect) onSelect(item.id);
        startScale.current = scaleVal.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        let newScale = startScale.current + (gestureState.dy / 150);
        newScale = Math.max(0.4, Math.min(newScale, 4.0)); 
        scale.setValue(newScale);
      },
      onPanResponderRelease: () => { reportTransforms(); }
    })
  ).current;

  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true, 
      onPanResponderGrant: () => {
        if (onSelect) onSelect(item.id);
        startRot.current = rotVal.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        rotation.setValue(startRot.current + gestureState.dx);
      },
      onPanResponderRelease: () => { reportTransforms(); }
    })
  ).current;

  const rotateStr = rotation.interpolate({ inputRange: [-36000, 36000], outputRange: ['-36000deg', '36000deg'] });

  return (
    <Animated.View
      style={[
        styles.draggableBox,
        { top: item.y, left: item.x, zIndex: item.zIndex },
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scale }, { rotate: rotateStr }] }
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.imageWrapper, isSelected && styles.selectedWrapper]}>
        <Image source={{ uri: item.uri }} style={styles.canvasImage} />
        {isSelected && (
          <>
            <Animated.View style={styles.rotateHandle} {...rotatePanResponder.panHandlers}>
              <MaterialCommunityIcons name="refresh" size={16} color="#1A1A1A" />
            </Animated.View>
            <Animated.View style={styles.scaleHandle} {...scalePanResponder.panHandlers}>
              <MaterialCommunityIcons name="arrow-expand-all" size={16} color="#1A1A1A" style={{ transform: [{ rotate: '45deg' }] }} />
            </Animated.View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

const CATEGORIES = ['TOPS', 'BOTTOMS', 'FOOTWEAR', 'OUTERWEAR', 'ACCESSORIES', 'FULL BODY'];

export default function CanvasTab({ allWardrobe }: { allWardrobe: any[] }) {
  const { currentUserId, profileImage } = useProfile(); 
  
  const [canvasItems, setCanvasItems] = useState<any[]>([]);
  const [itemTransforms, setItemTransforms] = useState<Record<string, any>>({}); 
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  
  const [isCapturing, setIsCapturing] = useState(false); 
  const viewShotRef = useRef<ViewShot>(null); 
  const [activeCategory, setActiveCategory] = useState('TOPS');

  const TRAY_HEIGHT = height * 0.85; 
  const trayTranslateY = useRef(new Animated.Value(TRAY_HEIGHT)).current; 
  const lastTrayY = useRef(TRAY_HEIGHT);

  const filteredWardrobe = useMemo(() => {
    return allWardrobe.filter(item => (item.category || '').toUpperCase() === activeCategory);
  }, [allWardrobe, activeCategory]);

  const openTray = (snapPoint: number) => {
    Animated.spring(trayTranslateY, { toValue: snapPoint, useNativeDriver: true, bounciness: 6 }).start(() => {
      lastTrayY.current = snapPoint;
      setIsTrayOpen(snapPoint < TRAY_HEIGHT);
    });
  };

  const toggleTray = () => {
    if (allWardrobe.length === 0) return Alert.alert("Uyarı", "Dolabınızda kıyafet bulunamadı!");
    if (lastTrayY.current >= TRAY_HEIGHT - 10) openTray(TRAY_HEIGHT * 0.45);
    else openTray(TRAY_HEIGHT);
  };

  const trayPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { trayTranslateY.setOffset(lastTrayY.current); trayTranslateY.setValue(0); },
      onPanResponderMove: Animated.event([null, { dy: trayTranslateY }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        trayTranslateY.flattenOffset();
        const currentY = (trayTranslateY as any)._value;
        let snapTo = 0;
        if (currentY > TRAY_HEIGHT * 0.45 || gesture.vy > 0.8) snapTo = TRAY_HEIGHT; 
        else if (currentY > TRAY_HEIGHT * 0.15 || gesture.vy > 0.3) snapTo = TRAY_HEIGHT * 0.45; 
        else snapTo = 0; 
        openTray(snapTo);
      }
    })
  ).current;

  const addItemToCanvas = (selectedWardrobeItem: any) => {
    // 🚀 DÜZELTME: Kıyafetler artık ekranın 3'te 1 hizasında belirir, tavana yapışmaz!
    const randomX = width * 0.25 + Math.random() * 50;
    const randomY = height * 0.25 + Math.random() * 50;
    const newItemId = `canvas_${Date.now()}`;
    const newItem = { id: newItemId, databaseId: selectedWardrobeItem.id, uri: selectedWardrobeItem.uri, zIndex: maxZIndex + 1, x: randomX, y: randomY };
    setMaxZIndex(maxZIndex + 1);
    setCanvasItems([...canvasItems, newItem]);
    setSelectedItemId(newItemId);
    if (lastTrayY.current < TRAY_HEIGHT * 0.2) openTray(TRAY_HEIGHT * 0.45);
  };

  const handleUpdateTransform = (id: string, transforms: any) => {
    setItemTransforms(prev => ({ ...prev, [id]: transforms }));
  };

  const handleSaveCanvasOutfit = async () => {
    if (canvasItems.length === 0) { Alert.alert("Warning", "Add some items to the canvas first!"); return; }

    try {
      setIsCapturing(true); // 🚀 Şeridin opacity'sini 1 yapar
      setSelectedItemId(null); // Çizgileri kaldırır
      
      // 🚀 Flaş efekti ve resmin belirmesi için bekleme
      await new Promise(resolve => setTimeout(resolve, 150));

      const uri = await viewShotRef.current?.capture?.();
      if (!uri) throw new Error("Screenshot failed");

      // Çekim bittikten sonra şeridi anında gizle
      setIsCapturing(false);

      const formData = new FormData();
      formData.append('image', { uri: uri, name: 'lookbook.jpg', type: 'image/jpeg' } as any);

      const uploadResponse = await apiClient.post('/vton/upload-person', formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
      });
      
      let cloudinaryUrl = uploadResponse.data.url;
      if (cloudinaryUrl.includes('cloudinary.com')) {
          cloudinaryUrl = cloudinaryUrl.replace('/upload/', '/upload/f_webp,q_auto:eco/');
      }

      const canvasDataPayload = canvasItems.map(item => {
        const transform = itemTransforms[item.id] || { translateX: 0, translateY: 0, scale: 1, rotation: 0 };
        return {
          clothingId: parseInt(item.databaseId, 10),
          x: item.x + transform.translateX,
          y: item.y + transform.translateY,
          scale: transform.scale,
          rotation: transform.rotation,
          zIndex: item.zIndex
        };
      });

      const payload = {
        userId: currentUserId,
        name: `Lookbook ${new Date().toLocaleDateString()}`,
        outfitImageUrl: cloudinaryUrl, 
        clothingItemIds: canvasDataPayload.map(i => i.clothingId),
        canvasData: JSON.stringify(canvasDataPayload),
        type: "LOOKBOOK" // 🚀 Java için Ayrıştırıcı Etiket
      };

      await apiClient.post(`/outfits/save-ar-look`, payload); 
      setToastVisible(true); 
    } catch (error: any) {
      console.error("Canvas kaydetme hatası:", error);
      Alert.alert("Error", "Could not save the Lookbook.");
      setIsCapturing(false);
    }
  };

  const handleSelect = (id: string) => { setSelectedItemId(id); setMaxZIndex(prev => prev + 1); setCanvasItems(items => items.map(item => item.id === id ? { ...item, zIndex: maxZIndex + 1 } : item)); };
  const handleDeselectAll = () => { setSelectedItemId(null); openTray(TRAY_HEIGHT); }; 
  const handleBringForward = () => { if (!selectedItemId) return; setMaxZIndex(prev => prev + 1); setCanvasItems(items => items.map(item => item.id === selectedItemId ? { ...item, zIndex: maxZIndex + 1 } : item)); };
  const handleSendBackward = () => { if (!selectedItemId) return; setCanvasItems(items => items.map(item => item.id === selectedItemId ? { ...item, zIndex: Math.max(1, item.zIndex - 1) } : item)); };
  const handleDuplicate = () => { if (!selectedItemId) return; const itemToCopy = canvasItems.find(i => i.id === selectedItemId); if (itemToCopy) { const newItemId = `canvas_copy_${Date.now()}`; setMaxZIndex(prev => prev + 1); const newItem = { ...itemToCopy, id: newItemId, zIndex: maxZIndex + 1, x: itemToCopy.x + 20, y: itemToCopy.y + 20 }; setCanvasItems([...canvasItems, newItem]); setSelectedItemId(newItemId); } };
  const handleDelete = () => { if (!selectedItemId) return; setCanvasItems(items => items.filter(item => item.id !== selectedItemId)); setSelectedItemId(null); };

  return (
    <View style={styles.canvasFullArea}>
      
      <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.8 }} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={handleDeselectAll}>
          <View style={styles.canvasInteractionLayer}>
            
            {/* 🚀 ARKA PLAN (Sürekli Görünür) */}
            {canvasItems.length === 0 && <Text style={styles.canvasWatermark}>Tap "Add Items" to build your outfit</Text>}
            
            {/* KIYAFETLER */}
            {canvasItems.map((item) => (
              <DraggableItem key={item.id} item={item} isSelected={item.id === selectedItemId && !isCapturing} onSelect={handleSelect} onUpdateTransform={handleUpdateTransform} />
            ))}

            {/* 🚀 FİLİGRAN İLLÜZYONU: Sürekli render edilir (resmin yüklenmesi için), ama sadece çekim anında görünür! */}
            <View style={[styles.premiumWatermarkBand, { opacity: isCapturing ? 1 : 0 }]} pointerEvents="none">
              <View style={styles.watermarkLeft}>
                <Image source={{ uri: profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }} style={styles.watermarkAvatar} />
                <Text style={styles.watermarkUserText}>From @kadir's closet</Text>
              </View>
              <View style={styles.watermarkRight}>
                <Text style={styles.watermarkCreatedText}>CREATED ON</Text>
                <Text style={styles.watermarkVestifyText}>VESTIFY</Text>
              </View>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </ViewShot>

      {selectedItemId && !isTrayOpen && !isCapturing && (
        <View style={styles.toolPalette}>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleBringForward}><MaterialCommunityIcons name="flip-to-front" size={22} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleSendBackward}><MaterialCommunityIcons name="flip-to-back" size={22} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleDuplicate}><Ionicons name="copy-outline" size={22} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleDelete}><Feather name="trash-2" size={20} color="#1A1A1A" /></TouchableOpacity>
        </View>
      )}

      <View style={styles.canvasBottomControls}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => setCanvasItems([])}><MaterialCommunityIcons name="chevron-double-left" size={24} color="#FFF" /></TouchableOpacity>
        <TouchableOpacity style={[styles.neonSaveBtn, isCapturing && { opacity: 0.7 }]} onPress={handleSaveCanvasOutfit} activeOpacity={0.8} disabled={isCapturing}>
          <Text style={styles.neonSaveText}>{isCapturing ? "Saving..." : "Save Look"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn}><Feather name="rotate-ccw" size={20} color="#FFF" /></TouchableOpacity>
      </View>

      <Animated.View style={[styles.trayContainer, { height: TRAY_HEIGHT, transform: [{ translateY: trayTranslateY }] }]}>
        <View style={styles.trayHeader} {...trayPanResponder.panHandlers}>
          <View style={styles.trayHandle} />
          <Text style={styles.trayTitle}>Wardrobe</Text>
        </View>

        <View style={styles.filterSortBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]} onPress={() => setActiveCategory(cat)}>
                <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredWardrobe}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.trayItemBox} onPress={() => addItemToCanvas(item)}>
              <Image source={{ uri: item.uri }} style={styles.trayItemImage} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.flatListContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15} 
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={<View style={{alignItems: 'center', marginTop: 40}}><Text style={{color: '#666'}}>No items found in {activeCategory}.</Text></View>}
        />
      </Animated.View>

      <TouchableOpacity style={styles.addItemsBlackBar} onPress={toggleTray} activeOpacity={0.9}>
        <Feather name={isTrayOpen ? "chevron-down" : "chevron-up"} size={24} color="#FFF" />
        <Text style={styles.addItemsBarText}>{isTrayOpen ? "Close" : "Add Items"}</Text>
      </TouchableOpacity>

      <PremiumToast visible={toastVisible} message="Lookbook saved perfectly ✨" onHide={() => setToastVisible(false)} />
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
  
  rotateHandle: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5, borderWidth: 1, borderColor: '#DDD' },
  scaleHandle: { position: 'absolute', bottom: -10, right: -10, backgroundColor: '#DFFF00', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  
  toolPalette: { position: 'absolute', right: 15, top: '25%', backgroundColor: '#FFFFFF', borderRadius: 30, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10, zIndex: 999 },
  paletteBtn: { paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  canvasBottomControls: { position: 'absolute', bottom: 100, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, zIndex: 10 },
  circleBtn: { backgroundColor: '#1A1A1A', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  neonSaveBtn: { backgroundColor: '#DFFF00', paddingHorizontal: 35, paddingVertical: 14, borderRadius: 30, shadowColor: '#DFFF00', shadowOffset: {width:0, height:4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  neonSaveText: { color: '#1A1A1A', fontSize: 16, fontWeight: '800' },
  addItemsBlackBar: { position: 'absolute', bottom: 0, width: '100%', height: 75, backgroundColor: '#000000', borderTopLeftRadius: 25, borderTopRightRadius: 25, alignItems: 'center', justifyContent: 'center', paddingBottom: 10, zIndex: 40 },
  addItemsBarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 2 },
  
  // 🚀 TASARIMDAKİ MERKEZİ ŞERİT FİLİGRAN
  premiumWatermarkBand: { position: 'absolute', top: '50%', width: '100%', height: 64, marginTop: -32, backgroundColor: 'rgba(245, 242, 235, 0.95)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1A1A1A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, zIndex: 1000 },
  watermarkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  watermarkAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#1A1A1A' },
  watermarkUserText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', letterSpacing: 0.5 },
  watermarkRight: { borderLeftWidth: 1, borderColor: '#1A1A1A', paddingLeft: 15, justifyContent: 'center' },
  watermarkCreatedText: { fontSize: 8, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  watermarkVestifyText: { fontSize: 14, fontWeight: '900', color: '#1A1A1A', letterSpacing: 1.5, marginTop: 2 },

  trayContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 25, zIndex: 30 },
  trayHeader: { paddingVertical: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  trayHandle: { width: 50, height: 6, backgroundColor: '#DDD', borderRadius: 3, marginBottom: 10 },
  trayTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1 },
  filterSortBar: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 5, paddingVertical: 5 },
  categoryScroll: { paddingHorizontal: 10 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EBE8DF', marginRight: 8, borderWidth: 1, borderColor: '#D1CFC7' },
  categoryPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  categoryPillText: { fontSize: 11, fontWeight: '700', color: '#666' },
  categoryPillTextActive: { color: '#FFF' },
  flatListContent: { paddingHorizontal: 15, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'flex-start', gap: 12, marginBottom: 12 },
  trayItemBox: { width: (width * 0.9 - 24) / 3, height: (width * 0.9 - 24) / 3, backgroundColor: '#F9F9F9', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  trayItemImage: { width: '85%', height: '85%', resizeMode: 'contain' }
});