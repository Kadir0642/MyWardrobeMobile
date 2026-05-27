import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, FlatList, SafeAreaView,ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import PremiumToast from '../../components/PremiumToast';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

// 🎨 VOGUE MINIMALIST PALETTE
const VOGUE = { bg: '#FFFFFF', text: '#1A1A1A', secondary: '#717171', border: '#E8E8E8', softBg: '#F9F9F9' };

// 🚀 SAHTE PARTNER KATALOĞU (İleride Backend'den gerçek API ile gelecek)
const PARTNER_CATALOG: any = {
  "pt_99": { brand: "Burberry", name: "Klasik Bej Trençkot" },
  "pt_100": { brand: "Prada", name: "Siyah Deri Loafer" },
  "pt_101": { brand: "Rolex", name: "Submariner Çelik Saat" },
  "pt_102": { brand: "Massimo Dutti", name: "İpek Şal" },
  "pt_103": { brand: "Hugo Boss", name: "Lacivert Blazer" }
};

export default function EventResultScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const [toastVisible, setToastVisible] = useState(false);

    // 🚀 BÜYÜK BEYİN VERİSİ (Gemini'den gelen gerçek data)
    const { capsuleData, eventContext } = route.params || {};

    // 🚀 Dolap verisini tutacağımız state
    const [allWardrobe, setAllWardrobe] = useState<any[]>([]);

    const [isWardrobeLoading, setIsWardrobeLoading] = useState(true);

    // Ekran açıldığında kullanıcının dolabını arka planda çek
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
            <View style={{ flex: 1, backgroundColor: VOGUE.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={VOGUE.text} />
                <Text style={{ marginTop: 15, color: VOGUE.text, fontWeight: '700' }}>Dolabınızdaki fotoğraflar eşleştiriliyor...</Text>
            </View>
        );
    }

    if (!capsuleData) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Feather name="alert-circle" size={40} color={VOGUE.text} />
                <Text style={styles.errorText}>Kombin verisi bulunamadı.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>GERİ DÖN</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // 🚀 DİNAMİK FOTOĞRAF BULUCU
    const getItemImage = (id: string) => {
        if (!allWardrobe || allWardrobe.length === 0) return 'https://via.placeholder.com/150?text=Yükleniyor'; 
        const found = allWardrobe.find((item: any) => item.id?.toString() === id.toString() || item.clothingId?.toString() === id.toString());
        return found ? (found.imageUrl || found.uri) : 'https://via.placeholder.com/150?text=Eksik';
    };

    const handleSaveLook = () => {
        // İleride Backend'e kaydetme kodu buraya gelecek
        setToastVisible(true);
    };

    const renderOutfitOption = ({ item, index }: { item: any, index: number }) => {
        const partnerInfo = PARTNER_CATALOG[item.partnerUpsellItem] || { brand: "Vestify", name: "Özel Tasarım" };

        return (
            <View style={styles.outfitCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.optionLabel}>ALTERNATİF 0{index + 1}</Text>
                        <Text style={styles.optionName}>{item.outfitName}</Text>
                    </View>
                </View>

                <View style={styles.userItemsSection}>
                    <Text style={styles.sectionTitle}>Sizin Dolabınızdan</Text>
                    <View style={styles.userItemsGrid}>
                        {item.userItems.map((id: string, idx: number) => (
                            <View key={idx} style={styles.userItemBox}>
                                <Image source={{ uri: getItemImage(id) }} style={styles.itemImage} />
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.partnerSection}>
                    <View style={styles.partnerBadge}>
                        <Feather name="star" size={10} color="#FFF" />
                        <Text style={styles.partnerBadgeText}>UPSELL</Text>
                    </View>
                    
                    <Text style={styles.partnerBrand}>{partnerInfo.brand}</Text>
                    <Text style={styles.partnerName}>{partnerInfo.name}</Text>
                    <Text style={styles.stylistPitch}>"{item.stylistPitch}"</Text>
                    
                    <TouchableOpacity style={styles.buyBtn} activeOpacity={0.8}>
                        <Text style={styles.buyBtnText}>ÜRÜNÜ İNCELE</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSaveLook}>
                    <Text style={styles.saveBtnText}>DOLABA EKLE</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Feather name="x" size={24} color={VOGUE.text} />
                </TouchableOpacity>
                <Text style={styles.headerTopTitle}>EVENT CURATOR</Text>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.contextSection}>
                    <Text style={styles.contextMainTitle}>{capsuleData.capsuleTitle}</Text>
                    {eventContext && (
                        <View style={styles.aiContextBox}>
                            <Text style={styles.aiContextText}>"{eventContext}"</Text>
                        </View>
                    )}
                </View>

                <View style={styles.carouselWrapper}>
                    <FlatList
                        data={capsuleData.outfits}
                        renderItem={renderOutfitOption}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={CARD_WIDTH + 20} 
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingHorizontal: 30, gap: 20, paddingBottom: 20 }}
                    />
                </View>

            </ScrollView>

            <PremiumToast visible={toastVisible} message="Kombin başarıyla kaydedildi." onHide={() => setToastVisible(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: VOGUE.bg },
    scrollContent: { paddingBottom: 40 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
    headerTopTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 3, color: VOGUE.text },
    iconButton: { padding: 8 },

    contextSection: { paddingHorizontal: 30, marginBottom: 30, marginTop: 20 },
    contextMainTitle: { fontSize: 36, fontWeight: '800', color: VOGUE.text, lineHeight: 40, letterSpacing: -1 },
    aiContextBox: { borderLeftWidth: 3, borderLeftColor: VOGUE.text, paddingLeft: 15, marginTop: 20 },
    aiContextText: { fontSize: 14, color: VOGUE.secondary, fontStyle: 'italic', lineHeight: 22 },

    carouselWrapper: { width: '100%' },
    
    outfitCard: { width: CARD_WIDTH, backgroundColor: VOGUE.bg, padding: 25, borderWidth: 1, borderColor: VOGUE.border, borderRadius: 0 },
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
    optionLabel: { fontSize: 10, fontWeight: '800', color: VOGUE.secondary, letterSpacing: 2, marginBottom: 5 },
    optionName: { fontSize: 24, fontWeight: '700', color: VOGUE.text },

    userItemsSection: { marginBottom: 25 },
    sectionTitle: { fontSize: 10, fontWeight: '800', color: VOGUE.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    userItemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    userItemBox: { width: 65, height: 80, backgroundColor: VOGUE.softBg, borderWidth: 1, borderColor: VOGUE.border, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
    itemImage: { width: '80%', height: '80%', resizeMode: 'contain' },

    divider: { height: 1, backgroundColor: VOGUE.border, marginVertical: 25 },

    partnerSection: { backgroundColor: VOGUE.softBg, padding: 20, borderLeftWidth: 3, borderLeftColor: VOGUE.text, marginBottom: 25, borderRadius: 4 },
    partnerBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: VOGUE.text, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 2, gap: 4, marginBottom: 15 },
    partnerBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
    partnerBrand: { fontSize: 11, fontWeight: '800', color: VOGUE.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
    partnerName: { fontSize: 18, fontWeight: '700', color: VOGUE.text, marginBottom: 10 },
    stylistPitch: { fontSize: 13, fontStyle: 'italic', color: VOGUE.text, lineHeight: 22, marginBottom: 20 },
    
    buyBtn: { backgroundColor: VOGUE.text, paddingVertical: 14, borderRadius: 2, alignItems: 'center' },
    buyBtnText: { fontSize: 11, fontWeight: '800', color: VOGUE.bg, letterSpacing: 1.5 },

    saveBtn: { backgroundColor: VOGUE.bg, paddingVertical: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: VOGUE.text, borderRadius: 2 },
    saveBtnText: { color: VOGUE.text, fontSize: 12, fontWeight: '900', letterSpacing: 2 },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VOGUE.bg },
    errorText: { fontSize: 14, color: VOGUE.secondary, marginTop: 15, marginBottom: 20 },
    backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: VOGUE.text },
    backBtnText: { color: VOGUE.text, fontWeight: '800', fontSize: 12 }
});