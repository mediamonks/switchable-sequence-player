import ISequence from '../interface/ISequence';

export interface ISongPart {
  startTime: number; // the moment (songTime) this part started playing. only for current ones (otherwise -1)
  id: string;
  length: number; // length in seconds
  sequencesByInstrumentId?: { [instrument: string]: ISequence[] };
}
export default ISongPart;

export interface IUnprocessedSongPart {
  id: string;
  length: string;
  sequenceIdsByInstrumentId: { [instrument: string]: string[] };
}
