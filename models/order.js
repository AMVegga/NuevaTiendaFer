// models/Order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  paypalOrderId: { type: String, index: true },
  status: { type: String },
  items: { type: Array, default: [] },
  amount: { type: Number },
  raw: { type: Schema.Types.Mixed },
  webhookEvent: { type: Schema.Types.Mixed },
  rawWebhook: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  capturedAt: { type: Date }
});

module.exports = mongoose.model('Order', OrderSchema);
