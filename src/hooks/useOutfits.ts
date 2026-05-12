import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';

export function useOutfits(userId: number) {
  const [outfits, setOutfits] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchOutfits = useCallback(async (page = 0, isRefresh = false) => {
    if (isLoadingMore) return;
    try {
      if (page > 0) setIsLoadingMore(true);
      
      const response = await apiClient.get(`/outfits/user/${userId}?page=${page}&size=10&sort=id,desc`);
      const responseData = response.data;
      const outfitsArray = responseData.content || [];

      setTotalCount(responseData.totalElements || outfitsArray.length);
      setTotalPages(responseData.totalPages || 1);

      if (isRefresh || page === 0) {
        setOutfits(outfitsArray);
      } else {
        setOutfits(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = outfitsArray.filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      setCurrentPage(page);
    } catch (error) {
      console.error("🚨 Outfits fetch error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, isLoadingMore]);

  const loadMoreOutfits = () => {
    if (currentPage < totalPages - 1 && !isLoadingMore) {
      fetchOutfits(currentPage + 1, false);
    }
  };

  return {
    outfits,
    totalCount,
    isLoadingMore,
    fetchOutfits,
    loadMoreOutfits
  };
}