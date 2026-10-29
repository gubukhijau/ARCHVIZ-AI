/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Next.js App Router API Route for ARCHVIZ AI
 * Deployable directly to Next.js on Vercel
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildMasterPrompt } from '@/src/lib/prompt';
import { LightingPreset, PRESETS } from '@/src/types';

// Max body size configuration for Vercel Serverless Function
export const maxDuration = 60; // Up to 60 seconds for AI rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { imageData, mimeType: rawMime, preset: rawPreset, additionalInstructions } = body;

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json({ error: 'Source image data is required.' }, { status: 400 });
    }

    let cleanBase64 = imageData;
    let mimeType = rawMime || 'image/png';

    if (imageData.startsWith('data:')) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        cleanBase64 = match[2];
      }
    }

    const preset = (rawPreset?.toLowerCase() || 'siang') as LightingPreset;
    if (!PRESETS[preset]) {
      return NextResponse.json({ error: `Invalid preset "${rawPreset}"` }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const modelToUse = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image';
    const masterPrompt = buildMasterPrompt(preset, additionalInstructions);

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: masterPrompt,
          },
        ],
      },
    });

    let renderedBase64: string | null = null;
    let renderedMime = 'image/png';
    let explanationText = '';

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          renderedBase64 = part.inlineData.data;
          if (part.inlineData.mimeType) {
            renderedMime = part.inlineData.mimeType;
          }
          break;
        } else if (part.text) {
          explanationText += part.text + ' ';
        }
      }
    }

    if (!renderedBase64) {
      return NextResponse.json(
        {
          error: explanationText.trim()
            ? `The model responded with explanation instead of image: "${explanationText.trim().slice(0, 150)}"`
            : 'The model failed to produce a valid architectural image output.',
        },
        { status: 422 }
      );
    }

    const renderedUrl = `data:${renderedMime};base64,${renderedBase64}`;
    const jobId = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      job: {
        id: jobId,
        status: 'completed',
        original_url: `data:${mimeType};base64,${cleanBase64}`,
        rendered_url: renderedUrl,
        lighting_preset: preset,
        additional_instructions: additionalInstructions || null,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Server rendering failure' },
      { status: 500 }
    );
  }
}
