import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(process.env.SOLANA_RPC_URL);

export async function fetchTokenAuthority(mint) {
  try {
    const mintPubkey = new PublicKey(mint);
    const info = await connection.getParsedAccountInfo(mintPubkey);
    const data = info?.value?.data?.parsed?.info;
    if (!data) return { checked: false };

    return {
      checked: true,
      mintAuthorityActive: data.mintAuthority !== null,
      freezeAuthorityActive: data.freezeAuthority !== null,
    };
  } catch {
    return { checked: false };
  }
}
