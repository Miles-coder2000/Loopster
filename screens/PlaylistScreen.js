import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  RefreshControl 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

export default function PlaylistScreen({ navigation }) {
  const [playlist, setPlaylist] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // This hook runs every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSongs();
    }, [])
  );

  const loadSongs = async () => {
    try {
      const stored = await AsyncStorage.getItem("playlist");
      if (stored) {
        const songs = JSON.parse(stored);
        
        // Validate playlist structure
        if (Array.isArray(songs)) {
          // Filter out any invalid songs
          const validSongs = songs.filter(song => 
            song && 
            song.id && 
            song.name && 
            song.uri
          );
          
          if (validSongs.length !== songs.length) {
            // Some songs were invalid, save cleaned playlist
            await AsyncStorage.setItem("playlist", JSON.stringify(validSongs));
            Toast.show({
              type: "info",
              text1: "Playlist cleaned",
              text2: "Removed invalid songs",
            });
          }
          
          setPlaylist(validSongs);
        } else {
          // Corrupted playlist, reset
          await AsyncStorage.setItem("playlist", JSON.stringify([]));
          setPlaylist([]);
        }
      } else {
        setPlaylist([]);
      }
    } catch (error) {
      console.error("Error loading playlist:", error);
      Toast.show({
        type: "error",
        text1: "Error loading playlist",
        text2: "Could not load your songs",
      });
      setPlaylist([]);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadSongs();
    setIsRefreshing(false);
  };

  const playSong = async (song, index) => {
    if (!song || !song.uri) {
      Toast.show({
        type: "error",
        text1: "Invalid song",
        text2: "This song cannot be played",
      });
      return;
    }

    // Update last played
    try {
      await AsyncStorage.setItem("lastPlayed", JSON.stringify(song));
    } catch (error) {
      console.error("Error saving last played:", error);
    }

    navigation.navigate("Player", {
      song: song,
      playlist: playlist,
      currentIndex: index,
    });
  };

  const deleteSong = (song) => {
    if (isDeleting) return; // Prevent multiple deletions

    Alert.alert(
      "Delete Song",
      `Are you sure you want to remove "${song.name}" from your playlist?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(song.id),
        },
      ]
    );
  };

  const confirmDelete = async (id) => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      const updatedPlaylist = playlist.filter((song) => song.id !== id);
      await AsyncStorage.setItem("playlist", JSON.stringify(updatedPlaylist));
      
      // Check if deleted song was last played
      const lastPlayedStored = await AsyncStorage.getItem("lastPlayed");
      if (lastPlayedStored) {
        const lastPlayed = JSON.parse(lastPlayedStored);
        if (lastPlayed.id === id) {
          // Set new last played or clear it
          if (updatedPlaylist.length > 0) {
            await AsyncStorage.setItem("lastPlayed", JSON.stringify(updatedPlaylist[0]));
          } else {
            await AsyncStorage.removeItem("lastPlayed");
          }
        }
      }
      
      setPlaylist(updatedPlaylist);
      
      Toast.show({
        type: "success",
        text1: "Song removed",
        text2: "Song has been removed from playlist",
      });
    } catch (error) {
      console.error("Error deleting song:", error);
      Toast.show({
        type: "error",
        text1: "Error deleting song",
        text2: "Could not remove the song",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const clearAllSongs = () => {
    if (playlist.length === 0) return;

    Alert.alert(
      "Clear Playlist",
      "Are you sure you want to remove all songs from your playlist?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.setItem("playlist", JSON.stringify([]));
              await AsyncStorage.removeItem("lastPlayed");
              setPlaylist([]);
              
              Toast.show({
                type: "success",
                text1: "Playlist cleared",
                text2: "All songs have been removed",
              });
            } catch (error) {
              console.error("Error clearing playlist:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Could not clear playlist",
              });
            }
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="musical-notes-outline" size={80} color="#333" />
      <Text style={styles.emptyTitle}>No songs yet</Text>
      <Text style={styles.emptyText}>
        Add songs from the Home screen to start building your playlist
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("Home")}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSongItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.songCard}
      onPress={() => playSong(item, index)}
      activeOpacity={0.7}
      disabled={isDeleting}
    >
      <View style={styles.songInfo}>
        <View style={styles.iconContainer}>
          <Ionicons name="musical-note" size={24} color="#1DB954" />
        </View>
        <View style={styles.songTextContainer}>
          <Text style={styles.songName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.songSubtext}>Local File</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => deleteSong(item)}
        style={styles.deleteButton}
        disabled={isDeleting}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="trash-outline" 
          size={22} 
          color={isDeleting ? "#666" : "#ff4444"} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#0D0D0D", "#1E1E1E"]} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Playlist</Text>
          <Text style={styles.subtitle}>
            {playlist.length} {playlist.length === 1 ? "song" : "songs"}
          </Text>
        </View>
        
        {playlist.length > 0 && (
          <TouchableOpacity 
            onPress={clearAllSongs}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-bin-outline" size={20} color="#ff4444" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {playlist.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={playlist}
          keyExtractor={(item, index) => item.id || `song-${index}`}
          renderItem={renderSongItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#1DB954"
              colors={["#1DB954"]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 14,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1f1f1f",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  clearButtonText: {
    color: "#ff4444",
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptyText: {
    color: "#999",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 30,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  songCard: {
    backgroundColor: "#1f1f1f",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  separator: {
    height: 8,
  },
  songInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  songTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  songName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  songSubtext: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
});