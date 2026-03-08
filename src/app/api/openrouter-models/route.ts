import { NextRequest, NextResponse } from 'next/server';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
  architecture?: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
}

interface FormattedModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  promptPrice: string;
  completionPrice: string;
  hasVision: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch models: ${response.status} - ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format and filter models
    const models: FormattedModel[] = data.data.map((model: OpenRouterModel) => {
      const id = model.id;
      const parts = id.split('/');
      const provider = parts[0] || 'unknown';

      // Check vision capability
      const hasVision = checkVisionCapability(id, model);

      return {
        id: model.id,
        name: model.name || model.id.split('/').pop() || model.id,
        provider,
        contextLength: model.context_length || 4096,
        promptPrice: model.pricing?.prompt || '0',
        completionPrice: model.pricing?.completion || '0',
        hasVision,
      };
    });

    // Sort by popularity (put common providers first)
    const providerOrder = ['openai', 'anthropic', 'google', 'meta-llama', 'mistralai', 'deepseek'];
    models.sort((a, b) => {
      const aIndex = providerOrder.findIndex(p => a.provider.includes(p));
      const bIndex = providerOrder.findIndex(p => b.provider.includes(p));
      if (aIndex === -1 && bIndex === -1) return a.provider.localeCompare(b.provider);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return NextResponse.json({
      success: true,
      models,
      total: models.length,
    });
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function checkVisionCapability(modelId: string, model: OpenRouterModel): boolean {
  const modelLower = modelId.toLowerCase();

  // Check modality
  if (model.architecture?.modality?.includes('image')) {
    return true;
  }

  // Check common vision model patterns
  const visionPatterns = [
    'vision',
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4-vision',
    'claude-3',
    'gemini',
    'llava',
    'qwen-vl',
    'cogvlm',
    'idefics',
    'pixtral',
    'llama-3.2-11b',
    'llama-3.2-90b',
  ];

  return visionPatterns.some(pattern => modelLower.includes(pattern));
}
