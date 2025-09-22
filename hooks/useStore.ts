
import { create } from 'zustand';

interface ControlsState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  fire: boolean;
  set: (state: Partial<ControlsState>) => void;
}

export const useStore = create<ControlsState>((set) => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  fire: false,
  set: (state) => set(state),
}));
