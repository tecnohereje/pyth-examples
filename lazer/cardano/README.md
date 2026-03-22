# Team HackSabbath: Game Project

A modern web application demonstrating the integration of **Pyth Network** on-chain price oracles with the **Cardano** blockchain, set within a gamified commercial ecosystem.

## Team Details
- **Team Name:** HackSabbath
- **Team Members:** Melitón (@balboame), Cristian (@crcristian97), Santino (@santinopuglia), José (@tecnohereje), Matthieu (@mpizenberg)
- **Contact:** matthieu.pizenberg@gmail.com

---

## Project Overview

This project is a full-stack application that enables real-time commercial operations (e.g., product purchases) using verified ADA/USD price data from the Pyth Network. It ensures that payments made in ADA correctly reflect a USD-denominated price at the moment of the transaction, verified both off-chain (convenience) and on-chain (security).

### Key Features
- **On-Chain Price Verification:** Uses Pyth Lazer to fetch signed price updates and verifies them within a Plutus V3 smart contract.
- **Cardano Wallet Integration:** Support for CIP-30 compatible wallets (Nami, Eternl, Lace, etc.) via the Evolution SDK.
- **Merchant & User System:** A complete backend to manage products, missions, notifications, and user roles.
- **Multilingual Support:** Fully internationalized frontend (i18next).

---

## Technical Architecture

### Frontend (Client)
- **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/).
- **Blockchain Interface:** 
  - [@evolution-sdk/evolution](https://www.npmjs.com/package/@evolution-sdk/evolution): For transaction building and wallet interaction.
  - [@pythnetwork/pyth-lazer-cardano-js](https://www.npmjs.com/package/@pythnetwork/pyth-lazer-cardano-js): Helps retrieve Pyth state and script hashes.
  - [@pythnetwork/pyth-lazer-sdk](https://www.npmjs.com/package/@pythnetwork/pyth-lazer-sdk): Fetches signed price updates from Pyth Lazer.
- **State Management:** [Zustand](https://github.com/pmndrs/zustand).
- **Styling:** Tailwind CSS.

### Backend (Server)
- **Framework:** [Fastify](https://www.fastify.io/) (High-performance Node.js framework).
- **ORM:** [Prisma](https://www.prisma.io/) with SQLite (development).
- **modules:**
  - `auth`: JWT-based authentication.
  - `merchant`: Management of products and orders for registered merchants.
  - `missions`: Gamification layer for users to complete tasks.
  - `notifications`: Web-push notifications for user engagement.

### Blockchain & Smart Contracts
- **Aiken:** Smart contracts written in the [Aiken](https://aiken-lang.org/) language.
- **Plutus V3:** Utilizes the latest Cardano ledger features (V3) for efficient price consumption.
- **Pyth Integration:** 
  - Off-chain: Fetches `solana` formatted (little-endian Ed25519 signed) updates.
  - On-chain: Performs a **zero-withdrawal** from the Pyth verification script, providing the update bytes as a redeemer. This ensures the price is verified by the Pyth protocol before your own validator consumes the data.

---

## How it uses Pyth Network

1. **Fetching:** The client connects to Pyth Lazer via WebSocket/REST to get the latest `ADA/USD` (Feed ID 16) price updates.
2. **Transaction Building:** When a user initiates a payment, the `Evolution SDK` constructs a transaction that includes:
   - The **Pyth State UTxO** as a reference input.
   - A **Zero-Withdrawal** from the Pyth verification script.
   - The **Signed Update Bytes** as the withdrawal redeemer.
3. **Validation:** The transaction is submitted to the Cardano network (Preprod). Theledger ensures that the Pyth verification script validates the signatures in the redeemer. Once validated, other scripts in the same transaction can reliably read the verified price from the transaction context.

---

## Implications and Benefits

- **Trustless Conversion:** Eliminates the need for a centralized service to dictate the ADA/USD exchange rate during checkout.
- **High Frequency:** Pyth Lazer provides low-latency updates (200ms), ensuring the user pays a fair, market-accurate price.
- **Security:** Signatures are checked on-chain, preventing "man-in-the-middle" attacks where a malicious frontend could provide a forged price.

---

## Future Explorations & Missing Steps

- **Reference Scripts:** Currently, the contract bytecode is attached to each transaction. Moving to reference scripts (CIP-33) would significantly reduce transaction size and fees.
- **Additional Assets:** Expanding the system to support multiple currencies (e.g., BTC, ETH, SOL) using other Pyth feeds.
- **Error Handling:** Implementing more robust handling for "stale prices" or oracle downtime directly in the smart contract logic.
- **Decentralized Rewards:** Automatically rewarding users with game tokens based on the verified price of completed missions.
- **Mainnet Deployment:** Transitioning from Cardano Preprod to Mainnet once the Pyth Cardano integration moves out of Beta.

---

## Our Vision: A Gaming & E-commerce Ecosystem

Our goal is to build a comprehensive **gaming and e-commerce platform** that makes the Cardano ecosystem more attractive and accessible to a global audience. By combining high-quality entertainment with the best possible prices—powered by Pyth Network's real-time oracles—we aim to:
- **Entertain:** Create engaging gaming experiences where users can spend and earn ADA.
- **Save:** Ensure users always get market-accurate rates for their purchases, avoiding the "hidden fees" of stale or centralized price data.
- **Adopt:** Drive mass adoption of Cardano by providing a user-friendly bridge between traditional gaming/commerce and decentralized finance (DeFi).

---

## Getting Started

### Prerequisites
- Node.js v18+
- A Cardano wallet (Preprod Testnet)
- Blockfrost Project ID (Preprod)

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   # IMPORTANT: The client requires legacy peer dependency resolution
   cd client && npm install --legacy-peer-deps
   cd ../server && npm install
   ```
3. Configure `.env` files in both `client` and `server` (see `.env.example`).
4. Start development:
   - Client: `npm run dev`
   - Server: `npm run dev`