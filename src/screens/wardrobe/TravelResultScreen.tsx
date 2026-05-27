import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiClient } from '../../api/client';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85; 

// 🎨 YENİ RAKİPSİZ MARKA PALETİ (Tişört Referanslı)
const GUSTO = {
    bg: '#F8F6F0',        
    text: '#2C3539',      
    primary: '#D6453A',   
    accent: '#EBB638',    
    surface: '#8B9BB4',   
    cardBg: '#FFFFFF',
    border: '#E2DEC6'     
};

const PARTNER_CATALOG: any = {
  "pt_99": { brand: "Burberry", name: "Klasik Bej Trençkot" },
  "pt_100": { brand: "Prada", name: "Siyah Deri Loafer" },
  "pt_101": { brand: "Rolex", name: "Submariner Çelik Saat" },
  "pt_102": { brand: "Massimo Dutti", name: "İpek Şal" },
  "pt_103": { brand: "Hugo Boss", name: "Lacivert Blazer" }
};

export default function TravelResultScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    
    const { capsuleData } = route.params || {};
    
    const [allWardrobe, setAllWardrobe] = useState<any[]>([]);
    const [isWardrobeLoading, setIsWardrobeLoading] = useState(true); // 🚀 RESİMLERİN YÜKLENMESİNİ GARANTİLEYEN KİLİT

