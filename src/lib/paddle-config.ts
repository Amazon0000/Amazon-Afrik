// Paddle client-side token (Paddle.js) — real, live, provided for this
// project. This is the public/frontend-embeddable counterpart to the
// server-side Paddle API key already used in
// supabase/functions/_shared/paddle.ts (which creates the actual
// transaction and returns a hosted checkout.url — Zando's ad-campaign
// payment flow uses that redirect-to-checkout.url approach today,
// exactly like the Stripe/Flutterwave/PayUnit flows, so it works without
// this token).
//
// This constant is for the OTHER legitimate Paddle integration style —
// Paddle.js's inline/overlay checkout, opened client-side for an
// existing transaction id (Paddle.Checkout.open({ transactionId })) —
// which is a genuinely nicer UX (no full-page redirect) but requires
// loading Paddle.js and exposing the created transaction's id to the
// frontend. Wiring it in is a real but separate follow-up (it would mean
// extending ads-create-payment's response to also return the raw Paddle
// transaction id, not just the redirect URL) — kept here, documented and
// ready, rather than forced into today's flow without being able to test
// it against a live Paddle sandbox first.
export const PADDLE_CLIENT_TOKEN = 'live_9743c25ef8324a998b966c0bc8d';

declare global {
  interface Window {
    Paddle?: {
      Initialize: (opts: { token: string }) => void;
      Checkout: { open: (opts: { transactionId: string }) => void };
    };
  }
}

export function loadPaddleJs(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Paddle) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.onload = () => {
      window.Paddle?.Initialize({ token: PADDLE_CLIENT_TOKEN });
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Paddle.js'));
    document.head.appendChild(script);
  });
}
