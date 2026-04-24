import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface PremiumToastProps {
  visible: boolean;
  message: string;
  onHide: () => void;
}

export default function PremiumToast({ visible, message, onHide }: PremiumToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 60,
        useNativeDriver: true,
        bounciness: 8,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onHide());
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <BlurView intensity={80} tint="light" style={styles.blurWrapper}>
        <View style={styles.iconCircle}>
          <Feather name="check" size={18} color="#FFF" />
        </View>
        <Text style={styles.messageText}>{message}</Text>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: width - 40,
    alignSelf: 'center',
    zIndex: 9999,
  },
  blurWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});