import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface ExternalApiConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  descriptionSystemPrompt?: string;
}

interface ItemInput {
  index: number;
  codigo: string;
  titulo: string;
  fabricacion?: string;
}

// Improved system prompt for generating short descriptions
const BATCH_DESCRIPTION_PROMPT = `Eres un ingeniero civil experto en estructuras metálicas y fabricación industrial.

Tu tarea es generar descripciones cortas y técnicas para un informe de avance de obra.

REGLAS IMPORTANTES:
1. La descripción debe ser CORTA (máximo 1-2 oraciones)
2. Debe describir el PROCESO realizado (corte, soldadura, armado, fabricación, etc.)
3. Usa lenguaje técnico de construcción metálica
4. Basate en el título del item y en la información de fabricación si está disponible
5. NO repitas el código o título, solo describe el trabajo
6. Si la información de fabricación está disponible, úsala como base

Ejemplos:
- Título: "H2-CAJÓN DE INGRESO" + Fabricación: "Fabricación, ensamblaje y soldadura"
  → Descripción: "Fabricación, ensamblaje y soldadura de cajón de ingreso estructural con refuerzos laterales."

- Título: "TRUSS ESTRUCTURA PRINCIPAL" + Fabricación: "Corte y conformado"
  → Descripción: "Corte, conformado y montaje de truss estructurales para sistema principal."

Responde ÚNICAMENTE con un JSON array donde cada elemento tiene "codigo" y "descripcion":
[
  {"codigo": "P001", "descripcion": "descripción corta generada"},
  {"codigo": "P002", "descripcion": "descripción corta generada"}
]`;

// Parse AI response and extract descriptions
function parseDescriptionsFromResponse(
  content: string,
  items: ItemInput[]
): { index: number; descripcion: string }[] {
  try {
    // Try to extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        // Map codigo to index
        const codigoToIndex = new Map(items.map(item => [item.codigo, item.index]));
        return parsed.map((p: { codigo?: string; descripcion?: string }) => {
          const idx = codigoToIndex.get(p.codigo || '') ?? 0;
          return {
            index: idx,
            descripcion: p.descripcion || items.find(i => i.index === idx)?.fabricacion || '',
          };
        });
      }
    }
  } catch (e) {
    console.error('Failed to parse AI response:', content, e);
  }

  // Fallback: use fabricacion field or generate basic description
  return items.map((item) => ({
    index: item.index,
    descripcion: item.fabricacion || `Trabajo realizado en ${item.titulo}`,
  }));
}

// Call external API for batch text generation
async function callExternalBatchApi(
  items: ItemInput[],
  config: ExternalApiConfig
): Promise<{ index: number; descripcion: string }[]> {
  const baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  const url = `${baseUrl}/chat/completions`;

  const systemPrompt = config.descriptionSystemPrompt || BATCH_DESCRIPTION_PROMPT;

  // Build items text with fabricacion info if available
  const itemsText = items.map(item => {
    let text = `- Código: ${item.codigo}\n  Título: ${item.titulo}`;
    if (item.fabricacion) {
      text += `\n  Fabricación: ${item.fabricacion}`;
    }
    return text;
  }).join('\n\n');

  console.log('Calling external API for descriptions...');

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
          content: `Genera descripciones técnicas cortas para los siguientes items:\n\n${itemsText}`,
        },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('External API error:', error);
    throw new Error(`External API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  console.log('External API response:', content.substring(0, 200));
  
  return parseDescriptionsFromResponse(content, items);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, externalApi } = body as {
      items: ItemInput[];
      externalApi?: ExternalApiConfig;
    };

    console.log('Received request for', items?.length || 0, 'items');

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    let descriptions: { index: number; descripcion: string }[];

    // Use external API if configured
    if (externalApi && externalApi.apiKey) {
      console.log('Using external API:', externalApi.provider, externalApi.model);
      descriptions = await callExternalBatchApi(items, externalApi);
    } else {
      // Use default Z.ai SDK
      console.log('Using Z.ai SDK');
      const zai = await ZAI.create();

      // Build items text with fabricacion info
      const itemsText = items.map(item => {
        let text = `- Código: ${item.codigo}\n  Título: ${item.titulo}`;
        if (item.fabricacion) {
          text += `\n  Fabricación: ${item.fabricacion}`;
        }
        return text;
      }).join('\n\n');

      const response = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: BATCH_DESCRIPTION_PROMPT,
          },
          {
            role: 'user',
            content: `Genera descripciones técnicas cortas para los siguientes items:\n\n${itemsText}`,
          },
        ],
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content || '';
      console.log('Z.ai response:', content.substring(0, 200));
      
      descriptions = parseDescriptionsFromResponse(content, items);
    }

    console.log('Generated descriptions:', descriptions.length);

    return NextResponse.json({
      success: true,
      descriptions,
    });
  } catch (error) {
    console.error('Batch description API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate descriptions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
