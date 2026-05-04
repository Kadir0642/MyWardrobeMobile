import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../context/ProfileContext';

const { width } = Dimensions.get('window');

// 🌟 ADMIN/MOCK DATA: Faz 1 için sadece resmi hesap veya seçili kaliteli içerikler
const FEED_DATA = [
  {
    id: '1',
    username: 'linneaborgs',
    subtitle: 'suggested for you',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    postImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', // Mockup'a benzer şık bir kaban kombini
    likes: 165,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '2',
    username: 'antoniooo111',
    subtitle: 'suggested for you',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    postImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', // Sokak stili
    likes: 89,
    isLiked: true,
    isSaved: true,
  }
];

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const { profileImage } = useProfile();
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
  
  // Şimdilik ismi statik veriyoruz, ileride veritabanından gelecek
  const userName = "Jane"; 

  const [posts, setPosts] = useState(FEED_DATA);

  // Etkileşim Fonksiyonları
  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const toggleSave = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isSaved: !p.isSaved } : p));
  };

  // 📸 BİREYSEL GÖNDERİ KARTI TASARIMI
  const renderPost = ({ item }: { item: typeof FEED_DATA[0] }) => (
    <View style={styles.postContainer}>
      
      {/* GÖRSEL VE ÜST BİLGİLER */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.postImage }} style={styles.postImage} />
        
        {/* Yazıların okunması için üstten aşağı kararan gradient maske */}
        <LinearGradient 
          colors={['rgba(0,0,0,0.6)', 'transparent']} 
          style={styles.gradientMask}
        />

        <View style={styles.postHeaderOverlay}>
          <View style={styles.postHeaderLeft}>
            <Image source={{ uri: item.userAvatar }} style={styles.postAvatar} />
            <View>
              <Text style={styles.postUsername}>{item.username}</Text>
              <Text style={styles.postSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.followButton} onPress={() => alert('Following is a Phase 2 feature!')}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ALT ETKİLEŞİM ÇUBUĞU (Mockuptaki gibi resmin altında) */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.actionIcon}>
            <Feather name="bookmark" size={26} color={item.isSaved ? "#1A1A1A" : "#1A1A1A"} />
            {/* İçi dolu ikon için FontAwesome vs kullanılabilir, şimdilik Feather kullanıldı */}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => toggleLike(item.id)} style={[styles.actionIcon, { flexDirection: 'row', alignItems: 'center' }]}>
            <MaterialCommunityIcons 
              name={item.isLiked ? "heart" : "heart-outline"} 
              size={28} 
              color={item.isLiked ? "#FF3B30" : "#1A1A1A"} 
            />
            <Text style={styles.likesText}>{item.likes}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRight}>
          <TouchableOpacity style={styles.actionIcon} onPress={() => alert('Post reported to admins.')}>
            <Feather name="flag" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => alert('Share menu opened.')}>
            <Feather name="send" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 🚀 ÜST KİŞİSEL SELAMLAMA */}
      <View style={styles.greetingRow}>
        <Image source={{ uri: profileImage || defaultAvatar }} style={styles.myAvatar} />
        <View style={styles.greetingPill}>
          <Text style={styles.greetingText}>Hey, {userName} !</Text>
        </View>
      </View>

      {/* 🚀 ANA HEADER (Başlık ve 3'lü İkon Seti) */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.mainTitle}>Discover the VESTIFY</Text>
          <View style={styles.titleUnderline} />
        </View>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.topIconBtn} onPress={() => alert('Top 3 Trending Outfits!')}>
            <MaterialCommunityIcons name="fire" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIconBtn}>
            <Feather name="bell" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIconBtn}>
            <Feather name="search" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🚀 GÖNDERİ AKIŞI (FEED) */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, // Arka plan tamamen beyaz

  // SELAMLAMA KISMI
  greetingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  myAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEB', marginRight: 10 },
  greetingPill: { backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEB' },
  greetingText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  // BAŞLIK VE İKONLAR
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 20 },
  titleWrapper: { flexDirection: 'column' },
  mainTitle: { fontSize: 22, fontWeight: '800', color: '#2C3E50', letterSpacing: 0.5 },
  titleUnderline: { width: '100%', height: 3, backgroundColor: '#1A1A1A', marginTop: 4, borderRadius: 2 },
  
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topIconBtn: { padding: 4 },

  // GÖNDERİ (FEED) STİLLERİ
  feedContainer: { paddingHorizontal: 15, paddingBottom: 100 },
  postContainer: { marginBottom: 30 },
  
  imageWrapper: { width: '100%', aspectRatio: 3/4, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F0F0F0', position: 'relative' },
  postImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gradientMask: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },

  postHeaderOverlay: { position: 'absolute', top: 15, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#FFFFFF', marginRight: 10 },
  postUsername: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  postSubtitle: { fontSize: 12, fontWeight: '500', color: '#E0E0E0', marginTop: 2 },
  
  followButton: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.3)' },
  followButtonText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  // ETKİLEŞİM ÇUBUĞU
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, paddingHorizontal: 5 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  actionRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  actionIcon: { padding: 4 },
  likesText: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginLeft: 6 },
});