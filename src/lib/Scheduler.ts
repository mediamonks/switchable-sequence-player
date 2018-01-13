import EventDispatcher from 'seng-event/lib/EventDispatcher';
import ISongPart from './interface/ISongPart';
// import AnimationFrame from 'util/AnimationFrame';
import AnimationFrame from './util/AnimationFrame';
import {
  clearNoteScheduleDataForSongPart,
  INoteScheduleData,
  lastScheduleDataToString,
} from './util/schedulerUtils';
import { getSequenceForSongPartAndInstrument } from './util/songUtils';
import { IInstrument } from './interface/IIinstrument';
import SamplePlayer from './SamplePlayer';
import MusicTime from './MusicTime';
import SchedulerEvent from './event/SchedulerEvent';

export default class Scheduler extends EventDispatcher {
  public bpm = -1;
  public samplePlayer: SamplePlayer;
  public instruments: IInstrument[] = [];
  public songParts: ISongPart[] = [];
  public timeData: ISchedulerTimeData;

  private currentPart: ISongPart;
  private nextPart: ISongPart;
  private context: AudioContext;
  private playStartTime: number;
  public lookAheadTime = 1.5;
  private scheduleInterval = 1;
  private scheduleIntervalId: number;
  private timeDataUpdater: AnimationFrame;
  private isPlaying: boolean = false;
  private lastScheduleTimes: number[] = [];

  constructor(context: AudioContext, samplePlayer: SamplePlayer) {
    super();

    this.context = context;
    this.samplePlayer = samplePlayer;

    this.timeDataUpdater = new AnimationFrame(() => {
      this.updateTimeData();
    });
  }

  /**
   * Starts the song with the given songPart. Schedule can be run once for dev-purposes.
   * @param {string} songPartId
   * @param {boolean} doOneSchedule
   */
  public start(songPartId: string, doOneSchedule: boolean = false): void {
    if (this.isPlaying) {
      console.error('Already playing');
      return;
    }

    const songPart = this.songParts.find(songPart => songPart.id === songPartId);
    if (!songPart) {
      console.error('No songPart found with id', songPartId);
      return;
    }

    this.isPlaying = true;

    // set time that we started
    this.playStartTime = this.context.currentTime;

    songPart.startTime = 0;
    this.currentPart = songPart;

    // start scheduling
    if (!doOneSchedule) {
      this.scheduleIntervalId = window.setInterval(() => {
        this.schedule(this.getSongPlayTime());
      }, this.scheduleInterval * 1000);
    }

    this.timeDataUpdater.start();

    // and do a schedule
    this.schedule(0);

    this.dispatchEvent(new SchedulerEvent(SchedulerEvent.PLAY_START));
  }

  public stop(): void {
    this.timeDataUpdater.stop();

    clearInterval(this.scheduleIntervalId);

    this.resetAllNoteScheduleData();

    this.isPlaying = false;

    this.samplePlayer.stopAll();

    this.dispatchEvent(new SchedulerEvent(SchedulerEvent.PLAY_STOP));
  }

  public getSongPlayTime(): number {
    return this.context.currentTime - this.playStartTime;
  }

  public setNextSongPart(songPart: ISongPart): void {
    if (songPart === this.currentPart) {
      console.error("Cannot set nextPart when it's equal to the current one");
      return;
    }

    if (this.nextPart) {
      // todo this should be possible in some cases
      console.error('Already a next part set');
      return;
    }

    if (!songPart) {
      // todo this should be possible in some cases
      console.error('No songPart given');
      return;
    }

    songPart.startTime = -1; // will get a correct startTime when it's processed
    this.nextPart = songPart;
  }

  private updateTimeData(): void {
    const playTime = this.getSongPlayTime();

    this.checkForSongPartSwap(playTime);

    const currentPartPlayedTime = playTime - this.currentPart.startTime;
    const currentPartLoops = currentPartPlayedTime / this.currentPart.length;

    this.timeData = {
      playTime,
      currentPart: this.currentPart,
      nextPart: this.nextPart,
      playMusicTime: MusicTime.fromTime(playTime, this.bpm).toString(),
      currentPartIteration: Math.floor(currentPartLoops),
      currentPartProgress: currentPartLoops % 1,
      lookAheadTime: this.lookAheadTime,
      lastScheduleTimes: this.lastScheduleTimes,
    };
  }

