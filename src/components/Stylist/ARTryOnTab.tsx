import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, PanResponder, TouchableWithoutFeedback, ActivityIndicator, Vibration,Modal } from 'react-native'; // 🚀 Vibration ve ActivityIndicator eklendi!
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications'; 
import ARItemSelectorTray from './ARItemSelectorTray'; 
import { apiClient } from '../../api/client'; 
import PremiumToast from '../PremiumToast';
import { BlurView } from 'expo-blur';

// 2. BİLDİRİM DAVRANIŞINI AYARLA (Uygulama açıkken de yukarıdan düşmesini sağlar)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // 🚀 Eskiden shouldShowAlert idi, artık Banner kullanıyoruz
    shouldShowList: true,   // 🚀 Bildirim merkezinde (geçmişte) görünsün
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width, height } = Dimensions.get('window');
const CURRENT_USER_ID = "1";

interface ARTryOnTabProps {
  allWardrobe: any[];
  allOutfits?: any[];  // Kombinlerin gelmesi için prop eklendi
}


export default function ARTryOnTab({ allWardrobe, allOutfits = [] }: ARTryOnTabProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]); 

  // 🚀 YENİ: Premium Yükleme Barı State'leri
  const [bannerStatus, setBannerStatus] = useState<'hidden' | 'loading' | 'success'>('hidden');
  const progressAnim = useRef(new Animated.Value(0)).current; // Çubuğun doluluk oranı (0'dan 100'e)

  const [toastVisible, setToastVisible] = useState(false);

  // 🚀 YENİ: Tam Ekran Görsel Önizleme State'i
  const [previewVisible, setPreviewVisible] = useState(false);

  // 3 KADEMELİ TEPSİ MATEMATİĞİ
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
      mediaTypes: ['images'], 
      allowsEditing: true, 
      aspect: [3, 4],
      quality: 1, 
    });
    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
    }
  }

  // 🚀 AKILLI POLLING (SMART POLLING) MANTIĞI  -> Akıllıca client - server ilişkisini kontrol eder.
  const checkVtonResult = async (taskId: string, attempt: number = 1) => {
    if (attempt > 10) {
      setBannerStatus('hidden'); 
      alert("Timeout: The process is taking too long. Please try again later.");
      return;
    }

    const waitTime = attempt * 3000;  // Her denemede süreyi katla (3000ms, 6000ms...)
    console.log(`[POLLING] Attempt ${attempt}: Waiting ${waitTime / 1000} seconds...`);

    setTimeout(async () => {
      try {
        const response = await apiClient.get(`/vton/result/${taskId}`);
        
        if (response.data && response.data.status === 'COMPLETED') {
          // İŞLEM BİTTİ! Dönen AI görselini ekranda göster
          console.log("🔥 AI GİYDİRME BAŞARILI:", response.data.resultImageUrl);

            // 🚀 1. Çubuğu hızla %100'e tamamla
            Animated.timing(progressAnim, {
              toValue: 100,
              duration: 300,
              useNativeDriver: false,
            }).start(async () => { // 🚀 async ekledik ki bildirim bekleyebilsin
              // 🚀 2. Yazıyı "Tamamlandı" yap ve fotoğrafı güncelle
              setBannerStatus('success');
              setUserPhoto(response.data.resultImageUrl);
              
              // 🚀 3. ÇİFT TİTREŞİM (Garanti çalışır, emülatör hariç)
              Vibration.vibrate([0, 200, 100, 200]); 

                // 🚀 İŞTE O MEŞHUR BİLDİRİM (Kullanıcı başka sekmedeyse yukarıdan düşer)
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "👗 Vestify",
                  body: "Yeni tarzını görmek için tıkla ✨",
                  data: { 
                    screen: 'ItemDetail', // Hedef ekran
                    imageUrl: response.data.resultImageUrl, // Gösterilecek AI görseli
                    isAiResult: true 
                  },
                  sound: true,
                },
                trigger: null, // null demek anında göster demektir
              });

              // 🚀 4. Kullanıcı görsün diye 2.5 saniye bekle, sonra paneli gizle
              setTimeout(() => {
                setBannerStatus('hidden');
              }, 2500);
            });

          } else {
            checkVtonResult(taskId, attempt + 1);
          }
        } catch (error) {
          checkVtonResult(taskId, attempt + 1);
        }
      }, waitTime);
    };


    // 🚀 DRESS UP BUTONUNA BASILINCA ÇALIŞACAK FONKSİYON
