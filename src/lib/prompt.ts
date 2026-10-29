/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LightingPreset, PRESETS } from '../types/index.js';

/**
 * Builds the exact Master Image-Editing Prompt specified in Section E
 */
export function buildMasterPrompt(presetKey: LightingPreset, additionalInstructions?: string): string {
  const preset = PRESETS[presetKey] || PRESETS.siang;
  const sanitizedInstructions = additionalInstructions?.trim() 
    ? additionalInstructions.trim() 
    : 'None provided. Adhere strictly to the chosen lighting preset and architectural preservation.';

  return `ENHANCE PHOTOREALISM ONLY. PRESERVE THE ORIGINAL ARCHITECTURAL DESIGN.

The uploaded image is the sole master reference. Produce a photorealistic architectural photograph of the exact scene shown in the source image.

Preserve the building geometry, dimensions, proportions, rooflines, façade, walls, columns, beams, doors, windows, frames, openings, furniture, vehicles, landscaping, plants, paving, surrounding objects, camera position, perspective, framing, composition, material assignments, and original color palette.

Do not add, remove, replace, duplicate, relocate, resize, deform, or invent any architectural element or object. Do not redesign unusual details. Do not reconstruct missing or obscured elements creatively.

Improve photographic realism only through physically plausible lighting, realistic material response, microtexture, roughness, reflections, contact shadows, global illumination, natural tonal gradation, and optical detail.

Preserve the original material identity and color. Concrete must retain its original color and pattern. Wood must retain its original grain direction, dimensions, and finish. Glass must retain its tint, transparency, and frame geometry. Metal, roofing, stone, tiles, and asphalt must retain their existing profiles, boundaries, layouts, and colors. Existing vegetation must retain its visible quantity, position, size, and arrangement.

Maintain the original camera position, image framing, perspective, aspect ratio, and visible scene boundaries. Do not crop or expand the image.

Apply the selected lighting preset: ${preset.promptSnippet}

Additional user instructions: ${sanitizedInstructions}

Additional instructions may influence lighting and photographic realism only when consistent with the original scene and the preservation rules.

Negative constraints: no redesign, no geometry changes, no added or removed objects, no altered façade, no modified roof, no changed openings, no relocated furniture, no additional plants, no changed material assignments, no altered color palette, no camera changes, no composition changes, no artificial HDR, no cartoon appearance, no plastic-looking materials, no excessive bloom, no unrealistic reflections, no oversaturation, and no invented architectural details.

Priority order:
1. Preserve the source design and all visible elements.
2. Preserve geometry, object placement, material identity, and composition.
3. Improve photorealism only.
4. Preserve the original aspect ratio.

If any enhancement conflicts with the source design, preserve the source design.

Return the edited image, not a textual explanation.`;
}
