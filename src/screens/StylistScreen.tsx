import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, Animated, PanResponder, Image, Alert, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../context/ProfileContext';
import { ClothingItem } from '../types';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const MOCK_TOPS = ['https://images.unsplash.com/photo-1554568218-0f1715e72254?w=400', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400'];
const MOCK_BOTTOMS = ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400', 'https://images.unsplash.com/photo-1584865288642-42078afe6942?w=400'];
const MOCK_SHOES = ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400'];
const MOCK_WARDROBE = [...MOCK_TOPS, ...MOCK_BOTTOMS, ...MOCK_SHOES];

// 🚀 AKILLI CANVAS EŞYASI (DOKUNULMADI, KORUNULDU)
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
            <MaterialCommunityIcons name="refresh" size={18} color="#CCFF00" style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default function StylistScreen() {
  const insets = useSafeAreaInsets();

  // 🚀 KULLANICI PROFİLİ (Header için)
const { profileName, profileImage } = useProfile();
  const displayName = profileName || "Jane";
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

  const route = useRoute<any>(); 
  const anchorItemId = route.params?.anchorItemId;

  const [activeTab, setActiveTab] = useState('Dress Me'); 
  const [isLoading, setIsLoading] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  // Kilitlenen (Pinlenen) satırların ID'lerini tutar
  const [pinnedRows, setPinnedRows] = useState<string[]>([]);
  
  // Kaydırma motoru için ScrollView referanslarını tutan sözlük
  const scrollViewRefs = useRef<{ [key: string]: ScrollView | null }>({});

// 🚀 GERÇEK ZAMANLI HAVA DURUMU (Şehir bilgisi ile)
  const [weather, setWeather] = useState({ temp: '--°C', city: 'Konum Bulunuyor...', icon: 'loader' });

// ☁️ ÜCRETSİZ HAVA DURUMU VE ŞEHİR MOTORU (Open-Meteo & Expo)
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setWeather({ temp: '--', city: 'İzin Yok', icon: 'slash' });
          return;
        }

        // 1. Koordinatları Al
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // 2. Koordinatı Şehre Çevir (Ücretsiz Expo Metodu)
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        const cityName = geocode[0]?.city || geocode[0]?.subregion || 'Konum';

        // 3. Open-Meteo'dan Hava Durumunu Çek (API KEY YOK, SINIR YOK!)
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const data = await res.json();

        if (data.current_weather) {
          const wmoCode = data.current_weather.weathercode;
          const temp = Math.round(data.current_weather.temperature);
          
          // WMO (Dünya Meteoroloji Örgütü) Kodlarını İkonlara Çevir
          let featherIcon = 'sun';
          if (wmoCode >= 1 && wmoCode <= 3) featherIcon = 'cloud'; // Parçalı bulutlu
          if (wmoCode >= 45 && wmoCode <= 48) featherIcon = 'align-justify'; // Sisli
          if (wmoCode >= 51 && wmoCode <= 67) featherIcon = 'cloud-rain'; // Yağmurlu
          if (wmoCode >= 71 && wmoCode <= 77) featherIcon = 'cloud-snow'; // Karlı
          if (wmoCode >= 95) featherIcon = 'cloud-lightning'; // Fırtınalı

          setWeather({
            temp: `${temp}°C`,
            city: cityName,
            icon: featherIcon
          });
        }
      } catch (error) {
        console.warn("Hava durumu motoru hatası: ", error);
        setWeather({ temp: '10°C', city: 'İstanbul', icon: 'cloud' }); // Çökerse varsayılan
      }
    })();
  }, []);

  // CANVAS STATE YÖNETİMİ
  const [canvasItems, setCanvasItems] = useState<any[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // 🚀 DRESS ME MİZANPAJ STATE'İ
  // 0: Tops, Bottoms, Footwear
  // 1: Full_body, Footwear, Acc, Acc, Acc
  // 2: Outerwear, Tops, Bottoms, Footwear, Acc, Acc
  const [activeDressMeLayout, setActiveDressMeLayout] = useState<0 | 1 | 2>(0);

  // GERÇEK VERİTABANI VERİLERİ
  const [allWardrobe, setAllWardrobe] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => { fetchRealWardrobe(); }, [])
  );

  const fetchRealWardrobe = async () => {
    try {
      const response = await fetch('http://10.87.14.78:8080/api/v1/clothes/3');
      if (response.ok) {
        const data = await response.json();
        const formatted = data.map((item: any) => ({ 
          id: item.id.toString(), 
          uri: item.imageUrl, 
          category: item.category 
        }));
        setAllWardrobe(formatted.reverse());
      }
    } catch (error) { console.error("Dolap çekilirken hata: ", error); }
  };

  // CANVAS FONKSİYONLARI (KORUNULDU)
  const addItemToCanvas = () => {
    if (allWardrobe.length === 0) return Alert.alert("Uyarı", "Dolabınızda kıyafet bulunamadı!");
    const randomItem = allWardrobe[Math.floor(Math.random() * allWardrobe.length)];
    const randomX = width * 0.2 + Math.random() * 50;
    const randomY = height * 0.1 + Math.random() * 100;
    const newItemId = `canvas_${Date.now()}`;
    const newItem = { id: newItemId, uri: randomItem.uri, zIndex: maxZIndex + 1, x: randomX, y: randomY, rotation: 0 };
    setMaxZIndex(maxZIndex + 1);
    setCanvasItems([...canvasItems, newItem]);
    setSelectedItemId(newItemId);
  };
  const handleSelect = (id: string) => { setSelectedItemId(id); setMaxZIndex(prev => prev + 1); setCanvasItems(items => items.map(item => item.id === id ? { ...item, zIndex: maxZIndex + 1 } : item)); };
  const handleDeselectAll = () => { setSelectedItemId(null); };
  const handleBringForward = () => { if (!selectedItemId) return; setMaxZIndex(prev => prev + 1); setCanvasItems(items => items.map(item => item.id === selectedItemId ? { ...item, zIndex: maxZIndex + 1 } : item)); };
  const handleSendBackward = () => { if (!selectedItemId) return; setCanvasItems(items => items.map(item => item.id === selectedItemId ? { ...item, zIndex: Math.max(1, item.zIndex - 1) } : item)); };
  const handleDuplicate = () => { if (!selectedItemId) return; const itemToCopy = canvasItems.find(i => i.id === selectedItemId); if (itemToCopy) { const newItemId = `canvas_copy_${Date.now()}`; setMaxZIndex(prev => prev + 1); const newItem = { ...itemToCopy, id: newItemId, zIndex: maxZIndex + 1, x: itemToCopy.x + 20, y: itemToCopy.y + 20 }; setCanvasItems([...canvasItems, newItem]); setSelectedItemId(newItemId); } };
  const handleDelete = () => { if (!selectedItemId) return; setCanvasItems(items => items.filter(item => item.id !== selectedItemId)); setSelectedItemId(null); };
  const handleRotate = (id: string) => { setCanvasItems(items => items.map(item => item.id === id ? { ...item, rotation: (item.rotation || 0) + 15 } : item)); };

  // 📌 KİLİTLEME FONKSİYONU (İğneye basınca çalışır)
  const togglePin = (rowId: string) => {
    setPinnedRows(prev => 
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  };

  // 🎰 MIX (KARIŞTIRMA) FONKSİYONU
  const handleDiceRoll = () => {
    setIsLoading(true);
    // Ekranda aktif olan her bir satırı (Tops, Bottoms vb.) kontrol et
    dressMeRows.forEach(row => {
      // EĞER SATIR KİLİTLİ DEĞİLSE (PINNEDROWS İÇİNDE YOKSA) KAYDIR!
      if (!pinnedRows.includes(row.id)) {
        const ref = scrollViewRefs.current[row.id];
        
        if (ref && row.data.length > 0) {
          // O kategorideki kıyafet sayısı arasından rastgele bir indeks seç
          const randomIndex = Math.floor(Math.random() * row.data.length);
          
          // Slot makinesi animasyonunu tetikle (width değeri resimlerin genişliğidir)
          ref.scrollTo({ x: randomIndex * width, animated: true });
        }
      }
    });

    // Animasyonların bitmesini bekle ve yükleniyor ikonunu kapat
    setTimeout(() => { setIsLoading(false); }, 800);
  };

  // ------------------------------------

  // 🚀 DİNAMİK DRESS ME MİZANPAJ (LAYOUT) MOTORU
  const getCategoryItems = (catName: string) => allWardrobe.filter(item => item.category === catName);

  // Kombin Gösterim Notasyonları 3 farklı dizilimin tanımları 
  const DRESS_ME_LAYOUTS = [
    ['Tops', 'Bottoms', 'Footwear','Accessories'], // Tuş 1
    ['Full_body', 'Footwear', 'Accessories', 'Accessories', 'Accessories'], // Tuş 2
    ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories', 'Accessories'] // Tuş 4 (Mix'in sağı)
  ];

  const currentLayoutCategories = DRESS_ME_LAYOUTS[activeDressMeLayout];
  
  // Seçili düzene göre satırları hazırlıyoruz
  const dressMeRows = currentLayoutCategories.map((catName, index) => {
    return {
      id: `${catName.toLowerCase()}_${index}`, // Aynı kategori tekrar ederse diye index ekledik
      data: getCategoryItems(catName)
    };
  }).filter(row => row.data.length > 0); // Sadece içi dolu olanları ekrana basıyoruz

  //  Küçültülmüş, İsimsiz Büyük Görselli Slot Satırı
