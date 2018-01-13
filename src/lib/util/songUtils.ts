import { IInstrument } from '../interface/IIinstrument';
import ISequence from '../interface/ISequence';
import ISongPart, { IUnprocessedSongPart } from '../interface/ISongPart';
import MusicTime from '../MusicTime';

export function getSequenceForSongPartAndInstrument(
  songPart: ISongPart,
  instrument: IInstrument,
): ISequence {
  const sequences = songPart.sequencesByInstrumentId[instrument.id];

  if (!sequences || sequences.length === 0) {
    // tslint:disable-next-line
    console.warn('No sequences found for instrument', instrument, songPart.id);
    return null;
  }

  // there can be more sequences, the first one is always the default one
  return sequences[0];
}

/**
 * Converts simple json to create actual song-data object.
 * @param {IUnprocessedSongPart[]} items
 * @param {ISequence[]} sequences
 * @returns {ISongPart[]}
 */
export function createSongParts(
  data: IUnprocessedSongPart[],
  sequences: ISequence[],
  bpm: number,
): ISongPart[] {
  // create new list of song
  const songParts: ISongPart[] = [];

  data.forEach(entry => {
    // create new songpart
    const songPart: ISongPart = {
      startTime: -1,
      id: entry.id,
      length: MusicTime.fromString(entry.length).toTime(bpm),
      sequencesByInstrumentId: {},
    };

    // add to list
    songParts.push(songPart);

    // init hashmap (so we have quick access tio each instrument)
    songPart.sequencesByInstrumentId = {};

    // loop through instruments
    Object.keys(entry.sequenceIdsByInstrumentId).forEach(instrumentKey => {
      // get sequences for instrument
      const sequenceIds = entry.sequenceIdsByInstrumentId[instrumentKey];
      if (sequenceIds.length === 0) {
        // tslint:disable-next-line
        console.error('No sequence ids defined for songPart', entry.id);
      } else {
        // look up each sequence
        sequenceIds.forEach(sequenceId => {
          const match: ISequence = sequences.find(sequence => sequence.id === sequenceId);

          // and add to hashmap (each instrument can have a list of sequences)
          if (match) {
            // sequences are tied to an instrument, so it should match
            if (match.instrumentId === instrumentKey) {
              if (!songPart.sequencesByInstrumentId[instrumentKey]) {
                songPart.sequencesByInstrumentId[instrumentKey] = [];
              }

              songPart.sequencesByInstrumentId[instrumentKey].push(match);
            } else {
              console.error(
                `Sequence ${match.id} assigned to incorrect instrument in songPart ${songPart.id}`,
              );
            }
          } else {
            // tslint:disable-next-line
            console.error('No sequence found with id', sequenceId);
          }
        });
      }
    });
  });

  return songParts;
}

/**
 * Returns a hashmap with each instrumentId as key, and a sequence as its value.
 * @param allInstruments
 * @param songPart
 */
export function getSequenceByInstrumentHashmap(
  allInstruments: IInstrument[],
  songPart: ISongPart,
): { [instrumentId: string]: ISequence } {
  return allInstruments.reduce((acc, instrument) => {
    acc[instrument.id] = songPart
      ? getSequenceForSongPartAndInstrument(songPart, instrument)
      : null;
    return acc;
  }, {});
}
