// context/PlaylistContext.js
import React, { createContext, useState } from 'react';

export const PlaylistContext = createContext();

export const PlaylistProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);       // array of {id,name,uri}
  const [lastPlayed, setLastPlayed] = useState(null); // single song object
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addSong = (song) => {
    if (!song?.uri) return false;
    const exists = playlist.some((p) => p.uri === song.uri);
    if (exists) return false;
    setPlaylist((p) => [song, ...p]);
    return true;
  };

  const clearPlaylist = () => setPlaylist([]);

  return (
    <PlaylistContext.Provider value={{
      playlist,
      setPlaylist,
      lastPlayed,
      setLastPlayed,
      addSong,
      clearPlaylist,
      currentIndex,
      setCurrentIndex,
    }}>
      {children}
    </PlaylistContext.Provider>
  );
};
