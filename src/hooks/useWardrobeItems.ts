import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { ClothingItem } from '../types';

// 🚀 Parametre olarak Context'ten gelen userId'yi alıyor
export function useWardrobeItems(userId: number) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchWardrobe = useCallback(async (page = 0, isRefresh = false) => {
    if (isLoadingMore) return;
    try {
      if (page > 0) setIsLoadingMore(true);
      
      // API İsteği: Dinamik userId ile yapılıyor
      const response = await apiClient.get(`/clothes/${userId}?page=${page}&size=20&sort=id,desc`);
      const responseData = response.data;
      const itemsArray = responseData.content || (Array.isArray(responseData) ? responseData : []);

      setTotalCount(responseData.totalElements || itemsArray.length);
      setTotalPages(responseData.totalPages || 1);

      if (isRefresh || page === 0) {
        setItems(itemsArray);
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const newItems = itemsArray.filter((i: ClothingItem) => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });
      }
      setCurrentPage(page);
      return itemsArray;
    } catch (error) {
      console.error("🚨 Wardrobe fetch error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, isLoadingMore]); // Bağımlılık olarak userId eklendi

  const loadMoreItems = () => {
    if (currentPage < totalPages - 1 && !isLoadingMore) {
      fetchWardrobe(currentPage + 1, false);
    }
  };

  return {
    items,
    setItems,
    currentPage,
    totalCount,
    isLoadingMore,
    fetchWardrobe,
    loadMoreItems
  };
}