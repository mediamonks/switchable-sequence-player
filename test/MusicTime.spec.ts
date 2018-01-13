import 'mocha';
import { expect } from 'chai';
import MusicTime from '../src/lib/MusicTime';

describe('MusicTime', () => {
  it('should construct properly', () => {
      const instance = new MusicTime(1, 2, 3, 4, 5);

      expect(instance.bars).to.equal(1);
      expect(instance.beats).to.equal(2);
      expect(instance.sixteenths).to.equal(3);
      expect(instance.beatsPerBar).to.equal(4);
      expect(instance.sixteenthsPerBeat).to.equal(5);
  });
});
