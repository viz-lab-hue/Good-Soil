// api/lead.js - Vercel Serverless Function
// Catches leads (phone numbers, emails, bookings, inquiries) and logs them into Google Sheets.

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // Normalize lead data
    const phone = data.phone || data.contact || '';
    const email = data.email || (data.contact && String(data.contact).includes('@') ? data.contact : '');
    const name = data.name || data.parentName || 'Anonymous Visitor';

    if (!phone && !email && !data.name) {
      return res.status(400).json({ error: 'Missing contact info. Phone or email is required.' });
    }

    const leadPayload = {
      timestamp: new Date().toISOString(),
      type: data.type || 'General Lead',
      name: name,
      phone: phone,
      email: email,
      age: data.age || data.childAge || '',
      format: data.format || data.interest || data.title || '',
      details: data.details || data.message || (data.items ? JSON.stringify(data.items) : ''),
      pageUrl: data.pageUrl || data.url || ''
    };

    // Webhook URL configured in Vercel Environment Variables
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload),
          redirect: 'follow'
        });

        const textResponse = await response.text();
        return res.status(200).json({
          success: true,
          message: 'Lead recorded to Google Sheet successfully',
          sheetResponse: textResponse,
          lead: leadPayload
        });
      } catch (sheetError) {
        console.error('Google Sheet webhook fetch failed:', sheetError);
        return res.status(200).json({
          success: true,
          warning: 'Captured locally, but Google Sheet webhook timed out',
          lead: leadPayload
        });
      }
    } else {
      // If GOOGLE_SHEET_WEBHOOK_URL is not yet set in Vercel environment variables
      console.log('Lead captured (Google Sheet Webhook URL pending):', leadPayload);
      return res.status(200).json({
        success: true,
        message: 'Lead captured. Note: set GOOGLE_SHEET_WEBHOOK_URL in Vercel to auto-sync to your Google Sheet.',
        lead: leadPayload
      });
    }
  } catch (error) {
    console.error('Lead capture error:', error);
    return res.status(500).json({ error: 'Failed to process lead', details: error.message });
  }
}
