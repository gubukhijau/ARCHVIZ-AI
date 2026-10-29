/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Master Architectural Photorealism Prompt with Absolute Design & Element Lock
 */

export const MASTER_EXTREME_REALISM_PROMPT = `## EXTREME PHOTOREALISM | ABSOLUTE DESIGN & ELEMENT LOCK

*MAIN OBJECTIVE: ENHANCE REALISM ONLY. DO NOT CHANGE ANYTHING IN THE ORIGINAL IMAGE.*

Transform the uploaded architectural image into an extremely photorealistic, premium-quality architectural photograph while preserving the original design with absolute fidelity.

The uploaded image is the *ONLY MASTER REFERENCE*. It determines every architectural detail, object, material position, color, composition, and camera perspective.

### 1. ABSOLUTE DESIGN LOCK — MANDATORY

Preserve the original image exactly. Do not redesign, reinterpret, reconstruct creatively, or generate alternative architectural solutions.

STRICTLY KEEP 100% UNCHANGED:

- Building geometry, shape, dimensions, scale, proportions, and structural layout.
- Roof shape, slope, height, thickness, overhangs, edges, and roofing details.
- All façade compositions, walls, columns, beams, floors, ceilings, and architectural ornaments.
- Exact positions, sizes, shapes, and proportions of all windows, doors, glass panels, frames, vents, and openings.
- Original colors, material assignments, textures, patterns, and boundaries between materials.
- All interior and exterior elements, including furniture, decorations, light fixtures, appliances, vehicles, fences, gates, and street furniture.
- Original landscaping, trees, plants, grass, garden beds, paving, driveway, road, and surrounding objects.
- Original camera angle, viewing direction, framing, perspective, and image composition.
- The exact number, location, and shape of every visible element.

*ABSOLUTE OBJECT LOCK:* Never add, remove, replace, move, resize, deform, duplicate, simplify, or invent any object or architectural element.

*ABSOLUTE GEOMETRY LOCK:* Do not change any silhouette, edge, dimension, opening, roofline, wall boundary, or spatial relationship.

Do not correct, complete, or redesign anything that appears unusual in the original image. Reproduce the source faithfully.

### 2. EXTREME PHOTOREALISM — REALISM ONLY

Upgrade the image from a computer-generated appearance to the visual quality of a real architectural photograph.

Improve realism through physically believable lighting, natural material response, surface microtexture, realistic roughness, accurate reflections, subtle imperfections, and natural environmental integration.

All enhancements must follow the existing geometry and existing material assignments.

### 3. ULTRA-REALISTIC MATERIALS — PBR QUALITY

*Concrete and plaster:* Realistic fine-grain texture, subtle surface pores, natural roughness variation, physically plausible shading, and extremely subtle imperfections without changing the original color or surface pattern.

*Wood and WPC:* Authentic fine wood grain, realistic fiber details, natural roughness, accurate surface reflections, and preservation of the original color, pattern, board direction, and dimensions.

*Glass:* Physically realistic transparency, correct reflections, natural refraction, believable reflections of the existing environment, and preserved transparency, tint, frame thickness, and opening dimensions.

*Metal and aluminium:* Realistic metallic response, subtle micro-scratches, physically accurate reflections, fine surface texture, and preservation of the original color, finish, and profile.

*Roofing materials:* Realistic existing roofing texture, natural specular response, fine surface details, and preservation of every roof panel, seam, edge, and original color.

*Stone, tiles, paving, and asphalt:* Natural surface grain, fine irregularities, subtle roughness variation, realistic contact shadows, and preservation of the original pattern, dimensions, layout, and color.

*Plants and landscaping:* Photographic leaf details, natural leaf translucency, realistic branches, organic textures, and believable light interaction. Preserve the exact number, species appearance, positions, sizes, and arrangement of existing vegetation. Do not generate additional plants.

*Every material must retain its original identity.* Improve only the physical realism of the material already present.

### 4. PROFESSIONAL NATURAL LIGHTING

Use realistic daylight with physically plausible illumination and balanced exposure.

- Natural soft daylight and believable global illumination.
- Accurate indirect lighting and realistic ambient occlusion.
- Soft, detailed contact shadows without excessive darkness.
- Physically correct light reflection and material response.
- Natural highlights with preserved shadow detail.
- Neutral white balance and realistic color reproduction.
- Existing artificial lights must remain in their exact original positions.
- If existing lights are illuminated, use only a subtle, realistic warm glow.
- Do not introduce new light sources, dramatic spotlights, or excessive illumination.

Avoid overexposure, excessive contrast, artificial bloom, oversaturated colors, and heavy cinematic color grading.

### 5. PROFESSIONAL ARCHITECTURAL PHOTOGRAPHY

Simulate the visual characteristics of a high-end full-frame DSLR architectural photograph.

- Natural photographic dynamic range.
- Realistic lens response and optical detail.
- Accurate perspective consistent with the source image.
- Clear, detailed architectural surfaces without artificial oversharpening.
- Natural depth and realistic separation between foreground and background.
- Physically believable reflections and shadow transitions.
- Premium photographic clarity with natural tonal gradation.

*Do not change the original camera position, lens perspective, framing, or composition.* Camera simulation must adapt to the source image, not alter the source image.

### 6. RENDERING QUALITY

Target an ultra-high-quality photorealistic architectural visualization with:

- Physically Based Rendering (PBR).
- Ray-traced-quality reflections and shadows.
- High-quality global illumination.
- Realistic ambient occlusion.
- Accurate material roughness and specular response.
- Fine microtexture and natural surface imperfections.
- Clean edges and minimal rendering artifacts.
- High-resolution detail with natural sharpness.
- Neutral, realistic color science.
- Premium architectural photography quality.

Enhance the existing image at the highest image resolution supported by the tool. Preserve the original aspect ratio and composition. Do not claim a specific output resolution unless it is actually produced.

### 7. STRICT NEGATIVE PROMPT

NO redesign, NO architectural modification, NO geometry changes, NO additional structures, NO removed objects, NO new furniture, NO new decorations, NO new plants, NO missing plants, NO altered landscaping, NO additional windows, NO removed windows, NO modified doors, NO changed roof, NO changed façade, NO altered dimensions, NO changed proportions, NO relocated objects, NO invented details, NO different materials, NO altered color palette, NO changed camera angle, NO changed perspective, NO different composition, NO artificial HDR, NO oversaturation, NO excessive warm lighting, NO dramatic lighting, NO excessive bloom, NO cartoon appearance, NO illustration, NO plastic-looking materials, NO artificial sharpness, NO unrealistic reflections.

### 8. FINAL EXECUTION COMMAND

Render the uploaded image now.

*PRIORITY ORDER:*
1. Preserve the original design and every existing element.
2. Preserve all geometry, dimensions, positions, materials, colors, and composition.
3. Improve photorealism through lighting, textures, material response, reflections, and shadows only.
4. Achieve the highest realistic photographic quality possible.

If any enhancement conflicts with the original design, the original design always wins.

*FINAL RULE: SAME DESIGN. SAME OBJECTS. SAME GEOMETRY. SAME COLORS. SAME COMPOSITION. ONLY THE REALISM IMPROVES.*

Do not explain, redesign, or provide a new concept. Return the rendered image based on the uploaded reference.`;

/**
 * Returns the exact Master Prompt for every render
 */
export function buildMasterPrompt(_presetKey?: string, _additionalInstructions?: string): string {
  return MASTER_EXTREME_REALISM_PROMPT;
}
