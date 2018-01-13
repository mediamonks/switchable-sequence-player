class MusicTime {
  public static SPEED_MULTILPLIER = 1;

  public beatsPerBar: number;
  public sixteenthsPerBeat: number;
  public beats: number;
  public bars: number;
  public sixteenths: number;
  public static ZERO = new MusicTime(0, 0, 0);

  constructor(
    bars: number,
    beats: number,
    sixteenths: number,
    beatsPerBar: number = 4,
    sixteenthsPerBeat: number = 4,
  ) {
    this.bars = bars;
    this.beats = beats;
    this.sixteenths = sixteenths;
    this.beatsPerBar = beatsPerBar;
    this.sixteenthsPerBeat = sixteenthsPerBeat;

    this.normalize();
  }

  /**
   * Returns the time in seconds.
   * @param bpm
   * @returns {number}
   */
  public toTime(bpm: number): number {
    const beats =
      this.bars * this.beatsPerBar + this.beats + this.sixteenths / this.sixteenthsPerBeat;

    return beats * 60 / bpm / MusicTime.SPEED_MULTILPLIER;
  }

  /**
   * Makes sure the beats don't exceed the beatsPerBar, and the sixteenths don't exceed sixteenthsPerBeat.
   */
  public normalize(): void {
    const sixteenths = this.sixteenths % this.sixteenthsPerBeat;
    const beatsFromSixteenths = Math.floor(this.sixteenths / this.sixteenthsPerBeat);

    const beats = (this.beats + beatsFromSixteenths) % this.beatsPerBar;
    const barsFromBeats = Math.floor((this.beats + beatsFromSixteenths) / this.beatsPerBar);

    const bars = this.bars + barsFromBeats;

    this.sixteenths = sixteenths;
    this.beats = beats;
    this.bars = bars;
  }

  public clone(): MusicTime {
    return new MusicTime(this.bars, this.beats, this.sixteenths);
  }

  /**
   * Gets the time in sixteenths.
   * @returns {number}
   */
  public valueOf(): number {
    // todo fix bpb/bps
    return (
      this.sixteenths +
      this.sixteenthsPerBeat * this.beats +
      this.sixteenthsPerBeat * this.beatsPerBar * this.bars
    );
  }

  /**
   * Returns a more musically readable format (starts counting at 1 instead of 0).
   * @returns {string}
   */
  public toOneBasedString(): string {
    return this.bars + 1 + '.' + (this.beats + 1) + '.' + (this.sixteenths + 1);
  }

  /**
   * Converts the time to a floating point value representing the amount of bars.
   * @returns {number}
   */
  public toBars(): number {
    return (
      this.bars +
      this.beats / this.beatsPerBar +
      this.sixteenths / this.sixteenthsPerBeat / this.beatsPerBar
    );
  }

  public toBeats(): number {
    return this.bars * this.beatsPerBar + this.beats + this.sixteenths / this.sixteenthsPerBeat;
  }

  public toString(): string {
    return this.bars + '.' + this.beats + '.' + this.sixteenths;
  }

  public add(musicTime: MusicTime): MusicTime {
    return MusicTime.add(this, musicTime);
  }

  public multiply(value: number): MusicTime {
    return MusicTime.multiply(this, value);
  }

  public subtract(time: MusicTime): MusicTime {
    return MusicTime.subtract(this, time);
  }

  public static subtract(musicTime1: MusicTime, musicTime2: MusicTime): MusicTime {
    // TODO fix two different bpb/bps settings
    return new MusicTime(0, 0, musicTime1.valueOf() - musicTime2.valueOf());
  }

  /**
   * Allows easy creation of a MusicTime object, for example: MusicTime.fromString('1.2.0')
   * @param value
   * @param beatsPerBar
   * @param sixteenthsPerBeat
   * @returns {MusicTime}
   */
  public static fromString(
    value: string,
    beatsPerBar: number = 4,
    sixteenthsPerBeat: number = 4,
  ): MusicTime {
    const split: string[] = value.split('.');
    if (split.length !== 3) {
      // tslint:disable-next-line
      console.error('Cannot parse from string', value);
      return null;
    }
    return new MusicTime(
      parseInt(split[0], 10),
      parseInt(split[1], 10),
      parseInt(split[2], 10),
      beatsPerBar,
      sixteenthsPerBeat,
    );
  }

  public static add(musicTime1: MusicTime, musicTime2: MusicTime): MusicTime {
    // TODO fix summing of two different bpb/bps settings
    if (
      musicTime1.beatsPerBar !== musicTime2.beatsPerBar ||
      musicTime1.sixteenthsPerBeat !== musicTime2.sixteenthsPerBeat
    ) {
      // tslint:disable-next-line
      console.error(
        'Cannot sum, beatsPerBar or sixteenthsPerBeat are not equal',
        musicTime1,
        musicTime2,
      );
      return null;
    }

    return new MusicTime(
      musicTime1.bars + musicTime2.bars,
      musicTime1.beats + musicTime2.beats,
      musicTime1.sixteenths + musicTime2.sixteenths,
    ); // todo fix with toValue(), like the other operations
  }

  public equals(time: MusicTime): boolean {
    // todo convert when beatsPerBar and sixteenthsPerBeat are not the same of times we compare
    return (
      this.beatsPerBar === time.beatsPerBar &&
      this.sixteenthsPerBeat === time.sixteenthsPerBeat &&
      this.bars === time.bars &&
      this.beats === time.beats &&
      this.sixteenths === time.sixteenths
    );
  }
  //
  // /**
  //  * Creates a MusicTime value
  //  * @param bars
  //  * @param useFirstOverReferenceValue
  //  * @returns {MusicTime}
  //  */
  // public static fromBars(bars: number, useFirstOverReferenceValue = false): MusicTime {
  //   // todo get rid of that 16
  //   for (let i = 0; i < 16; i += 1) {
  //     const testTime = new MusicTime(Math.floor(bars), 0, i);
  //
  //     if (testTime.toBars() > bars) {
  //       if (useFirstOverReferenceValue) {
  //         // returns the first value that exceeds the given reference value
  //         return testTime;
  //       }
  //       // or return previous value (the last one that doesnt exceed the reference value)
  //       return new MusicTime(Math.floor(bars), 0, i - 1);
  //     }
  //   }
  // }

  public static multiply(time: MusicTime, value: number): MusicTime {
    return new MusicTime(0, 0, time.valueOf() * value);
  }

  public static fromTime(
    timeInSeconds: number,
    bpm: number,
    sixteenthsPerBeat: number = 4,
  ): MusicTime {
    // TODO fix sixteenthsperbeat, should probably be passed to params when creating the timeunit that is returned

    const sixteenthsPerSecond: number = bpm * sixteenthsPerBeat / 60;
    const sixteenthsUnrounded: number =
      timeInSeconds * MusicTime.SPEED_MULTILPLIER * sixteenthsPerSecond;
    const sixteenthsRounded: number = Math.floor(sixteenthsUnrounded);

    return new MusicTime(0, 0, sixteenthsRounded);
  }

  /**
   * Converts to value object.
   * @returns {{beatsPerBar: number, sixteenthsPerBeat: number, beats: number, bars: number, sixteenths: number}}
   */
  public toObject(): IMusicTimeObject {
    return {
      beatsPerBar: this.beatsPerBar,
      sixteenthsPerBeat: this.sixteenthsPerBeat,
      beats: this.beats,
      bars: this.bars,
      sixteenths: this.sixteenths,
    };
  }
}

export interface IMusicTimeObject {
  beatsPerBar: number;
  sixteenthsPerBeat: number;
  beats: number;
  bars: number;
  sixteenths: number;
}

export default MusicTime;
