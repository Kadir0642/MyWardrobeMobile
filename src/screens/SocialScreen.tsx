import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 1. MOCK DATA (Şimdilik sahte verilerle topluluğu simüle ediyoruz)
// İleride Java'da "OutfitPost" adında bir tablo yapıp bunları oradan çekeceğiz.
const MOCK_POSTS = [
  {
    id: '1',
    user: { name: 'Melisa Gök', avatar: 'https://i.pravatar.cc/150?u=kadir' },
    outfitImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    likes: 342,
    caption: 'Bahar ayları için favori kapsül dolap kombinim! 🌿🧥 Siyah tişört her zaman kurtarır.',
    isLikedByMe: false,
  },
  {
    id: '2',
    user: { name: 'Veli Yılmaz', avatar: 'https://i.pravatar.cc/150?u=zeynep' },
    outfitImage: 'https://res.cloudinary.com/dujm9gm43/image/upload/v1773245818/ky8jp1wghseiw012oiec.png',
    likes: 128,
    caption: 'Bugün ofis günü. AI stilistimin önerdiği bu ceket harika durdu. 💼✨',
    isLikedByMe: true,
  },
  {
    id: '3',
    user: { name: 'Caner Tech', avatar: 'https://i.pravatar.cc/150?u=caner' },
    outfitImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop',
    likes: 89,
    caption: 'Rahat bir pazar kahvesi kombini. ☕ Minimalizm <3',
    isLikedByMe: false,
  }
];

export default function SocialScreen() {
  const [posts, setPosts] = useState(MOCK_POSTS);

  // Beğeni (Like) Fonksiyonu
  const toggleLike = (postId: string) => {
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLikedByMe: !post.isLikedByMe,
            likes: post.isLikedByMe ? post.likes - 1 : post.likes + 1
          };
        }
        return post;
      })
    );
  };

  // 2. HER BİR GÖNDERİNİN TASARIMI (Instagram Kartı Tarzı)
  const renderPost = ({ item }: { item: typeof MOCK_POSTS[0] }) => (
    <View style={styles.postContainer}>
      
      {/* Gönderi Üst Bilgisi (Avatar ve İsim) */}
      <View style={styles.postHeader}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <Text style={styles.username}>{item.user.name}</Text>
        <TouchableOpacity style={styles.moreOptions}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#7F8C8D" />
        </TouchableOpacity>
      </View>

      {/* Dev Kombin Fotoğrafı */}
      <Image source={{ uri: item.outfitImage }} style={styles.postImage} resizeMode="cover" />

      {/* Etkileşim Çubuğu (Beğen, Yorum, Kaydet) */}
      <View style={styles.interactionBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.actionIcon}>
            <Ionicons name={item.isLikedByMe ? "heart" : "heart-outline"} size={28} color={item.isLikedByMe ? "#E74C3C" : "#2C3E50"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="chatbubble-outline" size={26} color="#2C3E50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="paper-plane-outline" size={26} color="#2C3E50" />
          </TouchableOpacity>
        </View>
        
        {/* Koleksiyona Kaydet Butonu */}
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={26} color="#2C3E50" />
        </TouchableOpacity>
      </View>

      {/* Beğeni Sayısı ve Açıklama */}
      <View style={styles.postFooter}>
        <Text style={styles.likesText}>{item.likes} beğenme</Text>
        <Text style={styles.captionText}>
          <Text style={styles.captionUsername}>{item.user.name} </Text>
          {item.caption}
        </Text>
      </View>

    </View>
  );

  return (
    <View style={styles.container}>
      {/* Keşfet Başlığı */}
      <View style={styles.header}>
        <Text style={styles.title}>Keşfet</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#2C3E50" />
        </TouchableOpacity>
      </View>

      {/* Kaydırılabilir Sosyal Akış (Feed) */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  
  // Üst Başlık
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  title: { fontSize: 26, fontWeight: '900', color: '#2C3E50', letterSpacing: 0.5 },
  searchButton: { padding: 5 },

  feedContainer: { paddingBottom: 20 },

  // Gönderi Kartı
  postContainer: { backgroundColor: '#FFFFFF', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  
  // Avatar ve İsim
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#EEEEEE' },
  username: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  moreOptions: { padding: 5 },

  // Fotoğraf
  postImage: { width: '100%', height: 400, backgroundColor: '#F8F9FA' },

  // Beğeni/Yorum Çubuğu
  interactionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  leftActions: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginRight: 15 },

  // Alt Kısım (Beğeni sayısı ve yazı)
  postFooter: { paddingHorizontal: 15, paddingBottom: 15 },
  likesText: { fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
  captionUsername: { fontWeight: 'bold', color: '#2C3E50' },
  captionText: { color: '#34495E', lineHeight: 20 },
});