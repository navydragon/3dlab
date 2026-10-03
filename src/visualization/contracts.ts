import type { MachineComponentId } from '../domain/ids';

export type PlaybackState = 'paused' | 'playing';
export type ViewerLoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready' }
  | { readonly status: 'error'; readonly message: string };

// A future renderer implements this plain-data boundary. Scene objects, node
// names, educational prose, and engineering times never cross it.
export interface ViewerInteraction {
  readonly selectedComponentId: MachineComponentId | null;
  readonly playback: PlaybackState;
  readonly onComponentSelect: (id: MachineComponentId | null) => void;
  readonly onPlaybackChange: (state: PlaybackState) => void;
  readonly onLoadStateChange: (state: ViewerLoadState) => void;
}
