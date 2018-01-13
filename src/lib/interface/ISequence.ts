export interface ISequence {
  id: string;
  notes: INote[];
  instrumentId: string;
}
export default ISequence;

export interface INote {
  time: number;
  sampleId: string;
  volume: number;
  lastScheduledData: ILastScheduledData;
}

/**
 * defines the last iteration/songpart the note has been scheduled for, as a hashmap with
 * the songpartId as key, for example: { drums: 5, vocals: 2 }. This combination (of iteration
 * and songpart) is needed because a sequence can be used within multiple songparts.
 *
 * ( note: a sequence can NOT appear in multiple instruments, this is validated)
 */
export interface ILastScheduledData {
  [songpartId: string]: number;
}
