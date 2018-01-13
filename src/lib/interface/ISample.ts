import MusicTime from '../MusicTime';

export interface ISample {
  id: string;
  fileName?: string;
  path?: string;
  audioBuffer?: AudioBuffer;
  length?: MusicTime;
  // id: string;
  extension?: string; // forces a certain extension (so we can load all mp3s, and still have a few wavs)
  // songPartId: SongPartId;
  // instrument: string;
}
