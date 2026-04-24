import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Animated, PanResponder, Image, Alert, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import PremiumToast from '../PremiumToast';
// 🚀 API BAĞLANTISI EKLENDİ (Bunu unutmuştuk!)
import { apiClient } from '../../api/client';

const { width, height } = Dimensions.get('window');
const CURRENT_USER_ID = 1;

// 🚀 KURŞUN GEÇİRMEZ, 60 FPS DRAGGABLE BİLEŞENİ
const DraggableItem = ({ item, isSelected, onSelect }: any) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  // 1. GÜVENLİ TAKİP MERKEZİ
  const panVal = useRef({ x: 0, y: 0 });
  const scaleVal = useRef(1);
  const rotVal = useRef(0);

  useEffect(() => {
    const pid = pan.addListener(val => { panVal.current = val; });
    const sid = scale.addListener(({ value }) => { scaleVal.current = value; });
    const rid = rotation.addListener(({ value }) => { rotVal.current = value; });
    
    return () => {
      pan.removeListener(pid);
      scale.removeListener(sid);
      rotation.removeListener(rid);
    };
  }, []);

  const initialDist = useRef(0);
  const initialAngle = useRef(0);
  const startScale = useRef(1);
  const startRot = useRef(0);
  const isMultiTouch = useRef(false);

  // 2. İKİ PARMAKLA VE TEK PARMAKLA TAŞIMA
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (onSelect) onSelect(item.id);
        
        pan.setOffset({ x: panVal.current.x, y: panVal.current.y });
        pan.setValue({ x: 0, y: 0 });
        
        startScale.current = scaleVal.current;
        startRot.current = rotVal.current;
        isMultiTouch.current = false;
        initialDist.current = 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        if (touches.length >= 2) {
          isMultiTouch.current = true;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          if (initialDist.current === 0) {
            initialDist.current = dist || 1;
            initialAngle.current = angle;
          } else {
            let s = startScale.current * (dist / initialDist.current);
            s = Math.max(0.4, Math.min(s, 4.0)); 
            scale.setValue(s);

            let aDiff = angle - initialAngle.current;
            if (aDiff > 180) aDiff -= 360;
            if (aDiff < -180) aDiff += 360;
            rotation.setValue(startRot.current + aDiff);
          }
        } else if (touches.length === 1) {
          if (!isMultiTouch.current) {
            pan.setValue({ x: gestureState.dx, y: gestureState.dy });
          }
        }
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        isMultiTouch.current = false;
        initialDist.current = 0;
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        isMultiTouch.current = false;
        initialDist.current = 0;
      }
    })
  ).current;

  // 3. SAĞ ALTTAN TEK PARMAKLA DİREKSİYON GİBİ ÇEVİRME
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
      onPanResponderRelease: () => {}
    })
  ).current;

  const rotateStr = rotation.interpolate({
    inputRange: [-36000, 36000],
    outputRange: ['-36000deg', '36000deg']
  });

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
          <Animated.View 
            style={styles.rotateHandle} 
            {...rotatePanResponder.panHandlers} 
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#1A1A1A" style={{ transform: [{ scaleX: -1 }] }} />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

const CATEGORY_ORDER = ['FULL BODY', 'TOPS', 'BOTTOMS', 'FOOTWEAR', 'ACCESSORIES'];

interface CanvasTabProps {
  allWardrobe: {id: string, uri: string, category: string}[];
}

