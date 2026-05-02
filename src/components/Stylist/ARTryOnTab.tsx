import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, PanResponder, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ARItemSelectorTray from './ARItemSelectorTray'; 

const { width, height } = Dimensions.get('window');

interface ARTryOnTabProps {
  allWardrobe: any[];
}

export default function ARTryOnTab({ allWardrobe }: ARTryOnTabProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]); 

  // 🚀 3 KADEMELİ TEPSİ MATEMATİĞİ (GÜNCELLENDİ VE GARANTİLENDİ)
  const TRAY_HEIGHT = height * 0.85; // Tepsinin tam boyu (Ekranın %85'i)
  const PEEK_Y = TRAY_HEIGHT - 90;   // KAPALI HALİ (Sadece 90px'lik sapı görünür, gerisi aşağı itilir)
  const MID_Y = TRAY_HEIGHT * 0.4;   // YARIM AÇIK HALİ
  const TOP_Y = 0;                   // TAM AÇIK HALİ

  // Başlangıçta kapalı konumda başlasın
  const translateY = useRef(new Animated.Value(PEEK_Y)).current;

  // Boşluğa tıklayınca tepsiyi PEEK (kapalı) konumuna gönderen fonksiyon
  const closeTray = () => {
    Animated.spring(translateY, { toValue: PEEK_Y, useNativeDriver: false, friction: 7, tension: 40 }).start();
  };

  // 🚀 SÜRÜKLEME VE YAPIŞTIRMA (SNAP) MEKANİZMASI
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Tepsiyi parmakla hareket ettir
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const currentY = (translateY as any)._value;
        const vy = gestureState.vy; 

        let targetY = PEEK_Y;

        // Yukarı hızlı kaydırıldıysa (vy eksidir)
        if (vy < -0.5) {
          targetY = currentY < MID_Y ? TOP_Y : MID_Y;
        } 
        // Aşağı hızlı kaydırıldıysa (vy artıdır)
        else if (vy > 0.5) {
          targetY = currentY > MID_Y ? PEEK_Y : MID_Y;
        } 
        // Yavaş bırakıldıysa en yakın konuma yapıştır
        else {
          const distToTop = Math.abs(currentY - TOP_Y);
          const distToMid = Math.abs(currentY - MID_Y);
          const distToPeek = Math.abs(currentY - PEEK_Y);

          if (distToTop < distToMid && distToTop < distToPeek) targetY = TOP_Y;
          else if (distToMid < distToTop && distToMid < distToPeek) targetY = MID_Y;
          else targetY = PEEK_Y;
        }

        // Tepsinin sınır dışına çıkmasını engelle
        targetY = Math.max(TOP_Y, Math.min(PEEK_Y, targetY));

        Animated.spring(translateY, { toValue: targetY, useNativeDriver: false, friction: 7, tension: 40 }).start();
      }
    })
  ).current;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Fotoğraf seçebilmek için galeri erişim izni vermeniz gerekiyor.");
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

  return (
    <View style={styles.container}>
      
      {/* 🚀 BOŞLUĞA TIKLAYINCA TEPSİYİ KAPATAN GÖRÜNMEZ SARICI */}
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
              <Text style={styles.selectionTitle}>Giydirilecek Parçalar ({selectedItems.length})</Text>
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
            >
              <Text style={[styles.dressUpText, (!userPhoto || selectedItems.length === 0) && styles.dressUpTextDisabled]}>
                Dress up
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </TouchableWithoutFeedback>

      {/* 🚀 SÜRÜKLENEBİLİR 3 KADEMELİ TEPSİ */}
      <Animated.View style={[styles.trayWrapper, { height: TRAY_HEIGHT, transform: [{ translateY }] }]}>
        
        {/* TUTMA ÇUBUĞU ALANI (Sadece buradan tutulup sürüklenir) */}
        <View {...panResponder.panHandlers} style={styles.dragZone}>
          <View style={styles.bronzeHandleBar} />
        </View>

        {/* TEPSİ İÇERİĞİ */}
        <View style={styles.trayInnerContent}>
          <ARItemSelectorTray allWardrobe={allWardrobe} setSelectedItems={setSelectedItems} />
        </View>

      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7', alignItems: 'center' },
  
  topContentWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 110, // Tepsinin kapalı halinin butonları gizlememesi için
    justifyContent: 'space-evenly', 
  },

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
  
  // DRESS UP BUTONU
  dressUpButton: { backgroundColor: '#CCFF00', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, shadowColor: '#CCFF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  dressUpButtonDisabled: { backgroundColor: '#EBE8DF', shadowOpacity: 0 },
  dressUpText: { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: 0.5 },
  dressUpTextDisabled: { color: '#999' },

  // 🚀 TEPSİ STİLLERİ (KESİN GÖRÜNÜR)
  trayWrapper: { 
    position: 'absolute', 
    bottom: 0, // 👈 Alta çivilendi!
    left: 0,
    width: width, 
    backgroundColor: '#EFEFE5', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
    zIndex: 999 // 👈 Asla altta kalmaz
  },
  dragZone: { width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  bronzeHandleBar: { backgroundColor: '#D4AF37', width: 60, height: 6, borderRadius: 3, opacity: 0.8 },
  trayInnerContent: { flex: 1 }
});