  public testSchedule(
    time: number,
    currentPartId: string,
    currentPartStartTime: number,
    nextPartId?: string,
  ): void {
    const currentPart = this.songParts.find(part => part.id === currentPartId);

    if (!currentPart) {
      console.error('Current part not found', currentPartId);
      return;
    }
    currentPart.startTime = currentPartStartTime;

    let nextPart;
    if (nextPartId) {
      nextPart = this.songParts.find(part => part.id === nextPartId);
      if (!nextPart) {
        console.error('Next part not found', nextPartId);
        return;
      }
    }

    this.currentPart = currentPart;
    this.nextPart = nextPart;

    this.schedule(time, true);
  }

  private resetAllNoteScheduleData() {
    this.songParts.forEach(songPart => {
      clearNoteScheduleDataForSongPart(songPart);
    });
  }

  private schedule(time: number, silent = false): void {
    console.log(`---- Schedule for time ${time} ----`);

    // keep track of last times we had a schedule (for dev purposes)
    this.lastScheduleTimes.push(time);
    while (this.lastScheduleTimes.length > 3) {
      this.lastScheduleTimes.shift();
    }

    this.checkForSongPartSwap(time);

    this.instruments.forEach(instrument => {
      // get a list of notes that fall in the look-ahead window
      const list: INoteScheduleData[] = this.getNotesInTimeWindow(time, instrument);

      list.forEach(noteScheduleData => {
        if (!silent) {
          this.samplePlayer.playSample(noteScheduleData, this.playStartTime, instrument.output);
        }
      });
    });
  }

  private checkForSongPartSwap(time: number): void {
    // first things we always need to do is check if there is a songPart queued (nextSongPart)
    // which has been processed by the scheduler (the songPart will have a startTime !== -1).
    // if that is the case, AND the current time is ahead of that time, we need to set it as the
    // currentPart. so: the actual switching of current/next parts is done by the scheduler and
    // on the schedule intervals. this means that the currentSongPart may not be the actual
    // current one in the beginning of a songPart, until a new schedule-call arrives.

    if (
      // there is a next part
      this.nextPart &&
      // things have been scheduled for it
      this.nextPart.startTime !== -1 &&
      // time is later thant currentPart end
      time >= this.nextPart.startTime
    ) {
      // swap
      console.log('swap');
      clearNoteScheduleDataForSongPart(this.currentPart);
      this.currentPart = this.nextPart;
      this.nextPart = null;
    }
  }

