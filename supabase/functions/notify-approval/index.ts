// T14: Edge Function - Notify User When Approved
// Deploy: supabase functions deploy notify-approval

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://app.prepwell.de'

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

    const { record, old_record } = await req.json()

    if (!record || !old_record) {
      return new Response(JSON.stringify({ error: 'Missing record data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Only send email if approved changed from false to true
    if (old_record.approved === true || record.approved !== true) {
      console.log('Approval status unchanged or not approved, skipping email')
      return new Response(JSON.stringify({ skipped: true, reason: 'Not a new approval' }), {
        status: 200,
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

    const userName = record.full_name || 'dort'
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
        to: userEmail,
        subject: 'Dein PrepWell-Account wurde freigeschaltet!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 30px 0;">
              <h1 style="color: #2563eb; margin: 0;">PrepWell</h1>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">&#10003;</div>
              <h2 style="color: #065f46; margin: 0 0 10px 0;">Account freigeschaltet!</h2>
            </div>

            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Hallo ${userName}!
            </p>

            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Gute Nachrichten: Dein PrepWell-Account wurde freigeschaltet.
              Du kannst dich jetzt einloggen und mit deiner Examensvorbereitung loslegen.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}"
                 style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Jetzt einloggen
              </a>
            </div>

            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Was dich erwartet:</strong>
              </p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
                <li>Personalisierte Lernplaene fuer dein Staatsexamen</li>
                <li>Kalender zur Planung deiner Lernbloecke</li>
                <li>Fortschrittstracking und Statistiken</li>
                <li>Check-In System fuer taegliche Reflexion</li>
              </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Du erhaeltst diese E-Mail, weil du dich bei PrepWell registriert hast.<br />
              Bei Fragen erreichst du uns unter support@prepwell.de
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
    console.log('Approval notification sent to:', userEmail)

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in notify-approval:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
