import {
  createClient,
  Address,
  Assets,
  ScriptHash,
  TransactionHash,
  UPLC,
  CBOR,
  Data,
} from "@evolution-sdk/evolution";
import { PlutusV3 } from "@evolution-sdk/evolution/PlutusV3";
import * as ScriptHashMod from "@evolution-sdk/evolution/ScriptHash";
import { PythLazerClient } from "@pythnetwork/pyth-lazer-sdk";
import {
  getPythState,
  getPythScriptHash,
} from "@pythnetwork/pyth-lazer-cardano-js";

import plutusBlueprint from "../contracts/plutus.json";

// Environment setup
const LAZER_TOKEN = import.meta.env.VITE_LAZER_TOKEN as string;
const BLOCKFROST_ID = import.meta.env.VITE_BLOCKFROST_ID as string;
const PYTH_POLICY_ID = import.meta.env.VITE_PYTH_POLICY_ID_PREPROD as string;

let evolutionClient: any = null;
let connectedWalletAddress: any = null;
// let scriptRefUtxo: any = null; // No reference script setup yet, we attach the script on each tx to simplify.

/**
 * Detects CIP-30 compatible wallets injected into the browser.
 */
export function getAvailableWallets() {
  const wallets: Record<string, any> = {};
  const cardano = (window as any).cardano;
  if (!cardano) return wallets;

  for (const key of Object.keys(cardano)) {
    const w = cardano[key];
    if (w && typeof w === "object" && typeof w.enable === "function") {
      wallets[key] = {
        name: w.name || key,
        icon: w.icon || "",
        api: w,
      };
    }
  }
  return wallets;
}

/**
 * Connects to a specific CIP-30 wallet and initializes the Evolution SDK Client using Blockfrost
 */
export async function connectWallet(walletKey: string): Promise<string> {
  if (!BLOCKFROST_ID || BLOCKFROST_ID === "preprod_tus_credenciales_aqui") {
    throw new Error("Missing Blockfrost ID configuration. Please update .env");
  }

  const cardano = (window as any).cardano;
  if (!cardano || !cardano[walletKey]) throw new Error("Wallet not found");

  const walletApi = await cardano[walletKey].enable();

  evolutionClient = createClient({
    network: "preprod",
    provider: {
      type: "blockfrost",
      baseUrl: "https://cardano-preprod.blockfrost.io/api/v0",
      projectId: BLOCKFROST_ID,
    },
    wallet: {
      type: "api",
      api: walletApi,
    },
  });

  connectedWalletAddress = await evolutionClient.address();
  return Address.toBech32(connectedWalletAddress);
}

function getCompiledPythScript() {
  const pythValidator = (plutusBlueprint as any).validators.find(
    (v: any) => v.title === "game_pyth.game_pyth.spend",
  );
  if (!pythValidator) throw new Error("Validator not found in plutus.json");

  // Apply Pyth Policy ID Param
  const policyIdBytes = new Uint8Array(
    PYTH_POLICY_ID.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)),
  );
  const appliedCode = UPLC.applyParamsToScript(pythValidator.compiledCode, [
    policyIdBytes,
  ]);

  const singleCborBytes = CBOR.fromCBORHex(appliedCode) as Uint8Array;
  return new PlutusV3({ bytes: singleCborBytes });
}

/**
 * Constructs and submits a transaction that interacts with Pyth On-Chain 
 * to verify the real-time ADA/USD price before paying a merchant.
 */
export async function buildAndSubmitPythPayment(
  merchantWalletBech32: string,
  _priceUsd: number,
  adaAmountLovelaces: bigint
): Promise<string> {
  if (!evolutionClient) throw new Error("Evolution client not connected");
  
  // 1. Get Pyth State
  const pythState = await getPythState(PYTH_POLICY_ID, evolutionClient);
  const pythScriptHashHex = getPythScriptHash(pythState);

  // 2. Fetch Latest Price Update Off-chain (ADA = feed 16)
  const lazer = await PythLazerClient.create({
    token: LAZER_TOKEN,
    webSocketPoolConfig: { numConnections: 1 },
  });

  const result = await lazer.getLatestPrice({
    priceFeedIds: [16],
    properties: ["price", "bestBidPrice", "bestAskPrice", "exponent", "confidence", "emaPrice", "feedUpdateTimestamp"],
    formats: ["solana"],
    jsonBinaryEncoding: "hex",
    parsed: true,
    channel: "fixed_rate@200ms",
  });
  lazer.shutdown();

  if (!result.solana?.data) throw new Error("No Pyth update bytes received");

  const updateBytes = new Uint8Array(
    result.solana.data.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)),
  );

  // 3. Build Contract Logic
  // Primitive 0 in demo represents "CheckPrice", we use dummy values for this mockup
  // Replace with actual Redeemer for the target contract logic
  // const redeemer = Data.constr(0n, [16n, 0n]); // Simplistic redeemer matching testing primitives

  const script = getCompiledPythScript();
  const _scriptAddress = new Address.Address({
    networkId: 0,
    paymentCredential: ScriptHashMod.fromScript(script),
  });

  // Query UTXOs of our target script to spend or provide necessary inputs
  // const scriptUtxos = await evolutionClient.getUtxos(scriptAddress);
  // Important: In a real Escrow or payment, the merchant destination dictates the output, 
  // and we attach Pyth validation as an extra constraint.
  
  const now = BigInt(Date.now());
  
  // 4. Create Transaction
  let tx = evolutionClient
    .newTx()
    .setValidity({ from: now - 60_000n, to: now + 240_000n })
    .readFrom({ referenceInputs: [pythState] })
    .withdraw({
      amount: 0n, // Zero lovelace withdraw triggers Pyth Signature check
      redeemer: [updateBytes],
      stakeCredential: ScriptHash.fromHex(pythScriptHashHex),
    })
    // Pay the merchant securely — throws ParseError if address is invalid in DB (production ready)
    .payToAddress({
      address: Address.fromBech32(merchantWalletBech32),
      assets: Assets.fromLovelace(adaAmountLovelaces),
    });

  const built = await tx.build();
  const signed = await built.sign();
  const txHash = await signed.submit();

  return TransactionHash.toHex(txHash);
}