export default function CanvasTab({ allWardrobe }: CanvasTabProps) {
  const [canvasItems, setCanvasItems] = useState<any[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  // BİLDİRİM BURAYA GELDİ
  const [toastVisible, setToastVisible] = useState(false);

  const TRAY_HEIGHT = height * 0.85; 
  const trayTranslateY = useRef(new Animated.Value(TRAY_HEIGHT)).current; 
  const lastTrayY = useRef(TRAY_HEIGHT);

  const openTray = (snapPoint: number) => {
    Animated.spring(trayTranslateY, {
      toValue: snapPoint,
      useNativeDriver: true,
      bounciness: 6, 
    }).start(() => {
      lastTrayY.current = snapPoint;
      setIsTrayOpen(snapPoint < TRAY_HEIGHT);
    });
  };

  const toggleTray = () => {
    if (allWardrobe.length === 0) return Alert.alert("Uyarı", "Dolabınızda kıyafet bulunamadı!");
    if (lastTrayY.current >= TRAY_HEIGHT - 10) {
      openTray(TRAY_HEIGHT * 0.45);
    } else {
      openTray(TRAY_HEIGHT);
    }
  };

  const trayPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        trayTranslateY.setOffset(lastTrayY.current);
        trayTranslateY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dy: trayTranslateY }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        trayTranslateY.flattenOffset();
        const currentY = (trayTranslateY as any)._value;

        let snapTo = 0;
        if (currentY > TRAY_HEIGHT * 0.45 || gesture.vy > 0.8) {
          snapTo = TRAY_HEIGHT; 
        } else if (currentY > TRAY_HEIGHT * 0.15 || gesture.vy > 0.3) {
          snapTo = TRAY_HEIGHT * 0.45; 
        } else {
          snapTo = 0; 
        }
        openTray(snapTo);
      }
    })
  ).current;

  // 🚀 ÇİFT YAZILMIŞ FONKSİYON SİLİNDİ, TEK VE DOĞRU OLAN BURADA!
  const addItemToCanvas = (selectedWardrobeItem: any) => {
    const randomX = width * 0.2 + Math.random() * 50;
    const randomY = height * 0.1 + Math.random() * 50;
    const newItemId = `canvas_${Date.now()}`;
    
    const newItem = { 
      id: newItemId, 
      databaseId: selectedWardrobeItem.id, // Kaydederken bize bu gerçek ID lazım
      uri: selectedWardrobeItem.uri, 
      zIndex: maxZIndex + 1, 
      x: randomX, 
      y: randomY 
    };
    
    setMaxZIndex(maxZIndex + 1);
    setCanvasItems([...canvasItems, newItem]);
    setSelectedItemId(newItemId);
    
    if (lastTrayY.current < TRAY_HEIGHT * 0.2) {
      openTray(TRAY_HEIGHT * 0.45);
    }
  };

