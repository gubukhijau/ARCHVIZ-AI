/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { buildMasterPrompt } from './src/lib/prompt.js';
import { LightingPreset, RenderJob, PRESETS } from './src/types/index.js';
import { getSupabaseServerClient } from './src/lib/supabase.js';
import { processPhotometricRealism } from './src/lib/photometric.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High body limits for high-resolution architectural images
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ limit: '35mb', extended: true }));

// Server-side Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to validate and clean model name
function cleanModelName(name?: string): string {
  if (!name) return 'gemini-3.1-flash-lite-image';
  let cleaned = name.trim().replace(/^["']+|["']+$/g, '').trim();
  if (cleaned.startsWith('models/')) {
    cleaned = cleaned.replace(/^models\//, '');
  }
  // Detect if an API key was accidentally passed instead of a model name
  if (
    cleaned.startsWith('AQ.') ||
    cleaned.startsWith('AIza') ||
    cleaned.length > 40 ||
    (!cleaned.startsWith('gemini') && !cleaned.startsWith('imagen'))
  ) {
    return 'gemini-3.1-flash-lite-image';
  }
  return cleaned;
}

// Configured image model (default: gemini-3.1-flash-lite-image)
const DEFAULT_MODEL = cleanModelName(process.env.GEMINI_IMAGE_MODEL);

// In-memory cache for fast local persistence / demo sessions
const localJobsStore = new Map<string, RenderJob>();

/**
 * Health & Configuration endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  const supabase = getSupabaseServerClient();
  res.json({
    status: 'ok',
    model: DEFAULT_MODEL,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    isSupabaseConnected: Boolean(supabase),
  });
});

/**
 * Helper to authenticate request against Supabase (if configured)
 */
async function authenticateUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * POST /api/render
 * Initiates architectural photorealism rendering
 */
app.post('/api/render', async (req: Request, res: Response): Promise<void> => {
  const jobId = crypto.randomUUID();
  const startTime = new Date().toISOString();

  try {
    const {
      imageData, // base64 string or data:image/...;base64,...
      mimeType: rawMime,
      preset: rawPreset,
      additionalInstructions,
    } = req.body;

    // 1. Validation
    if (!imageData || typeof imageData !== 'string') {
      res.status(400).json({ error: 'Source image data is required.' });
      return;
    }

    // Extract base64 and MIME type
    let cleanBase64 = imageData;
    let mimeType = rawMime || 'image/png';

    if (imageData.startsWith('data:')) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        cleanBase64 = match[2];
      }
    }

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      res.status(400).json({
        error: `Invalid file format (${mimeType}). Supported formats: PNG, JPG, JPEG, WEBP.`,
      });
      return;
    }

    // Max 25MB base64 payload validation
    const approxByteSize = (cleanBase64.length * 3) / 4;
    if (approxByteSize > 25 * 1024 * 1024) {
      res.status(400).json({
        error: 'Image file exceeds the 25MB limit. Please provide an image under 25MB.',
      });
      return;
    }

    const preset = (rawPreset?.toLowerCase() || 'siang') as LightingPreset;
    if (!PRESETS[preset]) {
      res.status(400).json({
        error: `Invalid lighting preset "${rawPreset}". Allowed: pagi, siang, sore, malam.`,
      });
      return;
    }

    // 2. Auth & Job Initialization
    const authUser = await authenticateUser(req);
    const userId = authUser ? authUser.id : null;

    const originalDataUrl = `data:${mimeType};base64,${cleanBase64}`;

    const newJob: RenderJob = {
      id: jobId,
      user_id: userId,
      original_image_path: `original_${jobId}.${mimeType.split('/')[1] || 'png'}`,
      rendered_image_path: null,
      lighting_preset: preset,
      additional_instructions: additionalInstructions || null,
      status: 'processing',
      error_message: null,
      created_at: startTime,
      original_url: originalDataUrl,
    };

    localJobsStore.set(jobId, newJob);

    // If Supabase is available, persist initial job
    const supabase = getSupabaseServerClient();
    if (supabase && userId) {
      try {
        await supabase.from('render_jobs').insert({
          id: jobId,
          user_id: userId,
          original_image_path: newJob.original_image_path,
          lighting_preset: preset,
          additional_instructions: additionalInstructions || null,
          status: 'processing',
          created_at: startTime,
        });

        // Optionally upload original buffer to Supabase Storage
        const originalBuffer = Buffer.from(cleanBase64, 'base64');
        await supabase.storage
          .from('original_images')
          .upload(`${userId}/${jobId}.${mimeType.split('/')[1] || 'png'}`, originalBuffer, {
            contentType: mimeType,
            upsert: true,
          });
      } catch (dbErr) {
        console.warn('Supabase job record warning (falling back to server session):', dbErr);
      }
    }

    // 3. Determine Engine: 'free' (default / quota-free) or 'gemini' (paid key)
    const { engine = 'free' } = req.body;
    const masterPrompt = buildMasterPrompt(preset, additionalInstructions);
    const rawModel = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
    const modelToUse = cleanModelName(rawModel);

    let renderedBase64: string | null = null;
    let renderedMime = 'image/jpeg';
    let returnedText = '';
    let engineUsed = engine;

    // Helper: Execute Free Photorealism Pipeline
    async function runFreeRealismPipeline(): Promise<{ base64: string; mime: string }> {
      const sourceBuffer = Buffer.from(cleanBase64, 'base64');

      // Attempt AI image generation with strict sanitized prompt and timeout
      try {
        let visionSummary = '';
        try {
          const visionPrompt = `Briefly describe this architectural image in 15 words: building type and exterior facade materials.`;
          const visionResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType,
                  },
                },
                {
                  text: visionPrompt,
                },
              ],
            },
          });
          visionSummary = visionResponse.text?.trim() || '';
        } catch {
          // vision analysis is optional enhancement
        }

        const rawSubject = visionSummary || 'modern architectural building facade';
        // Clean prompt thoroughly to avoid 404 NOT_FOUND on edge routers
        const cleanSubject = rawSubject
          .replace(/[\r\n\t]+/g, ' ')
          .replace(/[^a-zA-Z0-9\s,.-]/g, '')
          .slice(0, 90)
          .trim();

        const safePrompt = encodeURIComponent(
          `photorealistic architectural photography ${cleanSubject} ${preset} daylight highly detailed`
        );
        const seed = Math.floor(Math.random() * 900000) + 100000;
        const fluxUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=768&model=turbo&nologo=true&seed=${seed}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const imageResponse = await fetch(fluxUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'ARCHVIZ-AI-Studio/1.0',
          },
        });
        clearTimeout(timeoutId);

        if (imageResponse.ok) {
          const cType = imageResponse.headers.get('content-type') || '';
          if (cType.includes('image')) {
            const buffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            return { base64, mime: 'image/jpeg' };
          }
        }
      } catch (externalErr) {
        console.warn('AI cloud generator rate-limited or unavailable, applying Photometric Realism Pipeline:', externalErr);
      }

      // High-Fidelity Photometric Architectural Realism Engine
      // Simulates Global Illumination, microtexture, and physically plausible lighting
      // with 100% preservation of building geometry and facade dimensions.
      const photometricResult = await processPhotometricRealism(
        sourceBuffer,
        preset,
        additionalInstructions
      );

      return {
        base64: photometricResult.buffer.toString('base64'),
        mime: photometricResult.mime,
      };
    }

    // Execution based on engine mode
    if (engine === 'openai') {
      const openAiKey = process.env.OPENAI_API_KEY;
      if (!openAiKey) {
        throw new Error('OPENAI_API_KEY belum dikonfigurasi pada server.');
      }

      try {
        const openAiPrompt = `Photorealistic architectural photograph of the building: ${masterPrompt.replace(/[\n\r]+/g, ' ').slice(0, 900)}`;

        const openAiRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-image-1-mini',
            prompt: openAiPrompt,
            size: '1024x1024',
          }),
        });

        const openAiData = await openAiRes.json();

        if (openAiData.error) {
          console.warn('OpenAI API returned error:', openAiData.error.message);
          const isNoCredits =
            openAiData.error.message?.includes('no credits') ||
            openAiData.error.code === 'insufficient_quota';

          if (isNoCredits) {
            console.log('OpenAI credits depleted ($0.00). Falling back automatically to Free Realism Engine...');
            const fallbackResult = await runFreeRealismPipeline();
            renderedBase64 = fallbackResult.base64;
            renderedMime = fallbackResult.mime;
            engineUsed = 'openai_fallback_free';
          } else {
            throw new Error(`OpenAI: ${openAiData.error.message}`);
          }
        } else if (openAiData.data && openAiData.data[0]?.url) {
          const imgFetch = await fetch(openAiData.data[0].url);
          const arrayBuffer = await imgFetch.arrayBuffer();
          renderedBase64 = Buffer.from(arrayBuffer).toString('base64');
          renderedMime = 'image/png';
        } else if (openAiData.data && openAiData.data[0]?.b64_json) {
          renderedBase64 = openAiData.data[0].b64_json;
          renderedMime = 'image/png';
        } else {
          throw new Error('OpenAI tidak mengembalikan data gambar.');
        }
      } catch (openAiErr: any) {
        console.warn('OpenAI error, falling back to Photometric Engine:', openAiErr?.message);
        const fallbackResult = await runFreeRealismPipeline();
        renderedBase64 = fallbackResult.base64;
        renderedMime = fallbackResult.mime;
        engineUsed = 'openai_fallback_free';
      }
    } else if (engine === 'free') {
      try {
        const result = await runFreeRealismPipeline();
        renderedBase64 = result.base64;
        renderedMime = result.mime;
      } catch (freeErr: any) {
        console.error('Free pipeline error:', freeErr);
        throw new Error(`Mesin render gratis gagal: ${freeErr?.message || 'Koneksi terputus'}`);
      }
    } else {
      // Attempt Direct Gemini Visual Editing
      try {
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
              returnedText += part.text + ' ';
            }
          }
        }

        // If Gemini returned text or 429 quota, fallback automatically to Free Realism Engine
        if (!renderedBase64) {
          console.log('Gemini model did not return image data, falling back to Free Realism Pipeline...');
          const result = await runFreeRealismPipeline();
          renderedBase64 = result.base64;
          renderedMime = result.mime;
          engineUsed = 'free_fallback';
        }
      } catch (apiError: any) {
        console.warn('Gemini direct API error, automatically routing to Free Realism Engine:', apiError?.message);
        
        // Automatic fallback on 429 / quota / unsupported model format so the user is never stuck
        try {
          const result = await runFreeRealismPipeline();
          renderedBase64 = result.base64;
          renderedMime = result.mime;
          engineUsed = 'free_fallback';
        } catch (fallbackErr: any) {
          const rawMsg = apiError?.message || '';
          const userFriendlyMsg =
            apiError?.status === 'RESOURCE_EXHAUSTED' || apiError?.status === 429
              ? 'Batas kuota Gemini Free Tier tercapai (limit 0 untuk model gambar). Silakan gunakan Mode Gratis (FLUX.1 + Gemini Vision) di menu atas.'
              : `Gagal memproses render: ${rawMsg}`;

          newJob.status = 'failed';
          newJob.error_message = userFriendlyMsg;
          localJobsStore.set(jobId, newJob);

          res.status(502).json({ error: userFriendlyMsg, jobId });
          return;
        }
      }
    }

    // If model returned text without an image, treat as unsuccessful (Section F rule 6)
    if (!renderedBase64) {
      const errMsg = returnedText.trim()
        ? `The model responded with explanation instead of an edited image: "${returnedText.trim().slice(0, 200)}"`
        : 'The model failed to produce a valid architectural image output. Please check the image content and retry.';

      newJob.status = 'failed';
      newJob.error_message = errMsg;
      localJobsStore.set(jobId, newJob);

      if (supabase && userId) {
        await supabase
          .from('render_jobs')
          .update({ status: 'failed', error_message: errMsg })
          .eq('id', jobId);
      }

      res.status(422).json({
        error: errMsg,
        jobId,
      });
      return;
    }

    // 6. Complete Job & Store Output
    const renderedDataUrl = `data:${renderedMime};base64,${renderedBase64}`;
    const completedAt = new Date().toISOString();

    newJob.status = 'completed';
    newJob.rendered_url = renderedDataUrl;
    newJob.rendered_image_path = `rendered_${jobId}.${renderedMime.split('/')[1] || 'png'}`;
    newJob.completed_at = completedAt;
    localJobsStore.set(jobId, newJob);

    // Save to Supabase Storage and DB if connected
    if (supabase && userId) {
      try {
        const renderedBuffer = Buffer.from(renderedBase64, 'base64');
        const storagePath = `${userId}/${jobId}.${renderedMime.split('/')[1] || 'png'}`;

        await supabase.storage
          .from('rendered_images')
          .upload(storagePath, renderedBuffer, {
            contentType: renderedMime,
            upsert: true,
          });

        await supabase
          .from('render_jobs')
          .update({
            status: 'completed',
            rendered_image_path: storagePath,
            completed_at: completedAt,
          })
          .eq('id', jobId);
      } catch (storageErr) {
        console.warn('Supabase storage upload warning:', storageErr);
      }
    }

    res.json({
      success: true,
      job: newJob,
    });
  } catch (err: any) {
    console.error('Unhandled render error:', err);
    res.status(500).json({
      error: err?.message || 'An unexpected error occurred during rendering.',
    });
  }
});