useEffect(() => {
        const fetchWardrobe = async () => {
            try {
                // 🚨 BURAYI DEĞİŞTİR: Senin Java'da kıyafetleri listelediğin asıl GET adresin neyse onu yaz
                // Örnek: '/clothing-items/user/1' veya '/wardrobes/1'
                const response = await apiClient.get('/clothes/1'); 
                
                // 🚀 Dedektif Modu: Terminale bak, veriler gerçekten geliyor mu? Resim URL'sinin adı ne?
                console.log("📦 [VESTIFY DEBUG] Gelen Dolap Verisi:", JSON.stringify(response.data).substring(0, 200)); 

                // Spring Boot Pagination kullanıyorsa content içindedir, yoksa direkt data'nın kendisidir.
                const wardrobeArray = response.data.content || response.data || [];
                setAllWardrobe(wardrobeArray);

            } catch (error) {
                console.error("🚨 Dolap çekilirken API hatası:", error);
            } finally {
                setIsWardrobeLoading(false); 
            }
        };
        fetchWardrobe();
    }, []);

    // 🚀 Eğer dolap hala çekiliyorsa, ekranı çizme, sadece bekle!
    if (isWardrobeLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: GUSTO.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={GUSTO.primary} />
                <Text style={{ marginTop: 15, color: GUSTO.text, fontWeight: '700' }}>Dolabınızdaki fotoğraflar eşleştiriliyor...</Text>
            </View>
        );
    }

    if (!capsuleData) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Feather name="alert-circle" size={40} color={GUSTO.primary} />
                <Text style={styles.errorText}>Kapsül verisi bulunamadı.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Geri Dön</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // 🚀 DİNAMİK FOTOĞRAF BULUCU (Güçlendirildi)
    const getItemImage = (id: string) => {
        const found = allWardrobe.find((item: any) => item.id?.toString() === id.toString() || item.clothingId?.toString() === id.toString());
        // Hem imageUrl hem de image_url varyasyonlarını kontrol et
        return found ? (found.imageUrl || found.image_url || found.uri) : 'https://via.placeholder.com/150?text=Eksik';
    };

    const renderCoreItem = ({ item }: { item: string }) => (
        <View style={styles.coreItemBubble}>
            <Image source={{ uri: getItemImage(item) }} style={styles.coreItemImage} />
        </View>
    );

    const renderOutfitCard = ({ item, index }: { item: any, index: number }) => {
        const partnerInfo = PARTNER_CATALOG[item.partnerUpsellItem] || { brand: "Vestify", name: "Özel Tasarım Önerisi" };

        return (
            <View style={styles.outfitCard}>
                <View style={styles.outfitHeader}>
                    <Text style={styles.dayLabel}>GÜN {index + 1}</Text>
                    <Text style={styles.outfitName}>{item.outfitName}</Text>
                </View>

                <Text style={styles.sectionTitle}>Sizin Dolabınızdan</Text>
                <View style={styles.userItemsGrid}>
                    {item.userItems.map((id: string, idx: number) => (
                        <View key={idx} style={styles.userItemBox}>
                            <Image source={{ uri: getItemImage(id) }} style={styles.userItemImage} />
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.partnerSection}>
                    <View style={styles.partnerBadge}>
                        <Feather name="star" size={10} color="#FFF" />
                        <Text style={styles.partnerBadgeText}>UPSELL</Text>
                    </View>
                    
                    <Text style={styles.partnerBrand}>{partnerInfo.brand}</Text>
                    <Text style={styles.partnerItemTitle}>{partnerInfo.name}</Text>
                    <Text style={styles.stylistPitch}>"{item.stylistPitch}"</Text>
                    
                    <TouchableOpacity style={styles.buyButton}>
                        <Text style={styles.buyButtonText}>ÜRÜNÜ İNCELE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Feather name="x" size={24} color={GUSTO.text} />
                </TouchableOpacity>
                <Text style={styles.headerTopTitle}>TRAVEL CAPSULE</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>{capsuleData.capsuleTitle}</Text>
                    <Text style={styles.subtitle}>Curated entirely for your journey.</Text>
                </View>

                {capsuleData.coreCapsuleItemIds && (
                    <View style={styles.coreSection}>
                        <Text style={styles.sectionMainTitle}>The Core Elements</Text>
                        <FlatList
                            data={capsuleData.coreCapsuleItemIds}
                            renderItem={renderCoreItem}
                            keyExtractor={(item, index) => index.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 30, gap: 15 }}
                        />
                    </View>
                )}

                <View style={styles.carouselSection}>
                    <Text style={[styles.sectionMainTitle, { paddingHorizontal: 30 }]}>Daily Itinerary</Text>
                    <FlatList
                        data={capsuleData.outfits}
                        renderItem={renderOutfitCard}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={CARD_WIDTH + 20} 
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingHorizontal: 30, gap: 20 }}
                    />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>SAVE CAPSULE</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: GUSTO.bg },
    scrollContent: { paddingBottom: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
    headerTopTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 3, color: GUSTO.text },
    iconButton: { padding: 8 },
    
    titleSection: { paddingHorizontal: 30, marginTop: 20, marginBottom: 40 },
    mainTitle: { fontSize: 36, fontWeight: '800', color: GUSTO.primary, lineHeight: 40, letterSpacing: -1 },
    subtitle: { fontSize: 14, color: GUSTO.surface, marginTop: 10, fontStyle: 'italic', fontWeight: '600' },

    coreSection: { marginBottom: 40 },
    sectionMainTitle: { fontSize: 12, fontWeight: '800', color: GUSTO.text, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20, paddingHorizontal: 30 },
    coreItemBubble: { width: 75, height: 90, backgroundColor: GUSTO.cardBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: GUSTO.border, overflow: 'hidden' },
    coreItemImage: { width: '80%', height: '80%', resizeMode: 'cover' },

    carouselSection: { marginBottom: 20 },
    outfitCard: { width: CARD_WIDTH, backgroundColor: GUSTO.cardBg, borderRadius: 16, padding: 25, borderWidth: 1, borderColor: GUSTO.border },
    outfitHeader: { marginBottom: 25 },
    dayLabel: { fontSize: 10, fontWeight: '900', color: GUSTO.accent, letterSpacing: 2, marginBottom: 5 },
    outfitName: { fontSize: 24, fontWeight: '700', color: GUSTO.text },
    
    sectionTitle: { fontSize: 10, fontWeight: '800', color: GUSTO.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    userItemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    userItemBox: { width: 65, height: 80, backgroundColor: GUSTO.bg, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: GUSTO.border },
    userItemImage: { width: '80%', height: '80%', resizeMode: 'cover' },

    divider: { height: 1, backgroundColor: GUSTO.border, marginVertical: 25 },

    partnerSection: { backgroundColor: GUSTO.bg, padding: 20, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: GUSTO.surface },
    partnerBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: GUSTO.accent, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, gap: 4, marginBottom: 15 },
    partnerBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
    partnerBrand: { fontSize: 11, fontWeight: '800', color: GUSTO.surface, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
    partnerItemTitle: { fontSize: 18, fontWeight: '700', color: GUSTO.text, marginBottom: 10 },
    stylistPitch: { fontSize: 13, fontStyle: 'italic', color: GUSTO.text, lineHeight: 22, marginBottom: 20 },
    
    buyButton: { backgroundColor: GUSTO.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    buyButtonText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1.5 },

    footer: { paddingHorizontal: 30, marginTop: 30 },
    saveButton: { backgroundColor: GUSTO.text, height: 65, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    saveButtonText: { fontSize: 13, fontWeight: '800', color: '#FFF', letterSpacing: 2 },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: GUSTO.bg },
    errorText: { fontSize: 14, color: GUSTO.text, marginTop: 15, fontWeight: '600' },
    backBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: GUSTO.text, borderRadius: 8 },
    backBtnText: { color: GUSTO.text, fontWeight: '800', fontSize: 12 }
});