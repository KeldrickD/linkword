import type { FrameContextType } from '../components/providers/FrameProvider';

/**
 * Mint a "Win" NFT for the given puzzle.
 * Expects metadata JSON in /public/metadata/{puzzleId}.json
 */
export async function mintWinNft(
  frame: FrameContextType,
  puzzleId: string
): Promise<boolean> {
  try {
    await frame.context?.nft.mint({
      to: [frame.context.identity.address],
      uri: `${process.env.NEXT_PUBLIC_BASE_URL}/metadata/${puzzleId}.json`,
    });
    return true;
  } catch (err) {
    console.error('NFT mint failed', err);
    return false;
  }
} 