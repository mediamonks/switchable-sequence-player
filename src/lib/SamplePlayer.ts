import { ISample } from './interface/ISample';
import { INoteScheduleData } from './util/schedulerUtils';

export default class SamplePlayer {
  private context: AudioContext;
  public samples: ISample[] = [];
  public scheduledSamples: IScheduledSample[] = [];

  constructor(context: AudioContext) {
    this.context = context;
  }

  public playSample(
    noteScheduleData: INoteScheduleData,
    playStartTime: number,
    connectTo: AudioNode,
  ): void {
    // todo create hashmap for quick access
    const sample = this.samples.find(sample => sample.id === noteScheduleData.note.sampleId);

    // console.log(noteScheduleData);
    if (sample && sample.audioBuffer) {
      const gain = this.context.createGain();
      const bufferSource = this.context.createBufferSource();

      bufferSource.buffer = sample.audioBuffer;

      bufferSource.connect(gain);
      gain.connect(connectTo);

      bufferSource.start(noteScheduleData.noteSongTime + playStartTime);

      const scheduledSample: IScheduledSample = {
        noteScheduleData,
        bufferSource,
      };

      // remove entry todo test if slice is faster?
      bufferSource.onended = () => {
        this.scheduledSamples = this.scheduledSamples.filter(data => data !== scheduledSample);
      };

      this.scheduledSamples.push(scheduledSample);
    } else {
      console.warn('Sample not found or not loaded', noteScheduleData.note.sampleId);
    }
  }

  public stopAll(): void {
    this.scheduledSamples.forEach(data => {
      data.bufferSource.stop(0);
    });
  }
}

export interface IScheduledSample {
  bufferSource: AudioBufferSourceNode;
  noteScheduleData: INoteScheduleData;
}
