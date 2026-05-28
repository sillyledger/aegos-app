import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a company intelligence parser. Given a company name or website URL, extract structured data and return ONLY a valid JSON object — no markdown, no backticks, no explanation.

Return exactly these fields:
{
  "company_name": string,
  "company_description": string (2 sentences max),
  "website": string (full URL with https://) or null,
  "hq_city": string or null,
  "hq_country": string or null,
  "sector_primary": string or null,
  "sector_secondary": string or null,
  "founding_year": number or null,
  "employee_count": string (e.g. "1,000–5,000") or null,
  "business_model": string or null,
  "ownership_type": "Private" or "Public",
  "stage": "Seed" | "Series A" | "Series B" | "Series C" | "Growth" | "Public" | "Unknown",
  "latest_round_amount_usd": number or null,
  "latest_round_date": string (YYYY-MM format) or null,
  "total_raised_usd": number or null,
  "lead_investor": string or null
}

Return only the JSON object. Nothing else.`;

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 500 });
  }

  let body: { input?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const input = String(body?.input || '').trim();
  if (!input) {
    return NextResponse.json({ error: 'Input is required.' }, { status: 400 });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
      }),
    });

    const payload = await groqRes.json().catch(() => ({}));

    if (!groqRes.ok) {
      return NextResponse.json(
        { error: payload?.error?.message || 'Groq request failed.' },
        { status: groqRes.status }
      );
    }

    const raw: string = payload.choices?.[0]?.message?.content || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();

    let data;
    try {
      data = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: 'AI returned unparseable data. Try again.' }, { status: 500 });
    }

    // Normalise partial dates: "2023-06" → keep as-is, bare year "2023" → "2023-01"
    if (data.latest_round_date && /^\d{4}$/.test(data.latest_round_date)) {
      data.latest_round_date = `${data.latest_round_date}-01`;
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
