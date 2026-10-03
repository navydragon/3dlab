import type { MachineComponentId } from '../domain/ids';

export type PlaybackState = 'paused' | 'playing';
export type ViewerLoadState =
  | { readonly status: 'unconfigured' }
  | { readonly status: 'unsupported'; readonly reason: 'webgl-unavailable' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready' }
  | {
      readonly status: 'error';
      readonly code:
        'asset-load' | 'asset-decode' | 'node-mapping' | 'context-lost';
      readonly message: string;
    };

export type ViewerAnimationState =
  | {
      readonly status: 'unsupported';
      readonly reason: 'unmapped' | 'missing-clip';
    }
  | { readonly status: 'available'; readonly playback: PlaybackState };

// A future renderer implements this plain-data boundary. Scene objects, node
// names, educational prose, and engineering times never cross it.
export interface ViewerInteraction {
  readonly selectedComponentId: MachineComponentId | null;
  readonly playback: PlaybackState;
  readonly onComponentSelect: (id: MachineComponentId | null) => void;
  readonly onPlaybackChange: (state: PlaybackState) => void;
  readonly onLoadStateChange: (state: ViewerLoadState) => void;
}
