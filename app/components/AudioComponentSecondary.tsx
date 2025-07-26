import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import sendTextForExtraction from './expenseExtraction';
import { useExpenseContext } from '../context/ExpenseContext';
import { v4 as uuidv4 } from 'uuid';
import Toast from 'react-native-toast-message';

interface Recording {
  id: string;
  uri: string;
  duration: number;
}

const AudioComponentSecondary: React.FC = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const { addExpense } = useExpenseContext();
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadingId, setCurrentUploadingId] = useState<string | null>(null);
  useEffect(() => {
    Audio.requestPermissionsAsync();
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync(
        {
          allowsRecordingIOS: false,
        }
      );
      const uri = recording.getURI();

      // Create a new sound object from the recording
      const { sound, status } = await recording.createNewLoadedSoundAsync();

      const durationMillis = status.isLoaded && typeof status.durationMillis === 'number' 
      ? status.durationMillis 
      : 0; // Default to 0 if undefined or not a number

      // console.log("DURation millis: " , durationMillis);
      
      if (uri) {
        setRecordings(prev => [...prev, {
          id: Date.now().toString(),
          uri,
          duration: durationMillis,
        }]);
      }
      
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playSound = async (uri: string, id: string, duration: number) => {
    if (sound && currentPlayingId === id) {
        if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        } else {
        await sound.playAsync();
        setIsPlaying(true);
        }
    } else {
        if (sound) {
        await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync({ uri });
        setSound(newSound);
        setCurrentPlayingId(id);
        setIsPlaying(true);
        await newSound.playAsync();
        newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
            if (status.isLoaded) {
                const remaining = duration - status.positionMillis;
                setRemainingTime(remaining);
                if (status.didJustFinish) {
                  setIsPlaying(false);
                  setCurrentPlayingId(null);
                  setRemainingTime(null);
                }
              }
        });
    }
  };

  const deleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((recording) => recording.id !== id));
  };

  const convertUriToFile = async (uri: string) => {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      console.log("File exists. URI: ", uri);
      const fileData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // console.log("File data: " + fileData);
      return fileData;
    }
    console.log("File not found for conversion.");
    return null;
  };

  const sendAudioToOpenAI = async (audioBase64: string) => {
    const apiKey = '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';
    const url = 'https://api.openai.com/v1/audio/transcriptions';
    // console.log("Sending audio to OpenAI... ", audioBase64);

    const file = {
      uri: `data:audio/m4a;base64,${audioBase64}`,
      name: 'audio.m4a',
      type: 'audio/m4a',
    };
    
    const formData = new FormData();
    formData.append('file', file as any); // Append the audio file
    formData.append('model', 'whisper-1'); // Specify the model

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData, // Use FormData as the body
      });
  
      const result = await response.json();
      // console.log("Response from OpenAI:");
      // console.log(result);
  
      if (result.error) {
        console.error("Error from OpenAI:", result.error);
      } else {
        // console.log('Transcription:', result.text);
        return result.text; // Return the transcribed text
      }
    } catch (error) {
      console.error("Failed to send audio to OpenAI:", error);
    }
  
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //   },
    //   body: formData, // Use FormData as the body
    // });
  
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     file: audioBase64,
    //     model: 'whisper-1', // Use the Whisper model
    //   }),
    // });

    // const result = await response.json();
    // console.log("resposne for openapi: " );
    // console.log(result);
    // return result.text; // Transcribed text
  };

  const uploadRecording = async (uri: string, id: string) => {
    if(sound){
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    }

    // set is uploading for spinner
    setIsUploading(true); 
    setCurrentUploadingId(id);

    const audioBase64 = await convertUriToFile(uri);
    if (audioBase64) {
      const transcription = await sendAudioToOpenAI(audioBase64);
      console.log('Transcription:', transcription);
      const extractedExpesneData = await sendTextForExtraction(transcription);
      console.log('Extracted Expanse Data:', extractedExpesneData.expenses);  
      console.log('Extracted Expanse Data length:', extractedExpesneData.expenses.length);  
      
      if (extractedExpesneData.expenses.length > 0) {
        console.log('Adding new expenses to the shared state...');
        const newExpenses = extractedExpesneData.expenses.map((expense: { item: string; price: string; }) => ({
          id: uuidv4(),
          item: expense.item,
          price: Number(expense.price.replace('$', '')), // Remove '$' and convert to number
          date: new Date().toLocaleDateString(),
        }));
        console.log('New Expenses:');
        console.log(newExpenses);
  
        // addExpense(newExpenses); // Add new expenses to the shared state
        newExpenses.forEach((expense: { id: string; item: string; price: number; date: string; }) => addExpense(expense));

        setIsUploading(false); // Stop uploading spinner
        setCurrentUploadingId(null);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Audio data extracted successfully! Viiew table for results',
        });

      } else {
        setIsUploading(false);
        setCurrentUploadingId(null);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No expense data found.',
        });
        console.log('No expense data found.');
      }

    }else{
      setIsUploading(false); // Stop uploading spinner
      setCurrentUploadingId(null);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to convert audio file.',
      });
    }
    // console.log("Audio Base64:", audioBase64);
  }

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderRecording = ({ item }: { item: Recording }) => (
    <TouchableOpacity style={styles.recordingItem} onPress={() => playSound(item.uri, item.id, item.duration)}>
      {/* Play Button */}
      { isPlaying && currentPlayingId===item.id ?
      <MaterialIcons name="pause-circle-filled" size={40} color="#2196F3" /> :
      <MaterialIcons name="play-circle-filled" size={40} color="#2196F3" />
      }
  
      {/* Recording Info (Mic Icon and Duration) */}
      <View style={styles.recordingInfo}>
        <MaterialIcons name="mic" size={24} color="#666" />
        <View style={styles.durationContainer}>
          <MaterialIcons name="access-time" size={16} color="#666" />
          <Text>{formatDuration(remainingTime !== null && currentPlayingId===item.id  ? remainingTime : item.duration)}</Text>
        </View>
      </View>

     {/* upload Button */}
     <TouchableOpacity
        onPress={() => uploadRecording(item.uri, item.id)}
        style={styles.uploadButton}
        disabled = {isUploading}
      >
        { isUploading && currentUploadingId === item.id? 
        <ActivityIndicator size={25} color="#2196F3" /> 
         :
         <MaterialIcons name="upload" size={25} color="#2196F3" /> 
        }
      </TouchableOpacity> 
  
      {/* Delete Button */}
      <TouchableOpacity
        onPress={() => deleteRecording(item.id)}
        style={styles.deleteButton}
      >
        <MaterialIcons name="delete" size={24} color="#f44336" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        renderItem={renderRecording}
        keyExtractor={item => item.id}
        style={styles.recordingsList}
      />
      
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording ? styles.recordingActive : null
        ]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <MaterialIcons
          name={isRecording ? "stop" : "mic"}
          size={32}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  recordingsList: {
    width: '100%',
    marginBottom: 80,
    marginTop: 50,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginVertical: 5,
  },
  recordingInfo: {
    marginLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  recordButton: {
    position: 'absolute',
    bottom: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingActive: {
    backgroundColor: '#f44336',
  },
  deleteButton: {
    padding: 10,
  },
  uploadButton: {
    marginLeft: 'auto', // Pushes the delete button to the right
    paddingHorizontal: 10,
    paddingTop: 1.5,
  },
});

export default AudioComponentSecondary;