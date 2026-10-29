/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LightingPreset = 'pagi' | 'siang' | 'sore' | 'malam';

export type RenderJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface RenderJob {
  id: string;
  user_id?: string | null;
  original_image_path: string;
  rendered_image_path?: string | null;
  lighting_preset: LightingPreset;
  additional_instructions?: string | null;
  status: RenderJobStatus;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
  original_url?: string;
  rendered_url?: string;
}

export interface PresetInfo {
  id: LightingPreset;
  title: string;
  timeTag: string;
  tagline: string;
  description: string;
  promptSnippet: string;
}

export const PRESETS: Record<LightingPreset, PresetInfo> = {
  pagi: {
    id: 'pagi',
    title: 'Pagi',
    timeTag: '06:00 – 09:30',
    tagline: 'Soft morning daylight & gentle shadows',
    description:
      'Soft morning daylight, natural ambient illumination, gentle shadows, neutral color reproduction.',
    promptSnippet:
      'Soft morning daylight, natural ambient illumination, gentle shadows, neutral color reproduction, clear early atmospheric depth, clean crisp morning illumination.',
  },
  siang: {
    id: 'siang',
    title: 'Siang',
    timeTag: '11:30 – 14:00',
    tagline: 'Balanced natural daylight & GI',
    description:
      'Balanced natural daylight, realistic global illumination, physically plausible shadows, accurate material colors.',
    promptSnippet:
      'Balanced natural daylight, realistic global illumination, physically plausible shadows, accurate material colors, crisp solar highlights without clipping, physically grounded architectural exterior sunlight.',
  },
  sore: {
    id: 'sore',
    title: 'Sore',
    timeTag: '16:30 – 18:00',
    tagline: 'Golden hour directional light & warm tones',
    description:
      'Natural late-afternoon light, soft directional illumination, restrained warmth, realistic shadow transitions.',
    promptSnippet:
      'Natural late-afternoon light, soft directional illumination, restrained warmth, realistic shadow transitions, long gentle architectural shadows, subtle golden hour grading without excessive bloom.',
  },
  malam: {
    id: 'malam',
    title: 'Malam',
    timeTag: '20:00 – 23:00',
    tagline: 'Night exposure & architectural illumination',
    description:
      'Physically plausible night exposure, realistic ambient darkness, accurate reflections, and restrained illumination from existing light fixtures only.',
    promptSnippet:
      'Physically plausible night exposure, realistic ambient darkness, accurate reflections, and restrained illumination from existing light fixtures only, dark sky with subtle atmospheric haze, authentic architectural lighting bounce.',
  },
};
