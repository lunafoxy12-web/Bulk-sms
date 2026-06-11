// ════════════════════════════════════════════════════════════
//  BulkReach Pro — ALL-IN-ONE PROXY
//  One server, multiple routes. Deploy once; every service works.
//
//  Routes:
//    POST /proxy/textbelt   → TextBelt
//    POST /proxy/bulksms    → BulkSMS.com
//    (add more below as you connect more providers)
//
//  Setup:
//    npm install
//    node server.js
//
//  In BulkReach, paste these into each service's "Proxy URL" field:
//    TextBelt :  https://YOUR-APP.onrender.com/proxy/textbelt
//    BulkSMS  :  https://YOUR-APP.onrender.com/proxy/bulksms
// ════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());            // lets your browser app talk to this proxy
app.use(express.json());

// Node 18+ has fetch built in. If on older Node, uncomment the next line
// and run: npm install node-fetch
// const fetch = (...a) => import('node-fetch').then(({default:f}) => f(...a));

// Simple health check — open the base URL in a browser to see it's alive
app.get('/', (req, res) => res.send('BulkReach proxy is running ✓'));

// ── TEXTBELT ──────────────────────────────────────────────
app.post('/proxy/textbelt', async (req, res) => {
  try {
    const { phone, message, key } = req.body;
    const r = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ phone, message, key })
    });
    res.status(r.status).send(await r.text());
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── BULKSMS.COM ───────────────────────────────────────────
// The app sends { to, body, encoding, from?, _cred }.
// _cred = base64("tokenId:tokenSecret"). We attach it server-side.
app.post('/proxy/bulksms', async (req, res) => {
  try {
    const { _cred, ...payload } = req.body;
    const r = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + _cred
      },
      body: JSON.stringify(payload)
    });
    res.status(r.status).send(await r.text());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADD MORE PROVIDERS HERE ───────────────────────────────
// app.post('/proxy/twilio', async (req, res) => { ... });
// app.post('/proxy/vonage', async (req, res) => { ... });

const PORT = process.env.PORT || 3000;   // Render/Railway set PORT automatically
app.listen(PORT, () => console.log('BulkReach proxy running on port ' + PORT));
