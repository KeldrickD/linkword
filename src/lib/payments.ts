import type { FrameContextType } from '../components/providers/FrameProvider';

// Price mapping per unit
const PRICE_MAP = {
  extraPlays: 0.25,  // $0.25 per 2 plays
  hint2: 0.10,       // $0.10 for revealing second letter
  hint3: 0.20,       // $0.20 for revealing clue sentence
};

/**
 * Launch an x402 micro-payment via Frame.
 * Returns true if payment succeeds.
 */
export async function purchaseUnit(
  frame: FrameContextType,
  type: 'extraPlays' | 'hint2' | 'hint3',
  units = 1
): Promise<boolean> {
  const price = PRICE_MAP[type] * units;
  try {
    // Use the Frame SDK to request payment
    await frame.context?.payments.request({
      to: process.env.NEXT_PUBLIC_X402_RECIPIENT!,
      amount: price.toString(),
      currency: 'USD',
      metadata: { type, units },
    });
    return true;
  } catch (err) {
    console.error('Payment failed', err);
    return false;
  }
} 