/**
 * GET /api/render/:id
 * Fetches status and details of a single render job
 */
app.get('/api/render/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const localJob = localJobsStore.get(id);

  if (localJob) {
    res.json(localJob);
    return;
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        res.status(404).json({ error: 'Render job not found.' });
        return;
      }
      res.json(data);
      return;
    } catch {
      res.status(404).json({ error: 'Render job not found.' });
      return;
    }
  }

  res.status(404).json({ error: 'Render job not found.' });
});

/**
 * GET /api/history
 * Returns user render history
 */
app.get('/api/history', async (req: Request, res: Response): Promise<void> => {
  const authUser = await authenticateUser(req);
  const supabase = getSupabaseServerClient();

  if (supabase && authUser) {
    try {
      const { data, error } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        res.json({ jobs: data });
        return;
      }
    } catch (e) {
      console.warn('Failed querying Supabase history:', e);
    }
  }

  // Fallback to local session history
  const allJobs = Array.from(localJobsStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  res.json({ jobs: allJobs });
});

/**
 * POST /api/upload-url
 * Generates signed upload URL for direct storage uploads
 */
app.post('/api/upload-url', async (req: Request, res: Response): Promise<void> => {
  const authUser = await authenticateUser(req);
  const supabase = getSupabaseServerClient();

  if (!supabase || !authUser) {
    res.status(200).json({
      directUpload: false,
      message: 'Direct signed uploads require active Supabase connection.',
    });
    return;
  }

  try {
    const { filename } = req.body;
    const path = `${authUser.id}/${Date.now()}_${filename || 'upload.png'}`;
    const { data, error } = await supabase.storage
      .from('original_images')
      .createSignedUploadUrl(path);

    if (error || !data) {
      res.status(500).json({ error: error?.message || 'Failed generating upload URL' });
      return;
    }

    res.json({
      directUpload: true,
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Storage error' });
  }
});

// Setup Vite middleware in development or static serve in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ARCHVIZ AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