const renderDressMeRow = (rowId: string, items: any[]) => (
    <View style={styles.dressMeRowContainer} key={rowId}>
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false} 
        snapToInterval={width} 
        decelerationRate="fast"
        // 🚀 MOTOR BAĞLANTISI: Referansı kaydediyoruz
        ref={(el) => (scrollViewRefs.current[rowId] = el)} 
      >
        {items.map((item, index) => (
          <View key={`${rowId}-${item.id}-${index}`} style={styles.dressMeImageWrapper}>
            <Image source={{ uri: item.uri }} style={styles.dressMeItemImage} />
            
            {/* 🚀 KİLİT (PIN) BUTONU BAĞLANTISI */}
            <TouchableOpacity 
              style={[styles.pinIconContainer, pinnedRows.includes(rowId) && { backgroundColor: '#1A1A1A', borderRadius: 15 }]} 
              activeOpacity={0.7}
              onPress={() => togglePin(rowId)} // Tıklanınca Kilitler/Açar
            >
              <MaterialCommunityIcons 
                name={pinnedRows.includes(rowId) ? "pin" : "pin-outline"} 
                size={22} 
                // Kilitliyse Fosforlu Yeşil, Değilse Siyah
                color={pinnedRows.includes(rowId) ? "#CCFF00" : "#1A1A1A"} 
                style={{ transform: [{ rotate: '45deg' }] }} 
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* HEADER */}
<View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: profileImage || defaultAvatar }} style={styles.profileImage} />
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Hey, {displayName} !</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.weatherBadge}>
            <Feather name={weather.icon as any} size={14} color="#555" />
            <Text style={styles.weatherText}>{weather.city}, {weather.temp}</Text>
            <Feather name="chevron-down" size={14} color="#555" />
          </View>
          <TouchableOpacity style={[styles.modeToggle, is3DMode && styles.modeToggleActive]} onPress={() => setIs3DMode(!is3DMode)}>
            <Text style={[styles.modeToggleText, is3DMode && styles.modeToggleTextActive]}>{is3DMode ? '3D' : '2D'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEKMELER */}
      <View style={styles.tabsContainer}>
        {['Dress Me', 'Canvas', 'Moodboards'].map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]} onPress={() => {setActiveTab(tab); handleDeselectAll();}}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🚀 DRESS ME SEKMESİ */}
      {activeTab === 'Dress Me' && (
        <ScrollView contentContainerStyle={styles.slotsContainer} showsVerticalScrollIndicator={false}>
           <View style={styles.pinnedBadge}>
             <MaterialCommunityIcons name="pin" size={12} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
             <Text style={styles.pinnedBadgeText}>0 PINNED ITEMS</Text>
           </View>

           {allWardrobe.length === 0 ? (
                <View style={styles.emptyWardrobeContainer}>
                   <MaterialCommunityIcons name="hanger" size={48} color="#D1CFC7" />
                   <Text style={styles.emptyWardrobeText}>Dolabınız henüz boş.</Text>
                </View>
              ) : (
                <>
                  {/* Dinamik satırları render et */}
                  {dressMeRows.map(row => renderDressMeRow(row.id, row.data))}
                </>
              )}
        </ScrollView>
      )}

      {/* CANVAS SEKMESİ (KORUNULDU) */}
      {activeTab === 'Canvas' && (
        <View style={styles.canvasFullArea}>
          <TouchableWithoutFeedback onPress={handleDeselectAll}>
            <View style={styles.canvasInteractionLayer}>
              {canvasItems.length === 0 && <Text style={styles.canvasWatermark}>Tap "Add Items" to build your outfit</Text>}
              {canvasItems.map((item) => (
                <DraggableItem key={item.id} item={{...item, onRotate: handleRotate}} isSelected={item.id === selectedItemId} onSelect={handleSelect} />
              ))}
            </View>
          </TouchableWithoutFeedback>

          {selectedItemId && (
            <View style={styles.toolPalette}>
              <TouchableOpacity style={styles.paletteBtn} onPress={handleBringForward}><MaterialCommunityIcons name="flip-to-front" size={22} color="#1A1A1A" /></TouchableOpacity>
              <TouchableOpacity style={styles.paletteBtn} onPress={handleSendBackward}><MaterialCommunityIcons name="flip-to-back" size={22} color="#1A1A1A" /></TouchableOpacity>
              <TouchableOpacity style={styles.paletteBtn} onPress={handleDuplicate}><Ionicons name="copy-outline" size={22} color="#1A1A1A" /></TouchableOpacity>
              <TouchableOpacity style={styles.paletteBtn} onPress={handleDelete}><Feather name="trash-2" size={20} color="#1A1A1A" /></TouchableOpacity>
            </View>
          )}

          <View style={styles.canvasBottomControls}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => setCanvasItems([])}><MaterialCommunityIcons name="chevron-double-left" size={24} color="#FFF" /></TouchableOpacity>
            <TouchableOpacity style={styles.neonSaveBtn}><Text style={styles.neonSaveText}>Save</Text></TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn}><Feather name="rotate-ccw" size={20} color="#FFF" /></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addItemsBlackBar} onPress={addItemToCanvas} activeOpacity={0.9}>
            <Feather name="chevron-up" size={24} color="#FFF" />
            <Text style={styles.addItemsBarText}>Add Items</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🚀 KÜÇÜLTÜLMÜŞ VE 4 TUŞLU YATAY KONTROL HAPI */}
      {activeTab === 'Dress Me' && !is3DMode && (
        <View style={styles.floatingPillContainer}>
          <View style={styles.floatingPillHorizontal}>
            
            {/* Tuş 1: Tops, Bottoms, Footwear */}
            <TouchableOpacity style={styles.horizontalIconBtn} onPress={() => setActiveDressMeLayout(0)}>
              <MaterialCommunityIcons name="layers-outline" size={22} color={activeDressMeLayout === 0 ? "#1A1A1A" : "#B0B0B0"} />
            </TouchableOpacity>

            {/* Tuş 2: Full_Body, Footwear, Acc, Acc, Acc */}
            <TouchableOpacity style={styles.horizontalIconBtn} onPress={() => setActiveDressMeLayout(1)}>
              <MaterialCommunityIcons name="human-male" size={24} color={activeDressMeLayout === 1 ? "#1A1A1A" : "#B0B0B0"} />
            </TouchableOpacity>
            
            {/* Tuş 3: Outerwear, Tops, Bottoms, Footwear, Acc, Acc */}
            <TouchableOpacity style={styles.horizontalIconBtn} onPress={() => setActiveDressMeLayout(2)}>
              <MaterialCommunityIcons name="layers-triple-outline" size={24} color={activeDressMeLayout === 2 ? "#1A1A1A" : "#B0B0B0"} />
            </TouchableOpacity>

            {/* Tuş 4: SİYAH MIX BUTONU */}
            <TouchableOpacity style={styles.generateOutfitBtnHorizontal} onPress={handleDiceRoll} activeOpacity={0.8}>
              {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : <MaterialCommunityIcons name="shuffle-variant" size={22} color="#FFFFFF" />}
            </TouchableOpacity>
            
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, 

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileImage: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#1A1A1A' },
  greetingContainer: { borderBottomWidth: 1, borderBottomColor: '#EBE8DF', paddingBottom: 2 },
  greetingText: { fontSize: 18, fontWeight: '500', color: '#1A1A1A' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, gap: 5 },
  weatherText: { fontSize: 14, fontWeight: '600', color: '#555' },
  modeToggle: { backgroundColor: '#EBE8DF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D1CFC7' },
  modeToggleActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  modeToggleText: { fontSize: 13, fontWeight: '700', color: '#888' },
  modeToggleTextActive: { color: '#DFFF00' },
  
  nameText: { fontSize: 14, color: '#888', marginTop: 2 },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EBE8DF', marginBottom: 5 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#1A1A1A' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#1A1A1A', fontWeight: '800' },
  
  // 🚀 DRESS ME STİLLERİ (Boyutlar Küçültüldü)
  slotsContainer: { paddingTop: 10, paddingBottom: 120 }, // Hap menü için boşluk
  
  pinnedBadge: { flexDirection: 'row', backgroundColor: '#000000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start', marginLeft: 20, marginBottom: 10, gap: 4, alignItems: 'center' },
  pinnedBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // 🚀 Satır yüksekliği 0.22'den 0.16'ya düşürüldü ki ekrana daha fazla sığsın
  dressMeRowContainer: { width: width, height: height * 0.16, marginBottom: 10 },
  dressMeImageWrapper: { width: width, height: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  // 🚀 Resim genişliği 55%'den 40%'a düşürüldü
  dressMeItemImage: { width: '40%', height: '90%', resizeMode: 'contain' }, 
  pinIconContainer: { position: 'absolute', top: 5, right: width * 0.30, padding: 5 }, 

  emptyWardrobeContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyWardrobeText: { fontSize: 16, color: '#888', marginTop: 10 },

  // CANVAS STİLLERİ (DOKUNULMADI)
  canvasFullArea: { flex: 1, position: 'relative' },
  canvasInteractionLayer: { flex: 1, backgroundColor: '#FAFAFA', overflow: 'hidden' },
  canvasWatermark: { position: 'absolute', top: '40%', alignSelf: 'center', color: '#CCC', fontSize: 16, fontWeight: '700' },
  draggableBox: { position: 'absolute' }, 
  imageWrapper: { padding: 10 },
  selectedWrapper: { borderWidth: 2, borderColor: '#CCFF00', borderStyle: 'dashed', borderRadius: 10 },
  canvasImage: { width: 160, height: 160, resizeMode: 'contain' },
  rotateHandle: { position: 'absolute', bottom: -10, right: -10, backgroundColor: '#FFFFFF', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  toolPalette: { position: 'absolute', right: 15, top: '25%', backgroundColor: '#FFFFFF', borderRadius: 30, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10, zIndex: 999 },
  paletteBtn: { paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  canvasBottomControls: { position: 'absolute', bottom: 100, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, zIndex: 10 },
  circleBtn: { backgroundColor: '#1A1A1A', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  neonSaveBtn: { backgroundColor: '#CCFF00', paddingHorizontal: 35, paddingVertical: 14, borderRadius: 30, shadowColor: '#CCFF00', shadowOffset: {width:0, height:4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  neonSaveText: { color: '#1A1A1A', fontSize: 16, fontWeight: '800' },
  addItemsBlackBar: { position: 'absolute', bottom: 0, width: '100%', height: 80, backgroundColor: '#000000', borderTopLeftRadius: 25, borderTopRightRadius: 25, alignItems: 'center', justifyContent: 'center', paddingBottom: 15, zIndex: 10 },
  addItemsBarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 2 },

  // 🚀 KÜÇÜLTÜLMÜŞ HAP MENÜ STİLLERİ
  floatingPillContainer: { position: 'absolute', bottom: 25, width: '100%', alignItems: 'center', zIndex: 100 },
  floatingPillHorizontal: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', 
    borderRadius: 40, 
    paddingHorizontal: 20, // 25'ten 20'ye düşürüldü
    paddingVertical: 8,    // 10'dan 8'e düşürüldü
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 15, 
    gap: 20               // 30'dan 20'ye düşürüldü
  },
  horizontalIconBtn: { padding: 8 },
  
  // 🚀 KÜÇÜLTÜLMÜŞ MIX BUTONU
  generateOutfitBtnHorizontal: { 
    backgroundColor: '#1A1A1A', 
    width: 50, height: 50, // 56'dan 50'ye düşürüldü
    borderRadius: 25, 
    justifyContent: 'center', alignItems: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 
  },
});