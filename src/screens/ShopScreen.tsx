import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, FlatList, TextInput, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfile } from '../context/ProfileContext';

const { width } = Dimensions.get('window');


// Vinted / Depop Hissi: Kıyafetlerin sağ altında sadece fiyat yazmıyor, 
// aynı zamanda o ürünü kimin sattığını gösteren küçük bir satıcı avatarı (sellerInfo) var. 
// Bu, uygulamanın bir mağaza değil, bir "Topluluk" (C2C Pazaryeri) olduğunu hissettiren en önemli detaydır.

// 🛍️ MOCK DATA: "Beyond" (Ötesi) dünyasındaki satılık eşyalar
const MOCK_PRODUCTS = [
  { id: '1', title: 'Vintage Deri Ceket', price: '₺1.250', brand: 'Harley Davidson', size: 'L', sellerName: 'alex_style', sellerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', isLiked: false },
  { id: '2', title: 'Y2K Bol Paraşüt Pantolon', price: '₺450', brand: 'Jaded London', size: 'M', sellerName: 'mia_vintage', sellerAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400', isLiked: true },
  { id: '3', title: 'Jordan 1 Retro High', price: '₺3.800', brand: 'Nike', size: '42', sellerName: 'sneaker_head', sellerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100', image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400', isLiked: false },
  { id: '4', title: 'Oversize Basic Tişört', price: '₺150', brand: 'Zara', size: 'XL', sellerName: 'kadir_dev', sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', isLiked: false },
  { id: '5', title: 'Keten Yazlık Gömlek', price: '₺300', brand: 'Mango', size: 'S', sellerName: 'summer_vibes', sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e23?w=400', isLiked: true },
  { id: '6', title: 'Retro Güneş Gözlüğü', price: '₺220', brand: 'No Name', size: 'Standart', sellerName: 'retro_gal', sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400', isLiked: false },
];

const CATEGORIES = ['All', 'Trending', 'Vintage', 'Y2K', 'Sneakers', 'Streetwear'];

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { profileImage } = useProfile();
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const toggleLike = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isLiked: !p.isLiked } : p));
  };

  // 🛍️ ÜRÜN KARTI TASARIMI
  const renderProductCard = ({ item }: { item: typeof MOCK_PRODUCTS[0] }) => (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <TouchableOpacity style={styles.likeButton} onPress={() => toggleLike(item.id)}>
          <MaterialCommunityIcons name={item.isLiked ? "heart" : "heart-outline"} size={20} color={item.isLiked ? "#FF3B30" : "#1A1A1A"} />
        </TouchableOpacity>
        <View style={styles.sizeBadge}>
          <Text style={styles.sizeText}>{item.size}</Text>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productBrand} numberOfLines={1}>{item.brand}</Text>
        <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{item.price}</Text>
          <View style={styles.sellerInfo}>
            <Image source={{ uri: item.sellerAvatar }} style={styles.sellerAvatar} />
            <Text style={styles.sellerName} numberOfLines={1}>{item.sellerName}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 🚀 SENİN TASARIMIN: "BEYOND" HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: profileImage || defaultAvatar }} style={styles.profileImage} />
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.logoText}>VESTIFY</Text>
          
          <View style={styles.beyondWrapper}>
            <MaterialCommunityIcons name="wave" size={24} color="#1A1A1A" style={styles.waveIcon} />
            {/* Neon Çerçeveli Beyond Hapı */}
            <TouchableOpacity style={styles.beyondPill} activeOpacity={0.8}>
              <Text style={styles.beyondText}>Beyond</Text>
            </TouchableOpacity>
            <MaterialCommunityIcons name="wave" size={24} color="#1A1A1A" style={[styles.waveIcon, { transform: [{ scaleX: -1 }] }]} />
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="bell" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="bar-chart-2" size={24} color="#1A1A1A" style={{ transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔍 ARAMA VE KATEGORİLER (Sadece Shop/Beyond alanına özel) */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#888" />
          <TextInput 
            placeholder="Search in Beyond..." 
            placeholderTextColor="#888" 
            style={styles.searchInput}
          />
          <TouchableOpacity>
            <Feather name="sliders" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 👗 VINTED/DEPOP TARZI 2 SÜTUNLU FEED */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
        columnWrapperStyle={styles.feedColumnWrapper}
        renderItem={renderProductCard}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F4' }, // Tasarımındaki hafif krem/kemik rengi
  
  // 🚀 HEADER STİLLERİ (Referans tasarımla birebir)
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerLeft: { flex: 1, alignItems: 'flex-start' },
  profileImage: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#E0E0E0' },
  
  headerCenter: { flex: 2, alignItems: 'center' },
  logoText: { fontSize: 22, fontWeight: '800', letterSpacing: 2, color: '#1A1A1A', marginBottom: 6 },
  
  beyondWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  waveIcon: { opacity: 0.7, marginTop: 2 },
  beyondPill: { 
    backgroundColor: '#FAF9F4', 
    paddingHorizontal: 16, 
    paddingVertical: 4, 
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#00E676', // Neon Yeşil/Mavi Sınır
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4
  },
  beyondText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.5 },

  headerRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingTop: 5 },
  iconBtn: { padding: 4 },

  // 🔍 ARAMA & KATEGORİ STİLLERİ
  searchSection: { paddingHorizontal: 20, paddingBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 15, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  categoryScroll: { gap: 10, paddingRight: 20 },
  categoryChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEB' },
  categoryChipActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#888' },
  categoryTextActive: { color: '#FFFFFF' },

  // 👗 FEED (GRID) STİLLERİ
  feedContainer: { paddingHorizontal: 15, paddingBottom: 100, paddingTop: 10 },
  feedColumnWrapper: { justifyContent: 'space-between', marginBottom: 15 },
  
  productCard: { width: (width / 2) - 22, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  imageContainer: { width: '100%', height: 180, backgroundColor: '#F5F5F5', position: 'relative' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  likeButton: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFFFFF', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sizeBadge: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  sizeText: { fontSize: 11, fontWeight: '800', color: '#1A1A1A' },

  productInfo: { padding: 12 },
  productBrand: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 2 },
  productTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', maxWidth: '50%' },
  sellerAvatar: { width: 18, height: 18, borderRadius: 9, marginRight: 4 },
  sellerName: { fontSize: 10, fontWeight: '600', color: '#888' }
});