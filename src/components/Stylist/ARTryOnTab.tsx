import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, PanResponder, TouchableWithoutFeedback, Vibration, Modal, ScrollView } from 'react-native'; 
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications'; 
import ARItemSelectorTray from './ARItemSelectorTray'; 
import { apiClient } from '../../api/client'; 
import PremiumToast from '../PremiumToast';
import { BlurView } from 'expo-blur';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width, height } = Dimensions.get('window');
const CURRENT_USER_ID = "1";

// 🚀 VTON MODELİNİN DESTEKLEDİĞİ KATEGORİLER
const SUPPORTED_CATEGORIES = ['TOPS', 'BOTTOMS', 'OUTERWEAR', 'FULL BODY'];

type ARTryOnRouteParams = {
  preselectedClothes?: any[];
};

interface ARTryOnTabProps {
  allWardrobe: any[];
  allOutfits?: any[]; 
  route?: { params?: ARTryOnRouteParams }; 
}

export default function ARTryOnTab({ allWardrobe, allOutfits = [], route }: ARTryOnTabProps) {

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]); 
  const [aiGeneratedUrl, setAiGeneratedUrl] = useState<string | null>(null);

  const [bannerStatus, setBannerStatus] = useState<'hidden' | 'loading' | 'success' | 'error'>('hidden');
  const progressAnim = useRef(new Animated.Value(0)).current; 
  const [toastVisible, setToastVisible] = useState(false);
  
  const [photoGuideVisible, setPhotoGuideVisible] = useState(false); 
  const [previewVisible, setPreviewVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    const preselected = route?.params?.preselectedClothes;
    
    if (preselected && Array.isArray(preselected) && preselected.length > 0) {
      console.log(`👗 Kombinden ${preselected.length} parça geldi, desteklenenler filtreleniyor...`);
      
      const validItems = preselected.filter(item => 
        item.category && SUPPORTED_CATEGORIES.includes(item.category.toUpperCase())
      );
      
      setSelectedItems(validItems);
      if (validItems.length > 0) Vibration.vibrate(100); 
    }
  }, [route?.params?.preselectedClothes]); 

  const handleRemoveItem = (idToRemove: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== idToRemove));
    if (selectedItems.length === 1) setCartVisible(false); 
  };

  const handleSaveToPortfolio = async () => {
      if (!userPhoto || selectedItems.length === 0) return;

      try {
          const requestPayload = {
              userId: CURRENT_USER_ID,
              name: "My AR Look " + new Date().toLocaleDateString(), 
              outfitImageUrl: aiGeneratedUrl || userPhoto,  
              clothingItemIds: selectedItems.map(item => item.id) 
          };

          const response = await apiClient.post('/outfits/save-ar-look', requestPayload);
          
          if(response.status === 200 || response.status === 201) {
              setToastVisible(true); 
              setPreviewVisible(false); 
          }
      } catch (error) {
          alert("Kaydedilirken bir hata oluştu.");
          console.error("Save Look Error:", error);
      }
    };

  const TRAY_HEIGHT = height * 0.85; 
  const PEEK_Y = TRAY_HEIGHT - 90;   
  const MID_Y = TRAY_HEIGHT * 0.4;   
  const TOP_Y = 0;                   

  const translateY = useRef(new Animated.Value(PEEK_Y)).current;

  const closeTray = () => {
    Animated.spring(translateY, { toValue: PEEK_Y, useNativeDriver: false, friction: 7, tension: 40 }).start();
  };

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

        if (vy < -0.5) targetY = currentY < MID_Y ? TOP_Y : MID_Y;
        else if (vy > 0.5) targetY = currentY > MID_Y ? PEEK_Y : MID_Y;
        else {
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

  const openPhotoGuide = () => {
    setPhotoGuideVisible(true);
  };

  const pickImage = async () => {
    setPhotoGuideVisible(false); 

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

  const checkVtonResult = async (taskId: string, attempt: number = 1, personCloudinaryUrl: string) => {
    if (attempt > 20) {
      setBannerStatus('hidden'); 
      alert("Timeout: The process is taking too long. Please try again later.");
      return;
    }

    const waitTime = attempt * 3000;  
    console.log(`[POLLING] Attempt ${attempt}: Waiting ${waitTime / 1000} seconds...`);

    setTimeout(async () => {
      try {
        const response = await apiClient.get(`/vton/result/${taskId}`);
        
        if (response.data && response.data.status === 'COMPLETED') {
          console.log("🔥 AI GİYDİRME BAŞARILI:", response.data.resultImageUrl);

          if (response.data.resultImageUrl === 'HATA') {
             setBannerStatus('hidden');
             alert("Giydirme işlemi yapılamadı. Lütfen kollarınızın açık olduğu ve üzerinizde kalın kıyafetlerin olmadığı daha net bir fotoğraf seçin.");
             if (personCloudinaryUrl) {
                 apiClient.delete(`/vton/cleanup-image?imageUrl=${encodeURIComponent(personCloudinaryUrl)}`).catch(()=>console.log("Hata silmesi atlandı"));
             }
             return; 
          }

          let optimizedUrl = response.data.resultImageUrl;
          if (optimizedUrl.includes('cloudinary.com')) {
              optimizedUrl = optimizedUrl.replace('/upload/', '/upload/f_webp,q_auto/');
          }

            Animated.timing(progressAnim, {
              toValue: 100,
              duration: 300,
              useNativeDriver: false,
            }).start(async () => { 
              setBannerStatus('success');
              setUserPhoto(optimizedUrl);
              setAiGeneratedUrl(optimizedUrl);
              Vibration.vibrate([0, 200, 100, 200]); 

              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "👗 Vestify",
                  body: "Yeni tarzını görmek için tıkla ✨",
                  data: { screen: 'ItemDetail', imageUrl: optimizedUrl, isAiResult: true },
                  sound: true,
                },
                trigger: null, 
              });

            try {
                if (personCloudinaryUrl) {
                    await apiClient.delete(`/vton/cleanup-image?imageUrl=${encodeURIComponent(personCloudinaryUrl)}`);
                }
            } catch (err) {}

              setTimeout(() => setBannerStatus('hidden'), 2500);
            });

          } else {
            checkVtonResult(taskId, attempt + 1, personCloudinaryUrl);
          }
        } catch (error) {
          checkVtonResult(taskId, attempt + 1, personCloudinaryUrl);
        }
      }, waitTime);
    };

