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

// The renderer keeps this plain-data boundary. Scene objects, node
// names, educational prose, and engineering times never cross it.
export interface ViewerCommand {
  readonly kind: 'play' | 'pause' | 'reset';
  readonly sequence: number;
}
export interface Visibility {
  readonly hidden: readonly MachineComponentId[];
  readonly isolated: MachineComponentId | null;
}
export const showAll: Visibility = Object.freeze({
  hidden: Object.freeze([]),
  isolated: null,
});
