import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface MaterialExtraction {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  notes?: string;
}

export interface ProjectMeasurements {
  grossSqFt?: number;
  firstFloorSqFt?: number;
  secondFloorSqFt?: number;
  overallWidthFt?: number;
  overallDepthFt?: number;
  wallHeightFt?: number;
  bedroomCount?: number;
  bathroomCount?: number;
  windowCount?: number;
  doorCount?: number;
  garageSize?: string;
  roofPitch?: string;
  foundationType?: string;
}

export interface AnalysisResult {
  projectType: string;
  measurements: ProjectMeasurements;
  materials: MaterialExtraction[];
  keyFindings: string[];
  confidence: 'high' | 'medium' | 'low';
}

export async function analyzePDFWithClaude(
  pdfBase64: string,
  analysisType: 'quick' | 'detailed' = 'detailed'
): Promise<AnalysisResult> {
  const systemPrompt = `You are an expert construction estimator analyzing residential construction plans. Extract all measurements, quantities, and project details.

Return ONLY valid JSON in this exact structure:
{
  "projectType": "string",
  "measurements": {
    "grossSqFt": number,
    "firstFloorSqFt": number,
    "secondFloorSqFt": number,
    "overallWidthFt": number,
    "overallDepthFt": number,
    "wallHeightFt": number,
    "bedroomCount": number,
    "bathroomCount": number,
    "windowCount": number,
    "doorCount": number,
    "garageSize": "string",
    "roofPitch": "string",
    "foundationType": "string"
  },
  "materials": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "category": "string",
      "notes": "string"
    }
  ],
  "keyFindings": ["string"],
  "confidence": "high|medium|low"
}`;

  const userPrompt = analysisType === 'quick'
    ? 'Provide a quick analysis focusing on major measurements and material categories.'
    : 'Provide a detailed analysis with precise measurements and comprehensive material takeoffs.';

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: analysisType === 'quick' ? 2048 : 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const result: AnalysisResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    throw new Error(
      `Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function askQuestionAboutPlan(
  pdfBase64: string,
  question: string
): Promise<string> {
  const systemPrompt = `You are an expert construction estimator. Answer questions about construction plans accurately and concisely.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: question,
            },
          ],
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text;
  } catch (error) {
    console.error('Error asking question:', error);
    throw new Error(
      `Failed to process question: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
