/**
 * Logical audio keys (files in public/audio as .mp3 from Assets/sounds).
 * Unity PooControl.spawnSounds was an array — farts + grunts were both launch clips.
 */

export type AudioCategory = 'pooSpawn' | 'splat';

export const AUDIO_FILES: Record<AudioCategory, readonly string[]> = {
  pooSpawn: ['fart01', 'fart02', 'grunt01', 'grunt02'],
  splat: ['splat01', 'splat02'],
};
