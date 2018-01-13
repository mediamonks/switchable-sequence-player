// import { AudioManager } from '../AudioManager';
// import { createSequences, unprocessedSequences } from '../data/sequences';
// import SchedulerEvent from '../event/SchedulerEvent';
import { IInstrument } from '../interface/IIinstrument';
import { ILoadProgress } from '../interface/ILoadProgress';
// import { createSongParts } from '../util/songUtils';
// import { unprocessedSongParts } from '../data/songParts';
// import Scheduler from '../Scheduler';
import { ISample } from '../interface/ISample';

/**
 * Loads a list of samples.
 * @param {Array<ISample>} samples
 * @param {string} extension
 * @param {string} samplesPath
 * @param {ILoadProgress} progress
 * @returns {Promise<Array<AudioBuffer>>}
 */
export function loadSamples(
  context: AudioContext,
  samples: Array<ISample>,
  extension: string,
  samplesPath: string,
  progress?: ILoadProgress,
): Promise<void[]> {
  if (progress) {
    progress.total = samples.length;
    progress.loaded = 0;
  }

  const loadPromises: Promise<void>[] = samples.map(sample =>
    loadSample(context, sample, sample.extension || extension, samplesPath, progress),
  );
  return Promise.all(loadPromises);
}

/**
 * Loads a sample
 * @param {ISample} sample
 * @param {string} extension
 * @param {string} samplesPath
 * @param {ILoadProgress} progress
 * @returns {Promise<AudioBuffer>}
 */
export function loadSample(
  context: AudioContext,
  sample: ISample,
  extension: string,
  samplesPath: string,
  progress?: ILoadProgress,
): Promise<void> {
  if (sample.audioBuffer) {
    return Promise.resolve();
  }

  // fixes for old createplayer, not all browsers seem to loop the create-samples correctly
  // if (audioManager.createPlayerWithoutLoops !== true && sample.data.create) {
  //   if(bowser.firefox) {
  //     extension = 'ogg';
  //   }
  //   // same for edge
  //   if(bowser.msedge) {
  //     extension = 'aac';
  //   }
  // }

  const url = samplesPath + (sample.path ? sample.path : '') + sample.id + '.' + extension;

  return loadAudioBuffer(context, url, progress).then(audioBuffer => {
    sample.audioBuffer = audioBuffer;
  });
}

/**
 * Loads and decodes an audio-file, resulting in an AudioBuffer.
 * @param {AudioContext} context
 * @param {string} url
 * @param {ILoadProgress} progress
 * @returns {Promise<AudioBuffer>}
 */
export function loadAudioBuffer(
  context: AudioContext,
  url: string,
  progress?: ILoadProgress,
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = () => {
      if (request.status === 200) {
        context.decodeAudioData(
          request.response,
          audioBuffer => {
            if (progress) {
              progress.loaded += 1;
              progress.update(progress.loaded / progress.total);
            }
            resolve(audioBuffer);
          },
          () => {
            // todo 1: maybe not retry when decoding fails?
            // todo 2: there still is an uncaught exception in the promise returned by decodeAudioData, would be nice to get rid of that
            // (at the moment i am not using that promise, since (i think) iOS uses an old
            // implementation of the decodeAudioData method (doesnt return a promise)
            reject('Failed to decode audio from: ' + url);
          },
        );
      } else {
        reject('Error loading: ' + url);
      }
    };

    request.onerror = () => {
      reject('Error loading: ' + url);
    };

    request.send();
  });
}

/**
 * Creates a list of instruments, each with a separate output. Outputs connect to
 * the context's destination, unless specified otherwise.
 * @param {string[]} ids
 * @param {AudioContext} context
 * @param {AudioNode} connectTo
 * @returns {IInstrument[]}
 */
export function createInstruments(
  ids: string[],
  context: AudioContext,
  connectTo?: AudioNode,
): IInstrument[] {
  return ids.map(id => {
    const output = context.createGain();
    output.connect(connectTo || context.destination);

    return {
      id,
      output,
    };
  });
}

// export function initAudio(bpm: number, audioManager: AudioManager, instrumentIds: string[]) {
//   audioManager.scheduler.bpm = bpm;
//   // audioManager.samplePlayer.samples = samples;
//   const instruments = createInstruments(instrumentIds, audioManager.context);
//   const sequences = createSequences(unprocessedSequences, bpm);
//   const songParts = createSongParts(unprocessedSongParts, sequences, bpm);
//
//   audioManager.scheduler.instruments = instruments;
//   audioManager.scheduler.songParts = songParts;
// }

// export function setupSchedulerStoreCommunication(scheduler: Scheduler, store: IStore) {
//   // listen to play-state changes from scheduler
//   scheduler.addEventListener(SchedulerEvent.PLAY_START, () => {
//     store.commit(songStore.mutations.setIsPlaying, true);
//   });
//   scheduler.addEventListener(SchedulerEvent.PLAY_STOP, () => {
//     store.commit(songStore.mutations.setIsPlaying, false);
//   });
// }
