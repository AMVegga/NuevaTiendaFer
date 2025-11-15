// server.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));


const app = express();
app.use(bodyParser.json({
  verify: (req, res, buf) => { // keep raw body for PayPal webhook verification
    req.rawBody = buf.toString();
  }
}));

const PORT = process.env.PORT || 4000;
const PAYPAL_BASE = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Connect to SUPABASE
supabase.connect(process.env.SUPABASE_URL, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(()=>console.log('SUPABASE conectada'))
  .catch(err=>{ console.error('SUPABASE error', err); process.exit(1); });

// Helper: get PayPal access token
async function getPayPalToken(){
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(`${PAYPAL_BASE}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return res.data.access_token;
}

// Endpoint: create order on server (recommended)
app.post('/api/create-order', async (req, res) => {
  try {
    const { items } = req.body; // items: [{name, unit_amount: {value, currency_code}, quantity}]
    if(!items || items.length===0) return res.status(400).json({error:'Carrito vacío'});

    const accessToken = await getPayPalToken();

    // calculate total
    const total = items.reduce((s,it) => s + (parseFloat(it.unit_amount.value) * parseInt(it.quantity)), 0).toFixed(2);

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: total,
          breakdown: {
            item_total: { currency_code: "USD", value: total }
          }
        },
        items
      }],
      application_context: {
        brand_name: "BlueVibe",
        user_action: "PAY_NOW",
        return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/?success=true`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/?cancel=true`
      }
    };

    const createRes = await axios.post(`${PAYPAL_BASE}/v2/checkout/orders`, orderPayload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });

    // Save a pending order in DB (optional)
    await supabase
  .from('orders')
  .insert({
    paypal_order_id: createRes.data.id,
    status: 'CREATED',
    items,
    amount: total,
    raw: createRes.data
  });

    res.json({ id: createRes.data.id });
  } catch (err) {
    console.error('create-order error', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Error creando orden' });
  }
});

// Endpoint: capture order (if you prefer server-side capture)
app.post('/api/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body;
    if(!orderID) return res.status(400).json({error:'orderID requerido'});
    const token = await getPayPalToken();
    const cap = await axios.post(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {}, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    // Update DB order status
    await supabase
  .from('orders')
  .update({
    status: cap.data.status,
    raw: cap.data,
    captured_at: new Date().toISOString()
  })
  .eq('paypal_order_id', orderID);

    res.json(cap.data);
  } catch (err) {
    console.error('capture-order error', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Error capturando orden' });
  }
});

// Webhook endpoint: PayPal will POST events here
app.post('/api/paypal-webhook', async (req, res) => {
  // PayPal recommends verifying signature via /v1/notifications/verify-webhook-signature
  try {
    const transmissionId = req.headers['paypal-transmission-id'];
    const transmissionTime = req.headers['paypal-transmission-time'];
    const certUrl = req.headers['paypal-cert-url'];
    const authAlgo = req.headers['paypal-auth-algo'];
    const transmissionSig = req.headers['paypal-transmission-sig'];
    const webhookId = process.env.PAYPAL_WEBHOOK_ID; // id you get from PayPal dashboard

    if(!webhookId){
      console.warn('PAYPAL_WEBHOOK_ID no configurado. No se verificará la firma.');
      // Optionally accept but better to verify.
    } else {
      const token = await getPayPalToken();
      const verifyRes = await axios.post(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: req.body
      }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if(verifyRes.data.verification_status !== 'SUCCESS'){
        console.warn('Webhook verification failed', verifyRes.data);
        return res.status(400).send('Invalid webhook signature');
      }
    }

    const event = req.body;
    // handle common events
    if(event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      // store/mark order as paid
      const paypalOrderId = event.resource.id || event.resource.supplementary_data?.related_ids?.order_id || event.resource.order_id;
      // This path varies by event type; attempt common fields:
      const orderId = paypalOrderId || (event.resource && (event.resource.order_id || event.resource.id));
      await orderId.findOneAndUpdate(
        { paypalOrderId: orderId },
        { status: event.event_type, webhookEvent: event },
        { upsert: true, new: true }
      );
      console.log('Pedido actualizado por webhook:', orderId);
    } else {
      // store event for records
      await Order.create({ status: event.event_type, rawWebhook: event });
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook handler error', err.response?.data || err.message || err);
    res.status(500).send('Server error');
  }
});

// Simple endpoint to list orders (for admin)
app.get('/api/orders', async (req, res) => {
  const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(200);
res.json(orders);

});

app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
