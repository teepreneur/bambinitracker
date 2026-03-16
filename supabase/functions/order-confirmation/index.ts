import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload // record contains the new order with status 'paid'

    if (!record || record.status !== 'paid') {
      return new Response(JSON.stringify({ message: 'Not a paid order' }), { status: 200 })
    }

    // Fetch user email if not in record (webhook payloads usually have the record)
    // In this app, we might need to fetch the email from auth or just pass it in the orders table
    // For now, let's assume we might need to add an 'email' column to orders for easier processing
    // or fetch it here.
    
    // For this demonstration, we'll assume the email is available or we send to a default for testing
    const customerEmail = record.contact_email || 'customer@example.com' 
    const orderItems = record.items || []
    
    const itemsHtml = orderItems.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₵${item.price}</td>
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
              <td style="padding: 10px; font-weight: bold; text-align: right;">₵${record.total_amount}</td>
            </tr>
          </tfoot>
        </table>
        
        <p><strong>Shipping to:</strong><br/>${record.shipping_address}</p>
        <p><strong>Contact:</strong> ${record.contact_phone}</p>
        
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
        subject: `Order Confirmation - #${record.id.slice(0, 8)}`,
        html: emailHtml,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), { status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
