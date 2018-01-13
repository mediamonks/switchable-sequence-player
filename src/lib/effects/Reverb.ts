export default class Reverb {
  public input: GainNode;
  public output: GainNode;

  private dry: GainNode;
  private wet: GainNode;
  private convolver: ConvolverNode;

  constructor(context: AudioContext) {
    // create nodes
    this.input = context.createGain();
    this.output = context.createGain();
    this.dry = context.createGain();
    this.wet = context.createGain();
    this.convolver = context.createConvolver();

    // connect
    this.input.connect(this.convolver);
    this.input.connect(this.dry);
    this.convolver.connect(this.wet);
    this.dry.connect(this.output);
    this.wet.connect(this.output);

    // init dry/wet
    this.setWet(0);
  }

  public setImpulse(impulse: AudioBuffer): void {
    this.convolver.buffer = impulse;
  }

  public setWet(value: number): void {
    this.wet.gain.setValueAtTime(value, 0);
    this.dry.gain.setValueAtTime(1 - value, 0);
  }
}
