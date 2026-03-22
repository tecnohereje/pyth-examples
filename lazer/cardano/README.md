# Team HackSabbath: Game Project

A modern web application demonstrating the integration of **Pyth Network** on-chain price oracles with the **Cardano** blockchain, set within a gamified commercial ecosystem.

## Team Details
- **Team Name:** HackSabbath
- **Team Members:** Melitón (@balboame), Cristian (@crcristian97), Santino (@santinopuglia), José (@tecnohereje), Matthieu (@mpizenberg)
- **Contact:** matthieu.pizenberg@gmail.com

---

## Project Overview

This project is a full-stack application that enables real-time commercial operations (e.g., product purchases) using verified ADA/USD price data from the Pyth Network. It ensures that payments made in ADA correctly reflect a USD-denominated price at the moment of the transaction, verified both off-chain (convenience) and on-chain (security).

<img width="671" height="982" alt="Screenshot 2026-03-22 at 20 51 26" src="https://github.com/user-attachments/assets/f3b920e7-b688-4578-95b2-c0e8e2724dcf" />


<img width="654" height="959" alt="Screenshot 2026-03-22 at 20 51 39" src="https://github.com/user-attachments/assets/e8e06c64-55d4-4bcd-a924-fa2bee5aa03e" />


<img width="651" height="988" alt="Screenshot 2026-03-22 at 20 51 47" src="https://github.com/user-attachments/assets/950d28cd-1ac7-46df-9fa0-7558850960cd" />

<img width="655" height="975" alt="Screenshot 2026-03-22 at 20 51 56" src="https://github.com/user-attachments/assets/e52afbdd-729e-4056-bc4d-91a06c7dcf4a" />

<img width="655" height="932" alt="Screenshot 2026-03-22 at 20 52 09" src="https://github.com/user-attachments/assets/4cc3056d-a96b-4fff-a77e-725347b24908" />

<img width="1449" height="979" alt="Screenshot 2026-03-22 at 20 52 52" src="https://github.com/user-attachments/assets/b1e7c6a4-b5b0-4d07-9c94-2e47a1d75fa5" />

<img width="667" height="994" alt="Screenshot 2026-03-22 at 20 53 12" src="https://github.com/user-attachments/assets/68012e38-5b31-4b9c-9b17-c8f7d9cadddf" />


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
