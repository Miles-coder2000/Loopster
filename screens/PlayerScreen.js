import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

// Global reference to track current sound across all PlayerScreen instances
let globalSound = null;

export default function PlayerScreen({ route, navigation }) {
  const { song } = route.params || {};
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const positionRef = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (song?.uri) {
      setupAudio();
      loadSong(song.uri);
    } else {
      Toast.show({ 
        type: "error", 
        text1: "Missing song file", 
        text2: "Cannot find audio source." 
      });
    }

    // Cleanup function
    return () => {
      isMounted.current = false;
      // Only unload if this component's sound is the global one
      if (sound && sound === globalSound) {
        sound.unloadAsync();
        globalSound = null;
      }
    };
  }, [song?.uri]);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error("Audio setup failed:", error);
    }
  };

  const loadSong = async (uri) => {
    try {
      setIsLoading(true);
      
      // Stop and unload any previously playing sound
      if (globalSound) {
        try {
          await globalSound.stopAsync();
          await globalSound.unloadAsync();
        } catch (error) {
          console.log("Error unloading previous sound:", error);
        }
        globalSound = null;
      }

      // Create new sound instance
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      // Update both local and global references
      globalSound = newSound;
      setSound(newSound);
      setIsLoading(false);
      
      Toast.show({ 
        type: "info", 
        text1: "Now playing", 
        text2: song.name 
      });
    } catch (error) {
      console.error("Error loading audio:", error);
      Toast.show({ 
        type: "error", 
        text1: "Error loading audio", 
        text2: error.message 
      });
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (!isMounted.current) return;

    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
      positionRef.current = status.positionMillis;

      if (status.didJustFinish) {
        setIsPlaying(false);
        if (sound) {
          sound.setPositionAsync(0);
        }
        Toast.show({ 
          type: "success", 
          text1: "Playback finished" 
        });
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        Toast.show({ 
          type: "info", 
          text1: "Paused" 
        });
      } else {
        await sound.playAsync();
        Toast.show({ 
          type: "info", 
          text1: "Playing" 
        });
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  const handleSeek = async (value) => {
    try {
      if (sound) {
        await sound.setPositionAsync(value);
      }
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  const skipForward = async () => {
    if (sound && duration) {
      const newPos = Math.min(positionRef.current + 10000, duration);
      await sound.setPositionAsync(newPos);
    }
  };

  const skipBackward = async () => {
    if (sound) {
      const newPos = Math.max(positionRef.current - 10000, 0);
      await sound.setPositionAsync(newPos);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <LinearGradient colors={["#121212", "#000000"]} style={styles.container}>
      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <Image
          source={require("../assets/Logo.png")}
          style={styles.artwork}
          resizeMode="contain"
        />
      </View>

      {/* Track Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {song?.name || "Unknown Track"}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          Local File
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#404040"
          thumbTintColor="#1DB954"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={skipBackward} style={styles.controlButton}>
          <Ionicons name="play-back" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          style={styles.playButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.loadingText}>...</Text>
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={40}
              color="#000"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={skipForward} style={styles.controlButton}>
          <Ionicons name="play-forward" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  artworkContainer: {
    width: 300,
    height: 300,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 40,
    elevation: 10,
  },
  artwork: { 
    width: "100%", 
    height: "100%" 
  },
  infoContainer: { 
    alignItems: "center", 
    marginBottom: 30 
  },
  title: { 
    color: "#fff", 
    fontSize: 22, 
    fontWeight: "bold" 
  },
  artist: { 
    color: "#aaa", 
    fontSize: 16, 
    marginTop: 5 
  },
  progressContainer: { 
    width: "100%", 
    marginBottom: 20 
  },
  slider: { 
    width: "100%", 
    height: 40 
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  timeText: { 
    color: "#aaa", 
    fontSize: 12 
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginBottom: 30,
  },
  controlButton: { 
    padding: 10 
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { 
    color: "#000", 
    fontSize: 20, 
    fontWeight: "bold" 
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },
  backText: { 
    color: "#fff", 
    fontSize: 14 
  },
});