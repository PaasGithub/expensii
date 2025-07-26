import { Image, StyleSheet, TouchableOpacity, View, Text, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

const CameraComponent: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [status, requestPermission] = ImagePicker.useCameraPermissions();

  useEffect(() => {
    if (!status?.granted) {
      requestPermission();
    }
  }, [status]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const launchCamera = async () => {
    if (!status?.granted) {
      const permission = await requestPermission();
      if (!permission.granted) return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  useEffect(() => {
    console.log('selectedImage:', selectedImage);
  }, [selectedImage]);

    const handleUpload = async () => {
        try {
            // Simulate API call
            // const response = await fetch('https://api.example.com/upload', {
            // method: 'POST',
            // body: JSON.stringify({ image: selectedImage }),
            // });

            // const data = await response.json();
            const message="success";

            if (message === 'success') {
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Image uploaded successfully!',
            });
            } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                // text2: data.message || 'Failed to upload image.',
                text2: 'Failed to upload image.',
            });
            }
        } catch (error) {
            Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'An unexpected error occurred.',
            });
        }
    };

  const handleClose = () => {
    setSelectedImage(null);
  };

  return (
    <View style={styles.container}>
      {selectedImage ? (
        <View style={styles.imageContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={styles.image} />
          <TouchableOpacity style={styles.sendButton} onPress={handleUpload}>
            <Text style={styles.sendButtonText}>Send to OpenAI</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={async () => {
          const action = await showActionSheet();
          if (action === 'camera') {
            launchCamera();
          } else if (action === 'gallery') {
            pickImage();
          }
        }}>
          <MaterialIcons name="cloud-upload" size={50} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const showActionSheet = async () => {
  // You can use a library like `expo-action-sheet` or a custom modal for better UX
  return new Promise<string>((resolve) => {
    Alert.alert(
      'Choose an option',
      'Select an option to upload an image',
      [
        { text: 'Camera', onPress: () => resolve('camera') },
        { text: 'Gallery', onPress: () => resolve('gallery') },
        { text: 'Cancel', onPress: () => resolve('cancel'), style: 'cancel' },
      ]
    );
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sendButton: {
    width: 200,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraComponent;