import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Allowed models (cheaper options only - NO OPUS!)
const ALLOWED_MODELS = [
  'claude-haiku-20240307',      // Cheapest option
  'claude-sonnet-4-20250514',   // Mid-tier (current default)
  'claude-3-5-sonnet-20241022', // Alternative Sonnet version
  'claude-3-haiku-20240307',    // Alternative Haiku version
];

// Default to Haiku (cheapest) unless specified
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-20240307';

// Validate model is not Opus and is in allowed list
function validateModel(model: string): string {
  const normalizedModel = model.toLowerCase().trim();
  
  // STRICT BLOCK: Never allow Opus models (most expensive)
  if (normalizedModel.includes('opus')) {
    console.error(`❌ BLOCKED: Opus model detected: ${model}`);
    console.error(`❌ Opus is expensive and not allowed. Using default: ${DEFAULT_MODEL}`);
    return DEFAULT_MODEL;
  }
  
  // Check if model exactly matches an allowed model
  const exactMatch = ALLOWED_MODELS.find(allowed => 
    normalizedModel === allowed.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch; // Return the canonical version
  }
  
  // Check if model contains an allowed model name (for flexibility)
  const partialMatch = ALLOWED_MODELS.find(allowed => {
    const allowedName = allowed.toLowerCase().replace('claude-', '').split('-')[0]; // e.g., "haiku" or "sonnet"
    return normalizedModel.includes(allowedName) && !normalizedModel.includes('opus');
  });
  
  if (partialMatch) {
    console.log(`Using allowed model variant: ${partialMatch} (requested: ${model})`);
    return partialMatch;
  }
  
  // If not in allowed list, use default
  console.warn(`⚠️  Model ${model} not in allowed list. Using default: ${DEFAULT_MODEL}`);
  return DEFAULT_MODEL;
}

// Get the model to use (validated and safe)
function getSafeModel(): string {
  const requestedModel = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  return validateModel(requestedModel);
}

export async function generateWithClaude(prompt: string) {
  const model = getSafeModel();
  
  // Double-check: Never allow Opus
  if (model.toLowerCase().includes('opus')) {
    throw new Error('Opus model is blocked for cost control. Please use Haiku or Sonnet.');
  }
  
  try {
    console.log(`Using Anthropic model: ${model} (Opus blocked for cost control)`);
    
    const message = await client.messages.create({
      model: model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

export async function generateJSONWithClaude(prompt: string) {
  const fullPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown formatting, no explanations.`;
  const text = await generateWithClaude(fullPrompt);
  
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }
  
  return JSON.parse(cleaned);
}