const handleDressUp = async () => {
        setBannerStatus('loading');
        progressAnim.setValue(0);
        Animated.timing(progressAnim, { toValue: 90, duration: 12000, useNativeDriver: false }).start();
        
        try {
            const formData = new FormData();
            formData.append('image', { uri: userPhoto, name: 'person_tryon.jpg', type: 'image/jpeg' } as any);

            const uploadResponse = await apiClient.post('/vton/upload-person', formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
            });

            const publicPersonUrl = uploadResponse.data.url;

            const garmentsPayload=selectedItems.map(item=>({
              url: item.imageUrl || item.uri || item.url,
              category: item.category ? item.category.toUpperCase() : 'TOPS' 
            }));

            const requestPayload = {
                userId: CURRENT_USER_ID, 
                personUrl: publicPersonUrl,     
                garments: garmentsPayload,       
                tuckedIn: false 
            };

            console.log("🚀 BACKEND'E GİDEN VERİ:", JSON.stringify(garmentsPayload, null, 2)); // DATA tracing

            const response = await apiClient.post('/vton/async-try-on', requestPayload);

            if (response.status === 202 || response.status === 200) {
                const taskId = response.data.taskId;
                checkVtonResult(taskId, 1, publicPersonUrl);
            }
            
        } catch (error: any) {
            setBannerStatus('error');
            console.error("DressUp API hatası:", error.response?.data || error.message);
            alert("İşlem başlatılamadı. Sunucuya ulaşılamıyor veya veri uyumsuzluğu var.");
        }
    };

  return (
    <View style={styles.container}>

      {bannerStatus !== 'hidden' && (
        <View style={styles.uploadingBanner}>
          <Text style={styles.uploadingText}>
            {bannerStatus === 'loading' ? 'Uploading items ⏳' : 'Dress up completed! ✨'}
          </Text>
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: bannerStatus === 'success' ? '#84CC16' : '#A3E635' }]} />
          </View>
        </View>
      )}

      <PremiumToast visible={toastVisible} message="Dress up perfectly applied!" onHide={() => setToastVisible(false)} />

      {/* 🚀 TAM EKRAN GÖRSEL ÖNİZLEME MODALI */}
      <Modal visible={previewVisible} transparent animationType="fade">
          <BlurView intensity={20} tint="dark" style={styles.previewOverlay}>
              <TouchableWithoutFeedback onPress={() => setPreviewVisible(false)}>
                  <View style={styles.previewContainer}>
                      <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewVisible(false)}>
                          <Feather name="x" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Image source={{ uri: userPhoto || '' }} style={styles.previewImage} />
                      
                      <View style={styles.previewActionBar}>
                          <TouchableOpacity style={styles.previewIconBtn} onPress={handleSaveToPortfolio}>
                              <Feather name="bookmark" size={22} color="#FFFFFF" />
                              <Text style={styles.previewBtnText}>Portfolyoya Ekle</Text>
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

      {/* 🚀 BİLGİ KILAVUZU MODALI (BETA UYARISI) */}
      <Modal visible={infoVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoIconCircle}>
              <Feather name="info" size={32} color="#D4AF37" />
            </View>
            <Text style={styles.infoTitle}>Virtual Try-On Beta</Text>
            <Text style={styles.infoText}>
              Currently, our AI perfectly handles Tops, Bottoms, Outerwear, and Dresses. 
              {"\n\n"}
              Accessories, bags, and footwear are filtered out automatically to ensure the best results. Full support is coming soon!
            </Text>
            <TouchableOpacity style={styles.infoCloseBtn} onPress={() => setInfoVisible(false)}>
              <Text style={styles.infoCloseBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🚀 PREMIUM SEPET (MINI-CART) MODALI */}
      <Modal visible={cartVisible} transparent animationType="slide">
        <View style={styles.cartOverlay}>
          <View style={styles.cartContent}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Selected Items ({selectedItems.length})</Text>
              <TouchableOpacity onPress={() => setCartVisible(false)}>
                <Feather name="x" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {selectedItems.map((item, index) => (
                <View key={item.id || index} style={styles.cartItemRow}>
                  <Image source={{ uri: item.imageUrl || item.uri }} style={styles.cartItemImage} />
                  <View style={styles.cartItemDetails}>
                    <Text style={styles.cartItemCategory}>{item.category || 'ITEM'}</Text>
                    <Text style={styles.cartItemBrand}>{item.brand || 'VESTIFY'}</Text>
                  </View>
                  <TouchableOpacity style={styles.cartDeleteBtn} onPress={() => handleRemoveItem(item.id)}>
                    <Feather name="trash-2" size={20} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            <TouchableOpacity style={styles.cartConfirmBtn} onPress={() => setCartVisible(false)}>
              <Text style={styles.cartConfirmBtnText}>Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🚀 FOTOĞRAF KILAVUZU MODALI (Kusursuz AI için şart) */}
      <Modal visible={photoGuideVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoIconCircle}>
              <MaterialCommunityIcons name="camera-front-variant" size={32} color="#D4AF37" />
            </View>
            <Text style={styles.infoTitle}>Kusursuz Sonuç İçin</Text>
            <Text style={styles.infoText}>
              Yapay zekanın kıyafetleri üzerinize tam oturtabilmesi için lütfen şu kurallara uyan bir boy fotoğrafı seçin:
            </Text>
            <View style={{ width: '100%', marginBottom: 25, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Feather name="check-circle" size={20} color="#84CC16" />
                    <Text style={{ fontSize: 14, color: '#333', flex: 1 }}>Kollarınızın açıkta olduğu dar bir üst (Örn: Atlet/Tişört)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Feather name="check-circle" size={20} color="#84CC16" />
                    <Text style={{ fontSize: 14, color: '#333', flex: 1 }}>Hatlarınızı belli eden dar bir alt giyim (Örn: Tayt/Şort)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Feather name="x-circle" size={20} color="#FF4444" />
                    <Text style={{ fontSize: 14, color: '#333', flex: 1 }}>Kalın kazaklar, bol pantolonlar ve kabanlar giymeyin.</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.infoCloseBtn} onPress={pickImage}>
              <Text style={styles.infoCloseBtnText}>Anladım, Fotoğraf Seç</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setPhotoGuideVisible(false)}>
              <Text style={{ fontSize: 14, color: '#888', fontWeight: '600' }}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableWithoutFeedback onPress={closeTray}>
        <View style={styles.topContentWrapper}>
          
          <View style={styles.mainCard}>
            {/* 🚀 BUTON GÜNCELLENDİ */}
            <TouchableOpacity style={styles.addPhotoButton} activeOpacity={0.7} onPress={openPhotoGuide}>
              <Feather name="camera" size={16} color="#111" />
              <Text style={styles.addPhotoText}>{userPhoto ? "change photo" : "add photo"}</Text>
            </TouchableOpacity>
            
            {userPhoto ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewVisible(true)} style={{ flex: 1 }}>
                  <Image source={{ uri: userPhoto }} style={styles.uploadedImage} />
              </TouchableOpacity>
            ) : (
              
              <TouchableOpacity style={styles.silhouetteContainer} activeOpacity={0.8} onPress={openPhotoGuide}>
                <Image source={require('../../../assets/silhouetteWoman.png')} style={styles.silhouetteImage} />
                <Text style={styles.uploadText}>Upload a full-size photo of yourself</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedItems.length > 0 && (
            <TouchableOpacity style={styles.selectedItemsBar} activeOpacity={0.8} onPress={() => setCartVisible(true)}>
              <View style={styles.selectionTitleRow}>
                <Text style={styles.selectionTitle}>Items to Try On ({selectedItems.length})</Text>
                <TouchableOpacity onPress={() => setInfoVisible(true)} style={{ padding: 2 }}>
                  <Feather name="info" size={16} color="#888" />
                </TouchableOpacity>
              </View>

              <View style={styles.selectedItemsScroll}>
                {selectedItems.slice(0, 4).map((item, index) => (
                  <View key={index} style={styles.selectedItemBubble}>
                    <Image source={{ uri: item.imageUrl || item.uri }} style={styles.selectedItemImg} />
                  </View>
                ))}
                {selectedItems.length > 4 && (
                  <View style={[styles.selectedItemBubble, styles.moreBubble]}>
                    <Text style={styles.moreText}>+{selectedItems.length - 4}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}

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
              onPress={handleDressUp}  
            >
              <Text style={[styles.dressUpText, (!userPhoto || selectedItems.length === 0 || bannerStatus === 'loading') && styles.dressUpTextDisabled]}>
                {bannerStatus === 'loading' ? "Processing..." : "Dress up"}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </TouchableWithoutFeedback>

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
  selectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selectionTitle: { fontSize: 12, fontWeight: '700', color: '#111', opacity: 0.6 },
  selectedItemsScroll: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  selectedItemBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EBE8DF', padding: 2 },
  selectedItemImg: { width: '100%', height: '100%', borderRadius: 18, resizeMode: 'contain' },
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

  uploadingBanner: { position: 'absolute', top: 20, width: width * 0.85, alignSelf: 'center', backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, zIndex: 1000, borderWidth: 1, borderColor: '#F0F0F0', alignItems: 'center' },
  uploadingText: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  progressBarBackground: { width: '100%', height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  previewContainer: { width: width * 0.9, height: height * 0.75, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  previewCloseBtn: { position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 20, zIndex: 10 },
  previewImage: { width: '100%', height: '100%', borderRadius: 30, resizeMode: 'contain' },
  previewActionBar: { position: 'absolute', bottom: 20, flexDirection: 'row', gap: 15, backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30 },
  previewIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  infoModalContent: { width: width * 0.85, backgroundColor: '#FFF', borderRadius: 24, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  infoIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FAF8F5', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  infoCloseBtn: { backgroundColor: '#1A1A1A', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  infoCloseBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  cartOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  cartContent: { width: '100%', height: height * 0.55, backgroundColor: '#FAF9F4', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 15 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#EBE8DF' },
  cartTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#EBE8DF' },
  cartItemImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#FAFAFA', resizeMode: 'contain' },
  cartItemDetails: { flex: 1, marginLeft: 15 },
  cartItemCategory: { fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 0.5 },
  cartItemBrand: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  cartDeleteBtn: { padding: 10, backgroundColor: '#FFF5F5', borderRadius: 12 },
  cartConfirmBtn: { backgroundColor: '#1A1A1A', paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  cartConfirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }
});