// T14: Edge Function - Notify Admin on New User Registration
// Deploy: supabase functions deploy notify-admin

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Configure your admin email here or use environment variable
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@prepwell.de'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://vitvxwfcutysuifuqnqi.supabase.co'

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const { record } = await req.json()

    if (!record) {
      return new Response(JSON.stringify({ error: 'No record provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Format date for German locale
    const registeredAt = new Date(record.created_at).toLocaleString('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const userName = record.full_name || 'Nicht angegeben'
    const userEmail = record.email

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PrepWell <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject: `Neuer User wartet auf Freischaltung: ${userEmail}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Neuer User registriert</h1>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Registriert am:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${registeredAt}</td>
              </tr>
            </table>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 12px 0; font-weight: 500; color: #92400e;">Um den User freizuschalten:</p>
              <code style="display: block; background: #1f2937; color: #f9fafb; padding: 12px; border-radius: 4px; font-size: 13px; overflow-x: auto;">
UPDATE profiles SET approved = true, approved_at = now() WHERE email = '${userEmail}';
              </code>
            </div>

            <p style="margin-top: 20px;">
              <a href="https://supabase.com/dashboard/project/vitvxwfcutysuifuqnqi/editor"
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Zum Supabase Dashboard
              </a>
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">
              Diese E-Mail wurde automatisch von PrepWell gesendet.
            </p>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: errorData }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = await emailResponse.json()
    console.log('Admin notification sent for:', userEmail)

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in notify-admin:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
