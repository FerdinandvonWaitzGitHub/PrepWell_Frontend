// PW-201: Edge Function - OCR Screenshot via OCR.space API
// Deploy: supabase functions deploy ocr-screenshot

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OCR_API_URL = 'https://api.ocr.space/parse/image'
const OCR_API_KEY = Deno.env.get('OCR_SPACE_API_KEY') || 'helloworld' // Free tier key

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // PW-208: Log only size, never image content
    console.log('Processing image, size:', image.length)

    // Call OCR.space API
    const formData = new FormData()
    formData.append('base64Image', `data:image/png;base64,${image}`)
    formData.append('language', 'ger') // German
    formData.append('isTable', 'true') // Better table recognition
    formData.append('OCREngine', '2')  // Engine 2 is better for tables
    formData.append('scale', 'true')   // Auto-scale for better results

    const ocrResponse = await fetch(OCR_API_URL, {
      method: 'POST',
      headers: { 'apikey': OCR_API_KEY },
      body: formData,
    })

    const ocrData = await ocrResponse.json()

    // Check for OCR errors
    if (ocrData.IsErroredOnProcessing) {
      console.error('OCR processing error:', ocrData.ErrorMessage?.[0] || 'Unknown error')
      return new Response(
        JSON.stringify({ error: 'ocr_failed', details: ocrData.ErrorMessage?.[0] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract text and split into lines
    const text = ocrData.ParsedResults?.[0]?.ParsedText || ''
    const lines = text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)

    // Check for empty result
    if (lines.length === 0) {
      return new Response(
        JSON.stringify({ error: 'no_text_found', text: '', lines: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('OCR successful, lines extracted:', lines.length)

    return new Response(
      JSON.stringify({ text, lines }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error.message)
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
