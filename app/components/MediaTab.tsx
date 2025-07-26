import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from './ui/IconSymbol';

export default function MediaTab(props: BottomTabBarButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const handlePress = (ev: any) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setModalVisible(true);
  };

  const navigateToAudio = () => {
    setModalVisible(false);
    router.push('/(tabs)/audio');
  };

  const navigateToCamera = () => {
    setModalVisible(false);
    router.push('/(tabs)/camera');
  };

  return (
    <>
      <PlatformPressable
        {...props}
        onPressIn={handlePress}
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.overlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.option} 
              onPress={navigateToAudio}
            >
              <IconSymbol size={24} name="mic.badge.plus" color="#007AFF" />
              <Text style={styles.optionText}>Audio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.option} 
              onPress={navigateToCamera}
            >
              <IconSymbol size={24} name="camera.badge.ellipsis" color="#007AFF" />
              <Text style={styles.optionText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#000',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
}); 