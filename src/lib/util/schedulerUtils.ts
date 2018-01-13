import { ILastScheduledData, INote } from '../interface/ISequence';
import ISongPart from '../interface/ISongPart';

/**
 * Gets a list of notes in the given time-window.
 * @param {number} bpm
 * @param {ISongPart} currentSongPart
 * @param {ISongPart} nextSongPart
 * @param {string} instrument
 * @param {number} windowStart
 * @param {number} windowEnd
 * @returns {INoteScheduleData[]}
 */

/**
 * Ties a note to a combination of songPart/songPartIteration for which it needs to be scheduled
 */
export interface INoteScheduleData {
  note: INote;
  noteSongTime: number;
  songPart: ISongPart;
  songPartIteration: number;
}

export function lastScheduleDataToString(data: ILastScheduledData): string {
  return data
    ? Object.keys(data)
        .map(key => key + ':' + data[key])
        .join(',')
    : '---';
}

export function clearNoteScheduleDataForSongPart(songPart: ISongPart): void {
  Object.keys(songPart.sequencesByInstrumentId).forEach(instrumentIdKey => {
    songPart.sequencesByInstrumentId[instrumentIdKey].forEach(sequence => {
      sequence.notes.forEach(note => {
        if (note.lastScheduledData) {
          delete note.lastScheduledData[songPart.id];
        }
      });
    });
  });
}
