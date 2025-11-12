import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";

export default function HomeScreen({ navigation }) {
  const [lastPlayed, setLastPlayed] = useState(null);
  const [playlistCount, setPlaylistCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadLastPlayed();
      loadPlaylistCount();
    }, [])
  );

  const loadLastPlayed = async () => {
    try {
      const stored = await AsyncStorage.getItem("lastPlayed");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the parsed data
        if (parsed && parsed.id && parsed.name && parsed.uri) {
          setLastPlayed(parsed);
        } else {
          // Clear invalid data
          await AsyncStorage.removeItem("lastPlayed");
          setLastPlayed(null);
        }
      }
    } catch (error) {
      console.error("Error loading last played:", error);
      // Clear corrupted data
      await AsyncStorage.removeItem("lastPlayed");
      setLastPlayed(null);
    }
  };

  const loadPlaylistCount = async () => {
    try {
      const stored = await AsyncStorage.getItem("playlist");
      if (stored) {
        const playlist = JSON.parse(stored);
        // Validate playlist is an array
        if (Array.isArray(playlist)) {
          setPlaylistCount(playlist.length);
        } else {
          // Reset corrupted playlist
          await AsyncStorage.setItem("playlist", JSON.stringify([]));
          setPlaylistCount(0);
        }
      } else {
        setPlaylistCount(0);
      }
    } catch (error) {
      console.error("Error loading playlist count:", error);
      setPlaylistCount(0);
    }
  };

  const addLocalSong = async () => {
    // Prevent multiple simultaneous file picks
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true, // Ensure file is accessible
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];

      // Validate file
      if (!file.uri || !file.name) {
        Toast.show({
          type: "error",
          text1: "Invalid file",
          text2: "The selected file could not be loaded.",
        });
        setIsLoading(false);
        return;
      }

      // Check file size (optional: limit to 100MB)
      if (file.size && file.size > 100 * 1024 * 1024) {
        Toast.show({
          type: "error",
          text1: "File too large",
          text2: "Please select a file smaller than 100MB.",
        });
        setIsLoading(false);
        return;
      }

      const newSong = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        uri: file.uri,
        dateAdded: new Date().toISOString(),
      };

      // Save song to AsyncStorage playlist
      const stored = await AsyncStorage.getItem("playlist");
      let playlist = [];
      
      if (stored) {
        try {
          playlist = JSON.parse(stored);
          if (!Array.isArray(playlist)) {
            playlist = [];
          }
        } catch (e) {
          console.error("Corrupted playlist, resetting:", e);
          playlist = [];
        }
      }

      // Check for duplicates
      const isDuplicate = playlist.some(song => song.uri === newSong.uri);
      if (isDuplicate) {
        Toast.show({
          type: "info",
          text1: "Song already exists",
          text2: "This song is already in your playlist.",
        });
        setIsLoading(false);
        return;
      }

      playlist.push(newSong);
      await AsyncStorage.setItem("playlist", JSON.stringify(playlist));

      // Save as last played
      await AsyncStorage.setItem("lastPlayed", JSON.stringify(newSong));
      
      setLastPlayed(newSong);
      setPlaylistCount(playlist.length);
      
      Toast.show({
        type: "success",
        text1: "Song added",
        text2: `${newSong.name} has been added to your playlist.`,
      });
    } catch (error) {
      console.error("Error adding song:", error);
      Toast.show({
        type: "error",
        text1: "Error adding song",
        text2: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToPlayer = () => {
    if (lastPlayed && lastPlayed.uri) {
      navigation.navigate("Player", {
        song: lastPlayed,
      });
    } else {
      Toast.show({
        type: "info",
        text1: "No song to play",
        text2: "Add a song first to start playing.",
      });
    }
  };

  return (
    <LinearGradient
      colors={["#1E1E1E", "#0D0D0D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{playlistCount}</Text>
          <Text style={styles.statLabel}>Songs</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={addLocalSong}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "⏳ Loading..." : "➕ Add Local Song"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate("Playlist")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>🎵 View Playlist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.playerButton]}
          onPress={goToPlayer}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>▶️ Go to Player</Text>
        </TouchableOpacity>
      </View>

      {lastPlayed && (
        <View style={styles.lastPlayedContainer}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
          <TouchableOpacity
            style={styles.songCard}
            onPress={() =>
              navigation.navigate("Player", {
                song: lastPlayed,
              })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.songName} numberOfLines={2}>
              {lastPlayed.name}
            </Text>
            <Text style={styles.tapToPlay}>Tap to play →</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 80,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    color: "#1DB954",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 10,
  },
  statsContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  statCard: {
    backgroundColor: "#1f1f1f",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    minWidth: 120,
  },
  statNumber: {
    color: "#1DB954",
    fontSize: 36,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 5,
  },
  buttonsContainer: {
    alignItems: "center",
    gap: 15,
  },
  button: {
    backgroundColor: "#1DB954",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: "85%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    backgroundColor: "#1f1f1f",
  },
  playerButton: {
    backgroundColor: "#1E90FF",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  lastPlayedContainer: {
    marginTop: 20,
    backgroundColor: "#1f1f1f",
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  songCard: {
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#1DB954",
  },
  songName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  tapToPlay: {
    color: "#1DB954",
    fontSize: 12,
    marginTop: 6,
  },
});