import React, { createContext, useState, useContext } from 'react';

// Sistemin taşıyacağı verilerin tipleri
interface ProfileContextType {
  profileImage: string | null;
  setProfileImage: (uri: string | null) => void;
}

// Merkezi depomuzu oluşturuyoruz
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Uygulamayı saracak olan Sağlayıcı (Provider) Kapsülümüz
export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  return (
    <ProfileContext.Provider value={{ profileImage, setProfileImage }}>
      {children}
    </ProfileContext.Provider>
  );
};

// Ekranlarda kolayca kullanabilmek için özel bir Kanca (Hook)
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};