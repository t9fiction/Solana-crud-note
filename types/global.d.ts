
type Note = {
    author: PublicKey;       // Solana pubkey
    title: string;           // max 100 chars
    content: string;         // max 1000 chars
    created_at: number;      // i64 (timestamp)
    last_updated: number;    // i64 (timestamp)
  };