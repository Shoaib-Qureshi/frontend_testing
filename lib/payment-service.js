const crypto = require('crypto');

class RazorpayService {
  constructor(config) {
    this.config = config;
  }

  isConfigured() {
    return Boolean(this.config.razorpay.keyId && this.config.razorpay.keySecret);
  }

  async request(method, endpoint, payload) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured.');
    }

    const response = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${this.config.razorpay.keyId}:${this.config.razorpay.keySecret}`
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.description || data?.error?.reason || 'Razorpay request failed.';
      throw new Error(message);
    }

    return data;
  }

  async createOrder({ amount, receipt, notes = {} }) {
    return this.request('POST', '/orders', {
      amount,
      currency: this.config.razorpay.currency,
      receipt,
      notes,
    });
  }

  async createPlan(product) {
    const amount = Math.round(Number(product.priceInr || 0) * 100);
    return this.request('POST', '/plans', {
      period: 'monthly',
      interval: 1,
      item: {
        name: product.name,
        amount,
        currency: product.currency || this.config.razorpay.currency,
        description: `${product.name} monthly subscription`,
      },
      notes: {
        productId: product.id,
        productCode: product.code,
      },
    });
  }

  async createSubscription({ planId, totalCount = 120, notes = {} }) {
    return this.request('POST', '/subscriptions', {
      plan_id: planId,
      total_count: totalCount,
      customer_notify: 1,
      notes,
    });
  }

  verifyWebhookSignature(rawBody, signature) {
    if (!this.config.razorpay.webhookSecret || !signature) {
      return false;
    }

    const digest = crypto
      .createHmac('sha256', this.config.razorpay.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  }

  verifyOrderSignature({ orderId, paymentId, signature }) {
    if (!signature || !orderId || !paymentId || !this.config.razorpay.keySecret) {
      return false;
    }

    const digest = crypto
      .createHmac('sha256', this.config.razorpay.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  }

  verifySubscriptionSignature({ subscriptionId, paymentId, signature }) {
    if (!signature || !subscriptionId || !paymentId || !this.config.razorpay.keySecret) {
      return false;
    }

    const digest = crypto
      .createHmac('sha256', this.config.razorpay.keySecret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  }
}

module.exports = {
  RazorpayService,
};
