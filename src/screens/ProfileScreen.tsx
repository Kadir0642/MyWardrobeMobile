import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker'; // 🚀 Galeri için eklendi
import VestifyLogo from '../components/VestifyLogo';
import { useProfile } from '../context/ProfileContext';

const { width } = Dimensions.get('window');

const MENU_ITEMS = [
  { id: 'membership', title: 'VESTIFY MEMBERSHIP', sub: 'Unlock premium features and exclusive access', icon: 'VestifyLogo' },
  { id: 'closet', title: 'OPEN CLOSET', sub: 'Manage your public wardrobe profile', icon: 'door-open' },
  { id: 'analytics', title: 'WARDROBE ANALYTICS', sub: 'Know your wardrobe composition, usage and investment', icon: 'chart-bar' },
  { id: 'hub', title: 'STYLE HUB', sub: 'Everything you need to refine your style', icon: 'gem' },
  { id: 'catalog', title: 'THE CATALOG', sub: 'Get a digital wardrobe without lifting a finger', icon: 'folder-open' },
  { id: 'referral', title: 'REFERRAL', sub: 'Invite your friends and earn Vestify credit', icon: 'user-friends' },
  { id: 'shop', title: 'SHOPPING', sub: 'Discover the new items for wardrobe', icon: 'shopping-bag' },
  { id: 'gift', title: 'THE GIFT CREDIT', sub: 'Send style to your loved ones', icon: 'gift' },
  { id: 'contact', title: 'CONTACT US', sub: 'Have a question? We are here for you', icon: 'envelope' }
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  
  // Artık veriyi merkezden çekiyor
  const { profileImage, setProfileImage } = useProfile();
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // 📸 GALERİDEN FOTOĞRAF SEÇME FONKSİYONU
  const pickImage = async (type: 'profile' | 'cover') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      // Profil diktörtgen (3:4), Kapak ise geniş manzara (16:9) oranında kesilsin
      aspect: type === 'profile' ? [3, 4] : [16, 9], 
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'profile') {
        setProfileImage(result.assets[0].uri);
      } else {
        setCoverImage(result.assets[0].uri);
      }
    }
  };

return (
    <View style={styles.container}>
      
      {/* ScrollView ekranı kaplıyor */}
      <ScrollView showsVerticalScrollIndicator={false} bounces={true} style={styles.scrollView}>
        
        {/* 1. DİNAMİK KAPAK FOTOĞRAFI ALANI (Fixed Flow) */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => pickImage('cover')} 
          style={styles.coverContainer} // 🚀 DÜZELTME: paddingTop buradan kaldırıldı!
        >
          {coverImage ? (
            // Resim seçildiyse, tüm alanı (320px) Status Bar altına kadar kaplar!
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            // 🚀 DÜZELTME: paddingTop SADECE placeholder içeriğine uygulandı!
            // Böylece yazı ve ikon saatin altında kalmaz, ama mavi arka plan ful kaplar.
            <View style={[styles.coverPlaceholder, { paddingTop: insets.top }]}>
              <Feather name="image" size={32} color="#FFFFFF" opacity={0.7} />
              <Text style={styles.coverText}>Add Cover Photo</Text>
            </View>
          )}
          <View style={styles.coverOverlay} />
        </TouchableOpacity>

        {/* 2. BEYAZ PROFİL KARTI */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            
            <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage('profile')}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <>
                  <Text style={styles.imagePlaceholderText}>CHOOSE</Text>
                  <Text style={styles.imagePlaceholderText}>IMAGE</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.userInfoBox}>
              <Text style={styles.userName}>Jane</Text>
              <Text style={styles.userHandle}>@jane064219</Text>

              <View style={styles.socialRow}>
                <TouchableOpacity><FontAwesome5 name="pinterest-p" size={18} color="#1A1A1A" /></TouchableOpacity>
                <TouchableOpacity><FontAwesome5 name="instagram" size={18} color="#1A1A1A" /></TouchableOpacity>
                <TouchableOpacity><FontAwesome5 name="tiktok" size={18} color="#1A1A1A" /></TouchableOpacity>
                <TouchableOpacity><FontAwesome5 name="youtube" size={18} color="#1A1A1A" /></TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.settingsButton}>
              <Feather name="settings" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.tagsRow}>
            {['Relaxed', 'Street', 'Elegant'].map((tag, index) => (
              <View key={index} style={styles.styleTag}>
                <Text style={styles.styleTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. KREM RENGİ LİSTE MENÜSÜ */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuIconBox}>
                {item.icon === 'VestifyLogo' ? (
                  <VestifyLogo size={36} color="#1A1A1A" />
                ) : (
                  <FontAwesome5 name={item.icon} size={22} color="#1A1A1A" />
                )}
              </View>
              <View style={styles.menuTexts}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={{ height: 120, backgroundColor: '#F5F2EB' }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2EB' },
  
// 🚀 KAPAK FOTOĞRAFI STİLLERİ (Güncellendi)
  coverContainer: {
    width: '100%', 
    height: 320, 
    backgroundColor: '#5A8DEE', 
    justifyContent: 'center', alignItems: 'center'
    // position: 'absolute' SİLİNDİ! Artık akışın içinde.
  },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverText: { color: '#FFFFFF', marginTop: 10, fontSize: 14, fontWeight: '600', opacity: 0.8, letterSpacing: 1 },
  coverOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, // Gölgeyi biraz uzattık
    backgroundColor: 'rgba(0,0,0,0.15)' 
  },
  
  scrollView: { flex: 1 },

// Beyaz Profil Kartı (Güncellendi)
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginTop: -100, // 🚀 YENİ: Eksi margin ile kapağın üzerine biniyor!
    borderTopLeftRadius: 35, borderTopRightRadius: 35,
    paddingHorizontal: 20, paddingTop: 25, paddingBottom: 25,
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  
  // 🚀 PROFİL FOTOĞRAFI STİLLERİ
  imagePlaceholder: {
    width: 90, height: 120, borderRadius: 15,
    borderWidth: 2, borderColor: '#1A1A1A',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FAFAFA',
    overflow: 'hidden' // Resim köşelerden taşmasın diye
  },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholderText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },

  userInfoBox: { flex: 1, marginLeft: 15, paddingTop: 10 },
  userName: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  userHandle: { fontSize: 14, color: '#888', marginTop: 2 },
  
  socialRow: { flexDirection: 'row', gap: 15, marginTop: 15 },
  settingsButton: { padding: 5 },

  tagsRow: { flexDirection: 'row', gap: 10, marginTop: 25, justifyContent: 'center' },
  styleTag: { 
    paddingVertical: 8, paddingHorizontal: 16, 
    borderRadius: 20, borderWidth: 1.5, borderColor: '#ADD8E6', 
    backgroundColor: '#FFFFFF' 
  },
  styleTagText: { fontSize: 13, fontWeight: '700', fontStyle: 'italic', color: '#1A1A1A' },

  menuContainer: { backgroundColor: '#F5F2EB', paddingTop: 10 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#E6E2D8' 
  },
  menuIconBox: { width: 50, alignItems: 'center', justifyContent: 'center' },
  menuTexts: { flex: 1, marginLeft: 15 },
  menuTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 1, color: '#1A1A1A' },
  menuSub: { fontSize: 12, color: '#666', marginTop: 4, paddingRight: 20 },
});