// 🚀 GÜNCELLENMİŞ CANVAS KOMBİN KAYDETME
  const handleSaveCanvasOutfit = async () => {
    if (canvasItems.length === 0) {
      Alert.alert("Uyarı", "Tuvalde kaydedilecek eşya yok!");
      return;
    }

    try {
      const realItemIds = canvasItems
        .map(item => parseInt(item.databaseId, 10))
        .filter(id => !isNaN(id) && id > 0);

      // 📦 Java DTO'sunun tam olarak beklediği paket
      const payload = {
        name: `My Canvas Creation`, // Java isim bekliyor!
        clothingItemIds: realItemIds, 
      };

      // 📍 Java'nın beklediği tam adres: /outfits/{userId}/save
      await apiClient.post(`/outfits/${CURRENT_USER_ID}/save`, payload);
      setToastVisible(true); // Başarılı olunca şalteri aç ve Premium bildirimi göster!
      
    } catch (error: any) {
      console.error("Canvas kombin kaydetme hatası:", error.message);
      Alert.alert("Hata", "Kombin kaydedilemedi.");
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
      
      <TouchableWithoutFeedback onPress={handleDeselectAll}>
        <View style={styles.canvasInteractionLayer}>
          {canvasItems.length === 0 && <Text style={styles.canvasWatermark}>Tap "Add Items" to build your outfit</Text>}
          {canvasItems.map((item) => (
            <DraggableItem key={item.id} item={item} isSelected={item.id === selectedItemId} onSelect={handleSelect} />
          ))}
        </View>
      </TouchableWithoutFeedback>

      {selectedItemId && !isTrayOpen && (
        <View style={styles.toolPalette}>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleBringForward}><MaterialCommunityIcons name="flip-to-front" size={22} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleSendBackward}><MaterialCommunityIcons name="flip-to-back" size={22} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleDuplicate}><Ionicons name="copy-outline" size={22} color="#1A1A1A" /></TouchableOpacity>
          <TouchableOpacity style={styles.paletteBtn} onPress={handleDelete}><Feather name="trash-2" size={20} color="#1A1A1A" /></TouchableOpacity>
        </View>
      )}

      <View style={styles.canvasBottomControls}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => setCanvasItems([])}><MaterialCommunityIcons name="chevron-double-left" size={24} color="#FFF" /></TouchableOpacity>
        <TouchableOpacity style={styles.neonSaveBtn} onPress={handleSaveCanvasOutfit} activeOpacity={0.8}><Text style={styles.neonSaveText}>Save</Text></TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn}><Feather name="rotate-ccw" size={20} color="#FFF" /></TouchableOpacity>
      </View>

      <Animated.View style={[styles.trayContainer, { height: TRAY_HEIGHT, transform: [{ translateY: trayTranslateY }] }]}>
        <View style={styles.trayHeader} {...trayPanResponder.panHandlers}>
          <View style={styles.trayHandle} />
          <Text style={styles.trayTitle}>Wardrobe</Text>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.trayVerticalScroll}>
          {CATEGORY_ORDER.map(categoryName => {
            const categoryItems = allWardrobe.filter(i => (i.category || '').toUpperCase() === categoryName);
            if (categoryItems.length === 0) return null;

            return (
              <View key={categoryName} style={styles.categoryRow}>
                <Text style={styles.categoryTitle}>{categoryName}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryHorizontalScroll}>
                  {categoryItems.map(item => (
                    <TouchableOpacity key={item.id} style={styles.trayItemBox} onPress={() => addItemToCanvas(item)}>
                      <Image source={{ uri: item.uri }} style={styles.trayItemImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}
          <View style={{ height: 100 }} /> 
        </ScrollView>
      </Animated.View>

      <TouchableOpacity style={styles.addItemsBlackBar} onPress={toggleTray} activeOpacity={0.9}>
        <Feather name={isTrayOpen ? "chevron-down" : "chevron-up"} size={24} color="#FFF" />
        <Text style={styles.addItemsBarText}>{isTrayOpen ? "Close" : "Add Items"}</Text>
      </TouchableOpacity>

      <PremiumToast 
        visible={toastVisible} 
        message="Kombin Dolabına Eklendi 🦋" 
        onHide={() => setToastVisible(false)} // 3 saniye sonra otomatik kapanınca şalteri kapatır
      />
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
  addItemsBlackBar: { position: 'absolute', bottom: 0, width: '100%', height: 75, backgroundColor: '#000000', borderTopLeftRadius: 25, borderTopRightRadius: 25, alignItems: 'center', justifyContent: 'center', paddingBottom: 10, zIndex: 40 },
  addItemsBarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 2 },
  
  trayContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 25, zIndex: 30 },
  trayHeader: { paddingVertical: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  trayHandle: { width: 50, height: 6, backgroundColor: '#DDD', borderRadius: 3, marginBottom: 10 },
  trayTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1 },
  trayVerticalScroll: { flex: 1 },
  categoryRow: { marginBottom: 20, paddingTop: 10 },
  categoryTitle: { fontSize: 12, fontWeight: '800', color: '#AAA', marginLeft: 20, marginBottom: 10, letterSpacing: 1 },
  categoryHorizontalScroll: { paddingLeft: 20, paddingRight: 10 },
  trayItemBox: { width: 100, height: 100, backgroundColor: '#F9F9F9', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  trayItemImage: { width: '85%', height: '85%', resizeMode: 'contain' }
});