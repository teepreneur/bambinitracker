import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
// Shared secret sent by the database trigger (see the order_webhook_secret
// migration). Requests without a matching secret are rejected so this endpoint
// cannot be used by third parties to send mail from our domain.
const WEBHOOK_SECRET = Deno.env.get('ORDER_WEBHOOK_SECRET')

// Escape user-controlled values before interpolating them into the HTML email.
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record, secret } = payload

    // Verify the shared secret (header or body) before doing anything else.
    const providedSecret = req.headers.get('x-webhook-secret') || secret
    if (!WEBHOOK_SECRET || providedSecret !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    if (!record || record.status !== 'paid') {
      return new Response(JSON.stringify({ message: 'Not a paid order' }), { status: 200 })
    }

    const customerEmail = record.contact_email || 'customer@example.com'
    const orderItems = Array.isArray(record.items) ? record.items : []

    const itemsHtml = orderItems.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item?.name)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₵${escapeHtml(item?.price)}</td>
      </tr>
    `).join('')

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2CC5BD;">Bambini Tracker - Order Confirmed!</h2>
        <p>Hi there,</p>
        <p>Thank you for your purchase! Your developmental kit is being prepared for shipping.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f9f5ea;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Total</td>
              <td style="padding: 10px; font-weight: bold; text-align: right;">₵${escapeHtml(record.total_amount)}</td>
            </tr>
          </tfoot>
        </table>

        <p><strong>Shipping to:</strong><br/>${escapeHtml(record.shipping_address)}</p>
        <p><strong>Contact:</strong> ${escapeHtml(record.contact_phone)}</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Bambini Tracker - Nurturing every milestone.</p>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Bambini Tracker <orders@bambinitracker.com>',
        to: [customerEmail],
        subject: `Order Confirmation - #${String(record.id).slice(0, 8)}`,
        html: emailHtml,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), { status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
