export interface ILoadProgress {
  total: number;
  loaded: number;
  update: (value: number) => void;
}
