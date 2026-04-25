import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

interface PremiumAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  iconName?: keyof typeof Feather.glyphMap;
}

export default function PremiumAlert({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = "Onayla",
  cancelText = "İptal",
  iconName = "info"
}: PremiumAlertProps) {
  
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <View style={styles.alertBox}>
          
          <View style={styles.iconContainer}>
            <Feather name={iconName} size={28} color="#1A1A1A" />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.9}>
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Hafif bir karartma + Blur efekti
  },
  alertBox: {
    width: '80%',
    backgroundColor: '#FAF9F4', // Uygulamanın soft arka plan rengi
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBE8DF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#EBE8DF',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#888',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#1A1A1A', // Sert kırmızı yerine şık bir siyah
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});