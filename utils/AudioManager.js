// utils/AudioManager.js
// simple singleton to manage one Audio.Sound at a time
import { Audio } from 'expo-av';

class AudioManager {
  sound = null;
  statusCallback = null;

  async play(track, statusCallback) {
    try {
      // unload previous
      if (this.sound) {
        try { await this.sound.unloadAsync(); } catch (e) { /* ignore */ }
        this.sound = null;
      }

      // create new sound
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true },
        (s) => {
          if (statusCallback) statusCallback(s);
        }
      );
      this.sound = sound;
      this.statusCallback = statusCallback;
      return status;
    } catch (e) {
      console.log('AudioManager.play error', e);
      throw e;
    }
  }

  async pause() {
    if (this.sound) await this.sound.pauseAsync();
  }

  async resume() {
    if (this.sound) await this.sound.playAsync();
  }

  async stop() {
    if (this.sound) {
      await this.sound.stopAsync();
      try { await this.sound.unloadAsync(); } catch {}
      this.sound = null;
    }
  }

  async seekTo(millis) {
    if (this.sound) await this.sound.setPositionAsync(millis);
  }

  async getStatus() {
    if (!this.sound) return null;
    return await this.sound.getStatusAsync();
  }
}

export default new AudioManager();
