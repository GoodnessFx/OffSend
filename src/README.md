# Offline Payment Wallet

> **Simple, secure offline payments powered by cryptography**

A production-ready offline-first payment wallet that lets you pay for things even without internet. Built with Ed25519 cryptographic signatures and Merkle tree settlement, wrapped in a clean ChatGPT-style interface.


## ✨ Features

### Simple Payment Experience
- **Clean Interface**
- **Offline First**: Pay even when internet is down
- **Settle Later**: Transactions sync when network comes back
- **Instant Payments**: Just tap Pay, enter amount, confirm

### Settings & Profile
- **Device Identity**: Unique cryptographic ID
- **Reputation Score**: Based on successful transactions
- **Settlement Management**: Create Merkle snapshots, track pending settlements
- **Backup & Export**: Download wallet data for safekeeping
- **Transaction History**: Complete audit trail with verified badges

### Security Features
- **Ed25519 Signatures**: Every transaction cryptographically signed
- **Merkle Tree Settlement**: Conflict detection and reconciliation
- **Receipt Verification**: Both parties sign and confirm
- **Offline Security**: No internet needed, fully encrypted local ledger

## 🏗️ How It Works

### Like a Credit Card, But Offline

1. **Pay Now**: Create a transaction, sign it cryptographically
2. **Works Offline**: No internet needed, transaction stored locally
3. **Settle Later**: When online, Merkle tree reconciles with network
4. **Verified**: Both parties have cryptographic proof

### Behind the Scenes

- **Ed25519 Signatures**: Military-grade cryptography on every transaction
- **Local Ledger**: Encrypted transaction log in browser storage
- **Merkle Trees**: Create snapshots for settlement verification
- **Receipt System**: Both sender and receiver sign for proof
- **Auto-Reconciliation**: Syncs when network available

## 🔧 Tech Stack

- **React 18** + TypeScript
- **Tailwind CSS v4** - Dark theme styling
- **Shadcn/ui** - Beautiful components
- **TweetNaCl** - Ed25519 cryptography
- **js-sha256** - Merkle tree hashing
- **Sonner** - Toast notifications
- **Vite** - Lightning fast build tool

## 📦 Project Structure

```
/
├── App.tsx                    # Main app component
├── components/
│   ├── SimpleWallet.tsx       # Main wallet interface
│   └── ui/                    # Shadcn UI components
├── packages/
│   └── offline-sdk.ts         # Cryptography & Merkle logic
├── styles/
│   └── globals.css            # Tailwind configuration
├── docs/                      # Documentation
└── SETUP.md                   # Detailed setup guide
```

## 🔐 Security

This app uses production-grade cryptography:

- **Ed25519**: Industry-standard digital signatures
- **SHA-256**: Secure hashing for Merkle trees
- **Local Storage**: Encrypted transaction ledger
- **No Backend**: All cryptography happens client-side

⚠️ **Note**: Keys are stored in browser memory. For production, implement secure key storage (e.g., hardware wallet integration).

## 📱 Currency

Currently configured for Nigerian Naira (₦). Easy to change to other currencies in the code.

## 🚀 Deployment

See [SETUP.md](./SETUP.md) for detailed deployment instructions including:
- Vercel deployment
- Netlify deployment
- Static hosting options
- Environment configuration

## 📝 License

MIT License

## ⚠️ Disclaimer

This is a demonstration of offline payment concepts using cryptographic signatures and Merkle trees. For production use:

- Conduct security audit
- Implement secure key storage
- Add proper error handling
- Test reconciliation thoroughly
- Consider regulatory compliance

---

**Simple payments. Offline first. Powered by cryptography.** 🔐