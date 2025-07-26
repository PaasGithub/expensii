import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Button, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type RecordingType = {
    id: string;
    sound: Audio.Sound;
    duration: string;
    file: string | null;
};

const AudioComponent = () => {
    const [recording, setRecording] = useState<Recording>();
    const [isRecording, setIsRecording] = useState(false);
    const [recordings, setRecordings] = useState<RecordingType[]>([]);
    const [message, setMessage] = useState("");
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isLoading, setIsLoading] = useState(false);

    const startPulse = () => {
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
    };
    
    useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
        interval = setInterval(startPulse, 1000);
    }
    return () => clearInterval(interval);
    }, [isLoading]);
    

    //  start recoridng audio function
    const startRecording = async() => {
     
        // console.log("Record btn pressed!");
        try{
            setIsLoading(true);
            // get permission to use mic
            const permission = await Audio.requestPermissionsAsync();

            if(permission.status !== 'granted'){
                setMessage("Allow Microphone Access to App in Settings ")
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync( 
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
            

        }catch(Error){
            console.error('Failed to start recording', Error);
            setMessage('Failed to start recording. Please try again later.');
        }
    }

    // stop recoridng audio function
    const stopRecording = async () => {
      
        try {
            setIsLoading(false);
            if (!recording) {
                console.error("No recording in progress.");
                return;
            }
        
            // Stop and unload the recording
            await recording.stopAndUnloadAsync();

            // iOS may reroute audio playback to the phone earpiece when recording is allowed, so disable once finished.
            await Audio.setAudioModeAsync(
                {
                  allowsRecordingIOS: false,
                }
            );
            setRecording(undefined);
            setIsRecording(false);
        
            // Create a new sound object from the recording
            const { sound, status } = await recording.createNewLoadedSoundAsync();

            const durationMillis = status.isLoaded && typeof status.durationMillis === 'number' 
                ? status.durationMillis 
                : 0; // Default to 0 if undefined or not a number
            
            const duration = getDurationFormatted(durationMillis);
        
            // Update the recordings state with the new recording
            const updatedRecordings = [...recordings, {
                id: Date.now().toString(),
                sound: sound,
                duration: duration,
                file: recording.getURI()
            }];
        
            setRecordings(updatedRecordings);
      
        } catch (error) {
            console.error('Failed to stop recording', error);
            setMessage('Failed to stop recording. Please try again later.');
        }
    };

    const playRecording = async (sound: Audio.Sound) => {
        try {
          await sound.replayAsync();
        } catch (error) {
          console.error('Failed to play recording', error);
        }
    };
      
    // const deleteRecording = (index: number) => {
    //     const updatedRecordings = [...recordings];
    //     updatedRecordings.splice(index, 1);
    //     setRecordings(updatedRecordings);
    // };

    const deleteAudioRecording = (id: string) => {
        setRecordings((prev) => prev.filter((recording) => recording.id !== id));
      };

    function getDurationFormatted(millis: number) {
        const seconds = Math.floor(millis / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    const audioProcessig = () => {
        // send audio for transcription
        // send tp openai whisper fro transcription
        // send to nlp able api (eg deepseek, gpt3) to remove finances data
    };

    const renderRecording = ({ item }: { item: RecordingType }) => (
        <TouchableOpacity
          style={styles.recordingItem}
          onPress={() => playRecording(item.sound)}
        >
            <MaterialIcons 
                name="play-circle-filled" 
                size={40} 
                color="#2196F3"
            />
            <View style={styles.recordingInfo}>
                <MaterialIcons name="mic" size={24} color="#666" />
                <View style={styles.durationContainer}>
                <MaterialIcons name="access-time" size={16} color="#666" />
                <Text>{item.duration}</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => deleteAudioRecording(item.id)}
                style={styles.deleteButton}
            >
                <MaterialIcons name="delete" size={24} color="#f44336" />
            </TouchableOpacity>
        </TouchableOpacity>
      );

    return (
        <>

            <Text>{message}</Text>
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
            
            {/* <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Pressable 
                    
                    onPress = {recording ? stopRecording : startRecording}
                >
                   
                    { recording ?
                        <MaterialCommunityIcons name="stop-circle-outline" size={60}/>
                        :
                        <>
                            <MaterialCommunityIcons name="record-circle-outline" size={60}/>
                        </>
                    }

                   
                </Pressable>
            </Animated.View> */}

            {/* {recordings.map((rec, index) => (
                <View key={index}>
                <Text>Recording {index + 1} - Duration: {rec.duration}</Text>
                <Pressable onPress={() => playRecording(rec.sound)}>
                    <MaterialIcons name="play-circle-outline" size={40} />
                </Pressable>
                <Pressable onPress={() => deleteRecording(index)}>
                    <MaterialIcons name="delete" size={40} />
                </Pressable>
                </View>
            ))} */}

        </>
    )
}

export default AudioComponent;

const styles = StyleSheet.create({
    recordingsList: {
        width: '100%',
        marginBottom: 80,
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
        marginLeft: 'auto', // Pushes the delete button to the right
        padding: 10,
    },
});