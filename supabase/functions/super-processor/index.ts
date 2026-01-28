// PW-211: Edge Function - Mistral OCR + KI-Parser
// Deploy: supabase functions deploy super-processor --no-verify-jwt
// Secret: MISTRAL_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY')
const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr'
const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Du bist ein Parser für universitäre Terminpläne und Gliederungen.
Analysiere den Text und extrahiere die Struktur als JSON.

Regeln:
- "fach": Name des Kurses/Fachs (aus Überschrift oder Kontext)
- "kapitel": Nur wenn eindeutige Kapitel-Ebene erkennbar (z.B. "I. Allgemeiner Teil")
- "themen": Hauptlernthemen (z.B. "Willenserklärung", "Tatbestand")
- "aufgaben": Untergeordnete Punkte eines Themas (z.B. "a) objektiv", "b) subjektiv")
- Ignoriere: Datumsangaben, Uhrzeiten, Raumnummern, Dozentennamen
- Markiere Ferien/Feiertage NICHT als Themen

Antworte NUR mit validem JSON:
{
  "fach": "string oder null",
  "kapitel": [{ "name": "string", "themen": [{ "name": "string", "aufgaben": ["string"] }] }],
  "themen": [{ "name": "string", "aufgaben": ["string"] }]
}`

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image } = await req.json()

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'image_missing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!MISTRAL_API_KEY) {
      console.error('MISTRAL_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'api_key_missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PW-208: Log only size, never image content
    console.log('Processing image, size:', image.length)

    // ============================================
    // Step 1: Mistral OCR - Bild → Text
    // ============================================
    const ocrResponse = await fetch(MISTRAL_OCR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'image_url',
          image_url: `data:image/png;base64,${image}`
        }
      })
    })

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text()
      console.error('Mistral OCR Error:', ocrResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: 'ocr_failed', details: errorText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ocrData = await ocrResponse.json()
    const rawText = ocrData.pages?.map((p: any) => p.markdown).join('\n') || ''

    console.log('OCR successful, text length:', rawText.length)

    // Check for empty OCR result
    if (!rawText.trim()) {
      return new Response(
        JSON.stringify({
          error: 'no_text_found',
          fach: null,
          kapitel: [],
          themen: [],
          lines: [],
          raw_text: ''
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================
    // Step 2: Mistral Chat - Text → JSON
    // ============================================
    const chatResponse = await fetch(MISTRAL_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: rawText }
        ]
      })
    })

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text()
      console.error('Mistral Chat Error:', chatResponse.status, errorText)

      // Fallback: Return raw text as lines (for preview editing)
      const lines = rawText.split('\n').filter((l: string) => l.trim())
      return new Response(
        JSON.stringify({
          fach: null,
          kapitel: [],
          themen: [],
          lines: lines,
          raw_text: rawText
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const chatData = await chatResponse.json()
    const content = chatData.choices?.[0]?.message?.content || '{}'

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // Fallback to raw lines
      const lines = rawText.split('\n').filter((l: string) => l.trim())
      return new Response(
        JSON.stringify({
          fach: null,
          kapitel: [],
          themen: [],
          lines: lines,
          raw_text: rawText
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Parsing successful, themen:', parsed.themen?.length || 0)

    // Also include lines for backwards compatibility with current frontend
    const lines = rawText.split('\n').filter((l: string) => l.trim())

    return new Response(
      JSON.stringify({
        ...parsed,
        lines: lines,
        raw_text: rawText
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error.message)
    return new Response(
      JSON.stringify({ error: 'internal_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
