import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { DEFAULT_OCR_PROMPT } from '@/lib/config-store';

interface OCRRow {
  proyecto: string;
  codigo: string;
  descripcion: string;
  titulo: string;
  fabricacion: string;
}

interface OCRResult {
  period: string;
  rows: OCRRow[];
}

interface ExternalApiConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  ocrSystemPrompt?: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Call external API for vision/OCR
async function callExternalVisionApi(
  imageBase64: string,
  config: ExternalApiConfig
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  const url = `${baseUrl}/chat/completions`;

  const systemPrompt = config.ocrSystemPrompt || DEFAULT_OCR_PROMPT;

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
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: 'Extract all data from this construction progress report spreadsheet image. Return the data in the specified JSON format.',
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`External API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, externalApi } = body as {
      imageBase64: string;
      externalApi?: ExternalApiConfig;
    };

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    let responseContent: string;

    // Use external API if configured
    if (externalApi && externalApi.apiKey) {
      responseContent = await callExternalVisionApi(imageBase64, externalApi);
    } else {
      // Use default Z.ai SDK
      const zai = await ZAI.create();

      const response = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: DEFAULT_OCR_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: 'Extract all data from this construction progress report spreadsheet image. Return the data in the specified JSON format.',
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      responseContent = response.choices[0]?.message?.content || '';
    }

    if (!responseContent) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let ocrResult: OCRResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ocrResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse OCR result:', responseContent);
      return NextResponse.json(
        { error: 'Failed to parse OCR result', raw: responseContent },
        { status: 500 }
      );
    }

    // Process rows - simplified structure without cost
    const processedRows = ocrResult.rows.map((row) => {
      // Support both old and new field names
      const codigo = row.codigo || row.proyecto || '';
      const titulo = row.titulo || row.descripcion || '';
      const fabricacion = row.fabricacion || '';
      
      return {
        id: generateId(),
        codigo,
        titulo,
        fabricacion,
        descripcion: '', // Will be filled by AI or manually
        isActive: !titulo.toUpperCase().includes('DESCUENTO'),
        images: [],
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        period: ocrResult.period,
        items: processedRows,
      },
    });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
