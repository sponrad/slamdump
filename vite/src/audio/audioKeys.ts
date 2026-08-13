/**
 * Logical audio keys (files in public/audio as .mp3 from Assets/sounds).
 */

export type AudioCategory = 'pooSpawn' | 'splat' | 'grunt';

export const AUDIO_FILES: Record<AudioCategory, readonly string[]> = {
  pooSpawn: ['fart01', 'fart02'],
  splat: ['splat01', 'splat02'],
  grunt: ['grunt01', 'grunt02'],
};
