import { writable } from 'svelte/store';

// Holds the unique id of the block currently playing audio, or null if all are muted.
export const activeAudioId = writable(null);
