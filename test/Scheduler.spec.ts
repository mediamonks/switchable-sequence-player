import 'mocha';
import { expect } from 'chai';
import SamplePlayer from '../src/lib/SamplePlayer';
import Scheduler from '../src/lib/Scheduler';

describe('Scheduler', () => {
  it('should construct properly', () => {
    const audioContext = new AudioContext();
    const instance = new Scheduler(audioContext, new SamplePlayer(audioContext));

    expect(instance).to.not.equal(null);
  });
});