  /**
   * Returns a list of all notes in the lookahead window (with regards to the current time).
   * @param {number} currentTime
   * @param {IInstrument} instrument
   * @param {number} maxPartIterations
   * @returns {INoteScheduleData[]}
   */
  private getNotesInTimeWindow(
    currentTime: number,
    instrument: IInstrument,
    maxPartIterations = 10,
  ): INoteScheduleData[] {
    const results: INoteScheduleData[] = [];
    const windowEndTime = currentTime + this.lookAheadTime;

    // todo these initial values are done for each instrument again, can be more efficient
    let totalSongPartIterationCounter = 0; // just a safety check for prevent endless while loop
    let songPartIteration = Math.floor(
      (currentTime - this.currentPart.startTime) / this.currentPart.length,
    );

    // todo is this correct? happens if a schedule happens when the current start is ahead
    // (only possible atm through a custom test schedule)
    if (songPartIteration < 0) {
      songPartIteration = 0;
    }

    let songPart = this.currentPart;
    let hasSwitchedToNextPart = false;

    console.log(`Searching from ${currentTime} to ${windowEndTime} for ${instrument.id}`);
    while (totalSongPartIterationCounter < maxPartIterations) {
      // if we encounter a songPart which is not the current one (so nextSongPart)
      // we can consider this this songPart as 'accepted' and set its startTime
      // (without that we cannot know any timings)
      if (songPart !== this.currentPart && songPart.startTime === -1) {
        console.log(
          `%csetting startTime of ${songPart.id} to ${this.getCurrentPartEndTime(currentTime)}`,
          'color: orange',
        );
        songPart.startTime = this.getCurrentPartEndTime(currentTime);
      }

      // after this, songPart always has a startTime

      // check if we're too far ahead, based on when this songPart iteration starts
      const songPartIterationStartTime = songPart.startTime + songPartIteration * songPart.length;
      console.log(
        '\n',
        songPart.id,
        ': partStarted:',
        songPart.startTime,
        'iterationStarted:',
        songPartIterationStartTime,
        'partIteration:',
        songPartIteration,
        'partLength',
        songPart.length,
      );
      if (songPartIterationStartTime > windowEndTime) {
        console.log(`%c songpart too far ahead ${songPartIteration}`, 'color: red');
        break;
      }

      const sequence = getSequenceForSongPartAndInstrument(songPart, instrument);

      if (!sequence) {
        return [];
      }

      // todo: make this more efficient by stopping when we encounter a note that is
      // todo: too far ahead. for this we need the notes to be ordered in time (on init)
      sequence.notes.forEach(note => {
        const noteSongTime = note.time + songPartIterationStartTime;
        console.log(
          '  note: songtime:',
          noteSongTime,
          'time:',
          note.time,
          'part:',
          songPart.id,
          'schedules:',
          lastScheduleDataToString(note.lastScheduledData),
        );
        if (noteSongTime >= currentTime && noteSongTime < windowEndTime) {
          // note is in time window, now consider if we have scheduled it before

          if (!note.lastScheduledData) {
            note.lastScheduledData = {};
          }
          const songPartId = songPart.id;

          // if note has NOT been scheduled for this songpart before, set value to -1
          // (so it will be scheduled, and we can safely do a > comparison on iteration)
          if (note.lastScheduledData[songPartId] === void 0) {
            note.lastScheduledData[songPartId] = -1;
          }

          // check if we should schedule for this iteration (and this songpart)
          if (note.lastScheduledData[songPartId] < songPartIteration) {
            // update last scheduled iteration for songpart
            note.lastScheduledData[songPartId] = songPartIteration;

            // add to results
            results.push({
              note,
              noteSongTime,
              songPart,
              songPartIteration,
            });
            console.log(
              `%c  schedule note at ${noteSongTime} (lastScheduled: ${lastScheduleDataToString(
                note.lastScheduledData,
              )})`,
              'color: green',
            );
          } else {
            // already scheduled
            console.log('%c  already scheduled', 'color: red');
          }
        } else {
          // outside time window
          console.log('%c  outside window', 'color: red');
        }
      });

      // next loop, set correct songpart
      if (this.nextPart && !hasSwitchedToNextPart) {
        songPart = this.nextPart;
        songPartIteration = 0;
        hasSwitchedToNextPart = true; // so we wont reset songPartIteration
      } else {
        songPartIteration += 1;
      }

      totalSongPartIterationCounter += 1;
    }

    return results;
  }

  private getCurrentPartEndTime(currentTime: number): number {
    if (this.currentPart) {
      const partPlayingTime = currentTime - this.currentPart.startTime;
      const partIteration = Math.floor(partPlayingTime / this.currentPart.length);
      // return currentPart.startTime + ((partIteration + 1) * currentPart.length);
      return this.currentPart.startTime + (partIteration + 1) * this.currentPart.length;
    }

    console.error('No current part');
    return -1;
  }
}

export interface ISchedulerTimeData {
  currentPart: ISongPart;
  nextPart: ISongPart;
  playTime: number;
  playMusicTime: string;
  currentPartProgress: number;
  currentPartIteration: number;
  lookAheadTime: number;
  lastScheduleTimes: number[];
}
