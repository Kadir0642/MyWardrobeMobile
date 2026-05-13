import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';

export function useOutfits(userId: number) {
  // 🚀 İKİ FARKLI LİSTE VE STATE
  const [regularOutfits, setRegularOutfits] = useState<any[]>([]);
  const [lookbookOutfits, setLookbookOutfits] = useState<any[]>([]);
  
  // 🚀 İKİ FARKLI TOPLAM SAYI (SEKMELERDE BUNLAR GÖRÜNECEK)
  const [regularTotalCount, setRegularTotalCount] = useState(0);
  const [lookbookTotalCount, setLookbookTotalCount] = useState(0);

  // 🚀 İKİ FARKLI SAYFALAMA DURUMU
  const [regularPage, setRegularPage] = useState(0);
  const [regularTotalPages, setRegularTotalPages] = useState(1);
  const [lookbookPage, setLookbookPage] = useState(0);
  const [lookbookTotalPages, setLookbookTotalPages] = useState(1);

  const [isLoadingMoreRegular, setIsLoadingMoreRegular] = useState(false);
  const [isLoadingMoreLookbook, setIsLoadingMoreLookbook] = useState(false);

  // 🚀 REGULAR (NORMAL) KOMBİNLERİ ÇEKME
  const fetchRegularOutfits = useCallback(async (page = 0, isRefresh = false) => {
    if (isLoadingMoreRegular) return;
    try {
      if (page > 0) setIsLoadingMoreRegular(true);
      
      const response = await apiClient.get(`/outfits/user/${userId}?type=REGULAR&page=${page}&size=15&sort=id,desc`);
      const responseData = response.data;
      const outfitsArray = responseData.content || [];

      setRegularTotalCount(responseData.totalElements || outfitsArray.length);
      setRegularTotalPages(responseData.totalPages || 1);

      if (isRefresh || page === 0) {
        setRegularOutfits(outfitsArray);
      } else {
        setRegularOutfits(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = outfitsArray.filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      setRegularPage(page);
    } catch (error) {
      console.error("🚨 Regular Outfits fetch error:", error);
    } finally {
      setIsLoadingMoreRegular(false);
    }
  }, [userId, isLoadingMoreRegular]);


  // 🚀 LOOKBOOK KOMBİNLERİNİ ÇEKME
  const fetchLookbooks = useCallback(async (page = 0, isRefresh = false) => {
    if (isLoadingMoreLookbook) return;
    try {
      if (page > 0) setIsLoadingMoreLookbook(true);
      
      const response = await apiClient.get(`/outfits/user/${userId}?type=LOOKBOOK&page=${page}&size=15&sort=id,desc`);
      const responseData = response.data;
      const outfitsArray = responseData.content || [];

      setLookbookTotalCount(responseData.totalElements || outfitsArray.length);
      setLookbookTotalPages(responseData.totalPages || 1);

      if (isRefresh || page === 0) {
        setLookbookOutfits(outfitsArray);
      } else {
        setLookbookOutfits(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = outfitsArray.filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      setLookbookPage(page);
    } catch (error) {
      console.error("🚨 Lookbooks fetch error:", error);
    } finally {
      setIsLoadingMoreLookbook(false);
    }
  }, [userId, isLoadingMoreLookbook]);


  // 🚀 LOAD MORE (DAHA FAZLA YÜKLE) FONKSİYONLARI
  const loadMoreRegular = () => {
    if (regularPage < regularTotalPages - 1 && !isLoadingMoreRegular) {
      fetchRegularOutfits(regularPage + 1, false);
    }
  };

  const loadMoreLookbooks = () => {
    if (lookbookPage < lookbookTotalPages - 1 && !isLoadingMoreLookbook) {
      fetchLookbooks(lookbookPage + 1, false);
    }
  };

  // 🚀 TOPLU YENİLEME FONKSİYONU
  const fetchAllOutfits = async (isRefresh = false) => {
      await Promise.all([
          fetchRegularOutfits(0, isRefresh),
          fetchLookbooks(0, isRefresh)
      ]);
  };

  return {
    // Regular Değerleri
    regularOutfits,
    regularTotalCount,
    isLoadingMoreRegular,
    fetchRegularOutfits,
    loadMoreRegular,
    
    // Lookbook Değerleri
    lookbookOutfits,
    lookbookTotalCount,
    isLoadingMoreLookbook,
    fetchLookbooks,
    loadMoreLookbooks,

    // Genel İşlemler
    fetchAllOutfits
  };
}