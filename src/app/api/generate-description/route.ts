import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { DEFAULT_DESCRIPTION_PROMPT } from '@/lib/config-store';

interface ExternalApiConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  descriptionSystemPrompt?: string;
}

// Call external API for text generation
async function callExternalTextApi(
  prompt: string,
  systemPrompt: string,
  config: ExternalApiConfig
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  const url = `${baseUrl}/chat/completions`;

  const finalSystemPrompt = config.descriptionSystemPrompt || systemPrompt;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' && {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'PAQUIURCISNER Report System',
      }),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: finalSystemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`External API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      proyecto,
      descripcion,
      costoActual,
      periodo,
      externalApi,
    } = body as {
      proyecto?: string;
      descripcion: string;
      costoActual?: number;
      periodo?: string;
      externalApi?: ExternalApiConfig;
    };

    if (!descripcion) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const systemPrompt = DEFAULT_DESCRIPTION_PROMPT;

    const userPrompt = `Genera una descripción técnica profesional para el siguiente item de avance de obra:

Proyecto: ${proyecto || 'No especificado'}
Descripción original: ${descripcion}
Costo actual: ${costoActual || 'No especificado'}
Período: ${periodo || 'No especificado'}

Responde ÚNICAMENTE con la descripción técnica, sin introducción ni explicaciones adicionales.`;

    let generatedDescription: string;

    // Use external API if configured
    if (externalApi && externalApi.apiKey) {
      generatedDescription = await callExternalTextApi(userPrompt, systemPrompt, externalApi);
    } else {
      // Use default Z.ai SDK
      const zai = await ZAI.create();

      const response = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 512,
      });

      generatedDescription = response.choices[0]?.message?.content?.trim() || '';
    }

    if (!generatedDescription) {
      return NextResponse.json(
        { error: 'Failed to generate description' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      description: generatedDescription,
    });
  } catch (error) {
    console.error('Generate description API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