const handleDressUp = async () => {
        setBannerStatus('loading');
        progressAnim.setValue(0);
        Animated.timing(progressAnim, { toValue: 90, duration: 12000, useNativeDriver: false }).start();
        
        try {
            // 🚀 AŞAMA 1: KULLANICININ FOTOĞRAFINI CLOUDINARY'E YÜKLE
            console.log("1. Aşama: Kullanıcı fotoğrafı Cloudinary'ye yükleniyor...");
            
            const formData = new FormData();
            formData.append('image', {
                uri: userPhoto,
                name: 'person_tryon.jpg',
                type: 'image/jpeg'
            } as any);

            const uploadResponse = await apiClient.post('/vton/upload-person', formData, {
                headers: { 
                  'Content-Type': 'multipart/form-data',
                  'Accept': 'application/json' 
                }
            });

            const publicPersonUrl = uploadResponse.data.url;
            console.log("✅ Fotoğraf yüklendi! URL:", publicPersonUrl);

            // 🚀 AŞAMA 2: JSON PAKETİNİ HAZIRLA VE FAL.AI (RABBITMQ) KUYRUĞUNA AT
            // Kıyafetler zaten Wardrobe'dan Cloudinary linki (imageUrl) olarak geliyor!
            // 🚀 DÜZELTME 2: imageUrl yoksa uri'ye bak, o da yoksa url'ye bak! Güvence altına aldık.
            const garmentUrls = selectedItems.map(item => item.imageUrl || item.uri || item.url);

            const requestPayload = {
                userId: CURRENT_USER_ID, 
                personUrl: publicPersonUrl,     // Az önce Cloudinary'den aldığımız gerçek link!
                garmentUrls: garmentUrls,       // Wardrobe'daki gerçek kıyafet linkleri!
                tuckedIn: false 
            };

            console.log("2. Aşama: VTON İşlemi kuyruğa gönderiliyor...", requestPayload);
            const response = await apiClient.post('/vton/async-try-on', requestPayload);

            if (response.status === 202 || response.status === 200) {
                const taskId = response.data.taskId;
                // 🚀 Akıllı Polling'i Başlat
                checkVtonResult(taskId, 1);
            }
            
        } catch (error) {
            console.error("🚨 VTON Başlatma Hatası:", error);
            setBannerStatus('error');
            alert("İşlem başlatılamadı. Lütfen internet bağlantınızı kontrol edin.");
        }
    };

  return (
    <View style={styles.container}>

      {/* 🚀 YENİ TASARIM: Üstte süzülen, dolan yeşil çubuklu panel */}
      {bannerStatus !== 'hidden' && (
        <View style={styles.uploadingBanner}>
          <Text style={styles.uploadingText}>
            {bannerStatus === 'loading' ? 'Uploading items ⏳' : 'Dress up completed! ✨'}
          </Text>
          
          <View style={styles.progressBarBackground}>
            <Animated.View style={[
              styles.progressBarFill, 
              { 
                width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                backgroundColor: bannerStatus === 'success' ? '#84CC16' : '#A3E635' // Başarılı olunca renk koyulaşır
              }
            ]} />
          </View>
        </View>
      )}

      {/* BAŞARILI BİLDİRİMİ */}
      <PremiumToast 
         visible={toastVisible} 
         message="Dress up perfectly applied!" 
         onHide={() => setToastVisible(false)} 
      />

      {/* 🚀 YENİ: Tam Ekran Görsel Önizleme Modalı (UX Finali) */}
      <Modal visible={previewVisible} transparent animationType="fade">
          <BlurView intensity={20} tint="dark" style={styles.previewOverlay}>
              <TouchableWithoutFeedback onPress={() => setPreviewVisible(false)}>
                  <View style={styles.previewContainer}>
                      
                      {/* 1. Kapatma Butonu (X) */}
                      <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewVisible(false)}>
                          <Feather name="x" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                      
                      {/* 2. Tam Ekran Görsel (Premium Hissiyat) */}
                      {/* 🚀 userPhoto null ise boş string yolla ki TypeScript hata vermesin */}
                      <Image source={{ uri: userPhoto || '' }} style={styles.previewImage} />
                      
                      {/* 3. Aksiyon Çubuğu (Kaydet ve Paylaş) */}
                      <View style={styles.previewActionBar}>
                          <TouchableOpacity style={styles.previewIconBtn} onPress={() => alert("Save function placeholder")}>
                              <Feather name="bookmark" size={22} color="#FFFFFF" />
                              <Text style={styles.previewBtnText}>Kaydet</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity style={styles.previewIconBtn} onPress={() => alert("Share function placeholder")}>
                              <Feather name="share-2" size={22} color="#FFFFFF" />
                              <Text style={styles.previewBtnText}>Paylaş</Text>
                          </TouchableOpacity>
                      </View>
                      
                  </View>
              </TouchableWithoutFeedback>
          </BlurView>
      </Modal>

      {/* 🚀 MODAL SONU */}


      <TouchableWithoutFeedback onPress={closeTray}>
        <View style={styles.topContentWrapper}>
          
          {/* ANA KART  -> İÇİNDEKİ FOTOĞRAFA TIKLAMA ÖZELLİĞİ EKLENDİ*/}
          <View style={styles.mainCard}>
            <TouchableOpacity style={styles.addPhotoButton} activeOpacity={0.7} onPress={pickImage}>
              <Feather name="camera" size={16} color="#111" />
              <Text style={styles.addPhotoText}>{userPhoto ? "change photo" : "add photo"}</Text>
            </TouchableOpacity>
            
            {userPhoto ? (
              // 🚀 GÖRSELE TIKLAYINCA ÖNİZLEMEYİ AÇ
              <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewVisible(true)} style={{ flex: 1 }}>
                  <Image source={{ uri: userPhoto }} style={styles.uploadedImage} />
              </TouchableOpacity>
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
              style={[styles.dressUpButton, (!userPhoto || selectedItems.length === 0 || bannerStatus === 'loading') && styles.dressUpButtonDisabled]} 
              activeOpacity={0.8}
              disabled={!userPhoto || selectedItems.length === 0 || bannerStatus === 'loading'}
              onPress={handleDressUp}  // 🚀 APİ BAĞLANTISI BUTONA EKLENDİ
            >
              <Text style={[styles.dressUpText, (!userPhoto || selectedItems.length === 0 || bannerStatus === 'loading') && styles.dressUpTextDisabled]}>
                {bannerStatus === 'loading' ? "Processing..." : "Dress up"}
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
  trayInnerContent: { flex: 1 },

// 🚀 UPLOADING BANNER STİLLERİ
  uploadingBanner: {
    position: 'absolute',
    top: 20, 
    width: width * 0.85,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // 🚀 YENİ EKLENEN STİLLER (Görsel Önizleme UX)
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // Hafif bir karartma + Blur
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: width * 0.9,
    height: height * 0.75, // Ekranın çoğunu kaplar
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 0, 
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%', 
    borderRadius: 30,
    resizeMode: 'contain', // Görselin tam halini koru
  },
  previewActionBar: {
    position: 'absolute',
    bottom: 20, // Görselin hemen altına iner
    flexDirection: 'row',
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  previewIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});