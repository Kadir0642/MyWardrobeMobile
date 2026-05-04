import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, PanResponder, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ARItemSelectorTray from './ARItemSelectorTray'; 
import { apiClient } from '../../api/client'; // KENDİ API İSTEMCİMİZ

const { width, height } = Dimensions.get('window');
const CURRENT_USER_ID = "1";

interface ARTryOnTabProps {
  allWardrobe: any[];
  allOutfits?: any[];  // Kombinlerin gelmesi için prop eklendi
}

export default function ARTryOnTab({ allWardrobe, allOutfits = [] }: ARTryOnTabProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]); 

  // 🚀 3 KADEMELİ TEPSİ MATEMATİĞİ
  const TRAY_HEIGHT = height * 0.85; 
  const PEEK_Y = TRAY_HEIGHT - 90;   
  const MID_Y = TRAY_HEIGHT * 0.4;   
  const TOP_Y = 0;                   

  const translateY = useRef(new Animated.Value(PEEK_Y)).current;

  // Boşluğa tıklayınca tepsiyi kapat
  const closeTray = () => {
    Animated.spring(translateY, { toValue: PEEK_Y, useNativeDriver: false, friction: 7, tension: 40 }).start();
  };

  // 🚀 SÜRÜKLEME VE YAPIŞTIRMA MEKANİZMASI
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const currentY = (translateY as any)._value;
        const vy = gestureState.vy; 

        let targetY = PEEK_Y;

        if (vy < -0.5) {
          targetY = currentY < MID_Y ? TOP_Y : MID_Y;
        } else if (vy > 0.5) {
          targetY = currentY > MID_Y ? PEEK_Y : MID_Y;
        } else {
          const distToTop = Math.abs(currentY - TOP_Y);
          const distToMid = Math.abs(currentY - MID_Y);
          const distToPeek = Math.abs(currentY - PEEK_Y);

          if (distToTop < distToMid && distToTop < distToPeek) targetY = TOP_Y;
          else if (distToMid < distToTop && distToMid < distToPeek) targetY = MID_Y;
          else targetY = PEEK_Y;
        }

        targetY = Math.max(TOP_Y, Math.min(PEEK_Y, targetY));
        Animated.spring(translateY, { toValue: targetY, useNativeDriver: false, friction: 7, tension: 40 }).start();
      }
    })
  ).current;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Gallery permission is required to select a photo.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true, 
      aspect: [3, 4],
      quality: 1, 
    });
    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
    }
  };

  // 🚀 AKILLI POLLING (SMART POLLING) MANTIĞI  -> Akıllıca client - server ilişkisini kontrol eder.
  const checkVtonResult = async (taskId: string, attempt: number = 1) => {
    // Toplam 5 deneme (3s + 6s + 9s + 12s + 15s = 45 saniye maksimum bekleme)
    if (attempt > 5) {
      alert("Timeout: The process is taking too long. Please try again later.");
      return;
    }

    const waitTime = attempt * 3000; // Her denemede süreyi katla (3000ms, 6000ms...)
    console.log(`[POLLING] Attempt ${attempt}: Waiting ${waitTime / 1000} seconds...`);

    setTimeout(async () => {
      try {
        // 🚀 DİKKAT: Bu endpoint'i Java tarafında oluşturacağız
        const response = await apiClient.get(`/vton/result/${taskId}`);
        
        if (response.data && response.data.status === 'COMPLETED') {
          // İŞLEM BİTTİ! Dönen AI görselini ekranda göster
          console.log("🔥 AI GİYDİRME BAŞARILI:", response.data.resultImageUrl);
          alert("Dress up completed!");
          // İleride burada setUserPhoto(response.data.resultImageUrl) tarzı bir şey yapacağız
        } else {
          // İşlem devam ediyorsa (PENDING), bir sonraki denemeye geç
          checkVtonResult(taskId, attempt + 1);
        }
      } catch (error) {
        console.error(`Polling attempt ${attempt} failed:`, error);
        // Ağ hatası olsa bile pes etme, devam et
        checkVtonResult(taskId, attempt + 1);
      }
    }, waitTime);
  };


    // 🚀 DRESS UP BUTONUNA BASILINCA ÇALIŞACAK FONKSİYON
    const handleDressUp = async () => {
    // 1. Gönderilecek paketi (VtonTaskRequest) hazırlıyoruz
    const requestPayload = {
      userId: CURRENT_USER_ID, // GLOBAL DEĞİŞKEN BURAYA BAĞLANDI
      personUrl: userPhoto, 
      garmentUrls: selectedItems.map(item => item.uri), 
      tuckedIn: false 
    };

    try {
          const response = await apiClient.post('/vton/async-try-on', requestPayload);

          if (response.status === 202) {
            // 1. Backend isteği kabul etti ve bir Tracking/Task ID döndü
            const taskId = response.data.taskId || response.data; // Java'nın dönüş modeline göre ayarlarız
            console.log("İşlem sıraya alındı. Task ID:", taskId);
            
            // 2. Akıllı Polling'i başlat (1. denemeden itibaren)
            checkVtonResult(taskId, 1); 
          } else {
            alert("Warning: Unexpected status code from server.");
          }

        } catch (error) {
          console.error("API Connection Error:", error);
          alert("Failed to connect to the backend.");
        }
      };

  return (
    <View style={styles.container}>
      
      <TouchableWithoutFeedback onPress={closeTray}>
        <View style={styles.topContentWrapper}>
          
          {/* 1. ANA KART */}
          <View style={styles.mainCard}>
            <TouchableOpacity style={styles.addPhotoButton} activeOpacity={0.7} onPress={pickImage}>
              <Feather name="camera" size={16} color="#111" />
              <Text style={styles.addPhotoText}>{userPhoto ? "change photo" : "add photo"}</Text>
            </TouchableOpacity>
            
            {userPhoto ? (
              <Image source={{ uri: userPhoto }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.silhouetteContainer}>
                <Image source={require('../../../assets/silhouetteWoman.png')} style={styles.silhouetteImage} />
                <Text style={styles.uploadText}>Upload a full-size photo of yourself</Text>
              </View>
            )}
          </View>

          {/* SEÇİLEN PARÇALAR BARI */}
          {selectedItems.length > 0 && (
            <View style={styles.selectedItemsBar}>
              <Text style={styles.selectionTitle}>Items to Try On ({selectedItems.length})</Text>
              <View style={styles.selectedItemsScroll}>
                {selectedItems.slice(0, 4).map((item, index) => (
                  <View key={index} style={styles.selectedItemBubble}>
                    <Image source={{ uri: item.uri }} style={styles.selectedItemImg} />
                  </View>
                ))}
                {selectedItems.length > 4 && (
                  <View style={[styles.selectedItemBubble, styles.moreBubble]}>
                    <Text style={styles.moreText}>+{selectedItems.length - 4}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* AKSİYON ÇUBUĞU */}
          <View style={styles.actionBar}>
            <View style={styles.leftActions}>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Feather name="bookmark" size={24} color="#111" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Feather name="send" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.dressUpButton, (!userPhoto || selectedItems.length === 0) && styles.dressUpButtonDisabled]} 
              activeOpacity={0.8}
              disabled={!userPhoto || selectedItems.length === 0}
              onPress={handleDressUp} // 🚀 APİ BAĞLANTISI BUTONA EKLENDİ
            >
              <Text style={[styles.dressUpText, (!userPhoto || selectedItems.length === 0) && styles.dressUpTextDisabled]}>
                Dress up
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </TouchableWithoutFeedback>

      {/* SÜRÜKLENEBİLİR TEPSİ */}
      <Animated.View style={[styles.trayWrapper, { height: TRAY_HEIGHT, transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.dragZone}>
          <View style={styles.bronzeHandleBar} />
        </View>

        <View style={styles.trayInnerContent}>
          <ARItemSelectorTray 
          allWardrobe={allWardrobe} 
          allOutfits={allOutfits}
          setSelectedItems={setSelectedItems} />
        </View>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7', alignItems: 'center' },
  topContentWrapper: { flex: 1, width: '100%', alignItems: 'center', paddingBottom: 110, justifyContent: 'space-evenly' },
  mainCard: { width: width * 0.90, height: height * 0.42, backgroundColor: '#FFFFFF', borderRadius: 30, padding: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  addPhotoButton: { position: 'absolute', top: 9, right: 5, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, zIndex: 10, gap: 6 },
  addPhotoText: { fontSize: 13, fontWeight: '600', color: '#111' },
  silhouetteContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  silhouetteImage: { width: 180, height: 230, resizeMode: 'contain', opacity: 0.85 },
  uploadText: { fontSize: 14, color: '#888', fontWeight: '500', marginTop: 10, textAlign: 'center' },
  uploadedImage: { width: '100%', height: '100%', borderRadius: 30, resizeMode: 'cover' },
  selectedItemsBar: { width: width * 0.9, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#EBE8DF' },
  selectionTitle: { fontSize: 12, fontWeight: '700', color: '#111', marginBottom: 8, opacity: 0.6 },
  selectedItemsScroll: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  selectedItemBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EBE8DF', padding: 2 },
  selectedItemImg: { width: '100%', height: '100%', borderRadius: 18 },
  moreBubble: { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  moreText: { fontSize: 14, fontWeight: '700', color: '#666' },
  actionBar: { width: width * 0.9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftActions: { flexDirection: 'row', gap: 12 },
  iconButton: { width: 44, height: 44, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  dressUpButton: { backgroundColor: '#CCFF00', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, shadowColor: '#CCFF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  dressUpButtonDisabled: { backgroundColor: '#EBE8DF', shadowOpacity: 0 },
  dressUpText: { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: 0.5 },
  dressUpTextDisabled: { color: '#999' },
  trayWrapper: { position: 'absolute', bottom: 0, left: 0, width: width, backgroundColor: '#EFEFE5', borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20, zIndex: 999 },
  dragZone: { width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  bronzeHandleBar: { backgroundColor: '#D4AF37', width: 60, height: 6, borderRadius: 3, opacity: 0.8 },
  trayInnerContent: { flex: 1 }
});