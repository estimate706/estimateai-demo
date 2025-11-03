// app/api/ask/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function askOpenAI(question: string, context?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is missing');

  const system = `
You are an estimating assistant. Answer concisely and practically for residential construction.
If you lack specific numbers from context, state assumptions clearly.
`;

  const user = `
Question: ${question}

Context (optional):
${context ?? '—'}
`;

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.3,
      input: [
        { role: 'system', content: [{ type: 'text', text: system }] },
        { role: 'user', content: [{ type: 'text', text: user }] },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error: ${t}`);
  }

  const data = await res.json();
  const text =
    data?.output?.[0]?.content?.[0]?.text ??
    data?.content?.[0]?.text ??
    data?.output_text ??
    JSON.stringify(data);

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { question, context } = await req.json();
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const answer = await askOpenAI(question, context);
    return NextResponse.json({ ok: true, answer }, { status: 200 });
  } catch (err: any) {
    console.error('ask error:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Ask endpoint failed' },
      { status: 500 }
    );
  }
}

