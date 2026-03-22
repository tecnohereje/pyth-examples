import { PythLazerClient } from "@pythnetwork/pyth-lazer-sdk";

export const PYTH_FEEDS = {
  ADA: { id: 16, type: "crypto", name: "ADA/USD" },
} as const;

export interface PriceData {
  price: number;
  bestBidPrice: number;
  bestAskPrice: number;
  confidence: number;
  timestampUs: string;
  solanaHex?: string; // Payload que se envía en el redeemer del smart contract
}

const toReal = (raw: string | undefined, expo: number): number =>
  raw ? Number(raw) * 10 ** expo : 0;

export class PythOracleService {
  private client: PythLazerClient | null = null;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async connect() {
    if (!this.client) {
      this.client = await PythLazerClient.create({
        token: this.token,
        webSocketPoolConfig: { numConnections: 1 },
      });
    }
  }

  async getLatestAdaUsdPrice(): Promise<PriceData> {
    if (!this.client) await this.connect();

    const result = await this.client!.getLatestPrice({
      priceFeedIds: [PYTH_FEEDS.ADA.id],
      properties: ["price", "bestBidPrice", "bestAskPrice", "confidence", "exponent", "feedUpdateTimestamp"],
      formats: ["solana"], 
      jsonBinaryEncoding: "hex",
      parsed: true,
      channel: "fixed_rate@200ms",
    });

    if (!result.parsed || result.parsed.priceFeeds.length === 0) {
      throw new Error("No price data returned from Pyth Lazer");
    }

    const feed = result.parsed.priceFeeds[0];
    const expo = feed.exponent || -8;

    return {
      price: toReal(feed.price, expo),
      bestBidPrice: toReal(feed.bestBidPrice, expo),
      bestAskPrice: toReal(feed.bestAskPrice, expo),
      confidence: toReal(feed.confidence, expo),
      timestampUs: result.parsed.timestampUs,
      solanaHex: result.solana?.data,
    };
  }

  shutdown() {
    if (this.client) {
      this.client.shutdown();
      this.client = null;
    }
  }
}
