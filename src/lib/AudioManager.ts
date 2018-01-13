import Scheduler from './Scheduler';
import SamplePlayer from './SamplePlayer';

export class AudioManager {
  public context: AudioContext;
  public gain: GainNode;
  public hasWebAudio: boolean;
  public scheduler: Scheduler;
  public samplePlayer: SamplePlayer;
  public bpm: number;

  constructor() {
    this.hasWebAudio = window['AudioContext'] !== void 0;

    if (this.hasWebAudio) {
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.connect(this.context.destination);

      this.samplePlayer = new SamplePlayer(this.context);
      this.scheduler = new Scheduler(this.context, this.samplePlayer);
    }
  }
}
