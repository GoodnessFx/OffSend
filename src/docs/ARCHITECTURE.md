# System Architecture - Global Off-Grid Payment Protocol

## Table of Contents
1. [High-Level Overview](#high-level-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Network Topology](#network-topology)
5. [Storage Design](#storage-design)
6. [Cryptographic Primitives](#cryptographic-primitives)
7. [Reconciliation Algorithm](#reconciliation-algorithm)
8. [Transport Layer](#transport-layer)
9. [Production Stack](#production-stack)
10. [Scaling Considerations](#scaling-considerations)

---

## High-Level Overview

### Design Philosophy

**Local-First**: Every device is a sovereign node that operates independently. Internet is optional, not required.

**Peer-to-Peer**: Direct value transfer between devices without intermediaries during transaction.

**Eventually Consistent**: Transactions are immediately valid locally; global consistency achieved asynchronously.

**Cryptographically Secure**: Every operation is signed and verifiable. Trust is based on mathematics, not central authority.

**Multi-Transport**: Use whatever connectivity is available - BLE, NFC, LoRa, SMS, or future protocols.

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  (Wallet UI, Admin Console, Merchant POS)               │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 Business Logic Layer                     │
│  (Transaction Creation, Validation, Reconciliation)     │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Protocol Layer                         │
│  (Signing, Merkle Trees, CRDT Operations)               │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Transport Layer                        │
│  (BLE, NFC, LoRa, SMS, libp2p, WebRTC)                 │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Storage Layer                         │
│  (Local DB, Keystore, Cache)                            │
└─────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Core Components

#### 1. Device Wallet (Mobile/Desktop)

**Responsibilities**:
- Key management (generation, storage, usage)
- Transaction creation and signing
- Receipt validation and storage
- Local ledger maintenance
- Merkle snapshot generation
- UI for user interactions

**Key Classes**:
```typescript
class DeviceWallet {
  private keyPair: KeyPair
  private ledger: LedgerState
  private storage: SecureStorage
  
  // Core operations
  createTransaction(to, amount, transport)
  signTransaction(tx)
  validateReceipt(receipt)
  updateLedger(tx)
  createMerkleSnapshot()
  
  // Reconciliation
  exportLedgerState()
  mergeLedgerState(remote)
  resolveConflicts(conflicts)
}
```

**Storage**:
- SQLite/WatermelonDB for transactions
- Platform Keystore for private keys
- IndexedDB/AsyncStorage for metadata

#### 2. Gateway Node

**Responsibilities**:
- Relay messages between offline devices
- Store Merkle snapshots from devices
- Detect conflicts via tree comparison
- Facilitate reconciliation
- Provide internet gateway for fiat on/off ramp
- Report network metrics

**Key Classes**:
```typescript
class GatewayNode {
  private deviceSnapshots: Map<DeviceID, MerkleSnapshot[]>
  private pendingReconciliations: Queue<ReconciliationJob>
  
  // Core operations
  receiveSnapshot(deviceId, snapshot)
  detectConflicts(deviceA, deviceB)
  reconcileDevices(deviceIds)
  broadcastToRegion(message)
  
  // Monitoring
  getNetworkHealth()
  getDeviceStatus(deviceId)
}
```

**Storage**:
- PostgreSQL for transaction logs
- Redis for real-time operations
- S3/Object Storage for long-term archive

#### 3. Relayer Service

**Responsibilities**:
- Coordinate multi-gateway reconciliation
- Detect network partitions
- Aggregate global state
- Fraud detection and alerting
- On-chain settlement (optional)

**Key Classes**:
```typescript
class RelayerService {
  private gateways: Gateway[]
  private conflictDetector: ConflictDetector
  
  // Core operations
  aggregateGatewayStates()
  detectDoubleSpend(txId)
  initiateGlobalReconciliation()
  settleOnChain(txBatch)
  
  // Monitoring
  monitorGatewayHealth()
  detectNetworkPartition()
}
```

#### 4. Admin Console

**Responsibilities**:
- Gateway management
- Conflict resolution dashboard
- Network monitoring
- User support tools
- Audit log viewing

**Tech Stack**:
- Next.js + React
- Real-time updates via WebSocket
- Chart.js/Recharts for visualization
- TailwindCSS for styling

---

## Data Flow

### Transaction Creation Flow

```
┌─────────┐
│ Sender  │
│ Device  │
└────┬────┘
     │
     │ 1. Create TX
     │    - Generate nonce
     │    - Set timestamp
     │    - Sign with private key
     ▼
┌─────────────┐
│   Pending   │
│    Queue    │
└────┬────────┘
     │
     │ 2. Transmit via Transport
     │    - BLE: Direct connection
     │    - NFC: Proximity exchange
     │    - LoRa: Gateway relay
     │    - SMS: Encoded message
     ▼
┌──────────┐
│ Receiver │
│  Device  │
└────┬─────┘
     │
     │ 3. Validate
     │    - Verify signature
     │    - Check nonce sequence
     │    - Validate timestamp
     ▼
┌─────────────┐
│   Create    │
│   Receipt   │
└────┬────────┘
     │
     │ 4. Sign receipt
     │    - Timestamp
     │    - Status (accept/reject)
     │    - Signature
     ▼
┌─────────┐
│ Sender  │ ◄──── 5. Receipt delivered
│ Device  │
└────┬────┘
     │
     │ 6. Finalize
     │    - Move from pending to confirmed
     │    - Update balances
     │    - Add to Merkle tree
     ▼
┌──────────────┐
│ Local Ledger │
│  (both sides)│
└──────────────┘
```

### Reconciliation Flow

```
┌─────────────┐         ┌─────────────┐
│  Device A   │         │  Device B   │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ 1. Build Merkle Tree  │
       │    from local TX log  │
       │                       │
       ▼                       ▼
┌──────────────┐       ┌──────────────┐
│ Merkle Root A│       │ Merkle Root B│
│ + Signature  │       │ + Signature  │
└──────┬───────┘       └──────┬───────┘
       │                       │
       │                       │
       └─────────┬─────────────┘
                 │
                 │ 2. Upload to Gateway
                 ▼
         ┌──────────────┐
         │   Gateway    │
         └──────┬───────┘
                │
                │ 3. Compare Roots
                ▼
         ┌──────────────┐
         │  Roots Match?│
         └──────┬───────┘
                │
         ┌──────┴───────┐
         │              │
      YES│              │NO
         │              │
         ▼              ▼
   ┌─────────┐    ┌──────────────┐
   │   Done  │    │ Find Conflict│
   │ (sync'd)│    │   Position   │
   └─────────┘    └──────┬───────┘
                         │
                         │ 4. Request TX details
                         │    from conflict point
                         ▼
                  ┌──────────────┐
                  │  Compare TX  │
                  │  Signatures  │
                  │  Timestamps  │
                  │  Receipts    │
                  └──────┬───────┘
                         │
                         │ 5. Apply Resolution
                         ▼
                  ┌──────────────┐
                  │  Valid TX    │
                  │  kept        │
                  │              │
                  │  Invalid TX  │
                  │  rejected    │
                  └──────┬───────┘
                         │
                         │ 6. Notify Devices
                         ▼
              ┌──────────────────────┐
              │  Update Local State  │
              │  Mark Conflicts      │
              │  Sync Merkle Tree    │
              └──────────────────────┘
```

---

## Network Topology

### Urban Mesh Network

```
    ┌─────────┐
    │Internet │
    └────┬────┘
         │
    ┌────┴─────┐
    │ Gateway  │ (WiFi/Cellular)
    └────┬─────┘
         │
    ┌────┴─────────────────┐
    │                      │
┌───┴───┐            ┌────┴────┐
│Device │◄──BLE────►│ Device  │
│   A   │            │    B    │
└───┬───┘            └────┬────┘
    │                     │
    │                     │
    └──────BLE────────────┘
           │
       ┌───┴───┐
       │Device │
       │   C   │
       └───────┘
```

**Characteristics**:
- High device density
- Short-range transports (BLE, NFC)
- Multiple paths to gateway
- Fast reconciliation (< 1 min)

### Rural LoRa Network

```
         ┌─────────┐
         │Internet │
         └────┬────┘
              │
         ┌────┴─────┐
         │ Gateway  │ (Satellite/3G)
         └────┬─────┘
              │
         ┌────┴────────┐
         │ LoRa Gateway│ (Solar powered)
         └─────┬───────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    │      (2-15km)       │
    │          │          │
┌───┴───┐  ┌──┴───┐  ┌───┴───┐
│Device │  │Device│  │Device │
│   A   │  │  B   │  │   C   │
│Village│  │Market│  │School │
└───────┘  └──────┘  └───────┘
```

**Characteristics**:
- Low device density
- Long-range transport (LoRa)
- Single gateway per region
- Slower reconciliation (hours)
- Solar-powered infrastructure

### Hybrid Network (Mixed)

```
┌─────────────────────────────────────────┐
│              Internet                    │
└─────────────┬───────────────────────────┘
              │
     ┌────────┴────────┐
     │                 │
┌────┴─────┐      ┌───┴──────┐
│Urban GW  │      │Rural GW  │
└────┬─────┘      └───┬──────┘
     │                │
     │                │
     │            ┌───┴──────┐
     │            │ LoRa GW  │
     │            └───┬──────┘
     │                │
┌────┴─────┐     ┌───┴────┐
│BLE Mesh  │     │LoRa    │
│10 devices│     │5 device│
└──────────┘     └────────┘
```

---

## Storage Design

### Device-Side Storage

#### Transaction Ledger
```typescript
interface StoredTransaction {
  id: string              // SHA256 hash
  from: string            // Device public key
  to: string              // Recipient public key
  amount: number          // In smallest unit
  nonce: number           // Sequential per sender
  timestamp: number       // Unix timestamp
  signature: string       // Ed25519 signature
  receipt: {
    signature: string     // Receiver's signature
    timestamp: number
    status: 'accepted' | 'rejected'
  } | null
  transport: 'BLE' | 'NFC' | 'LoRa' | 'SMS'
  merkleProof: string[]   // Path to Merkle root
  syncStatus: 'local' | 'gateway' | 'settled'
}
```

**Indexes**:
- Primary: `id`
- Index: `timestamp` (for chronological queries)
- Index: `from` (sent transactions)
- Index: `to` (received transactions)
- Index: `syncStatus` (pending sync)

#### Merkle Snapshots
```typescript
interface StoredSnapshot {
  id: string              // SHA256 of root
  root: string            // Merkle root hash
  timestamp: number       // Snapshot time
  txCount: number         // Number of TX in tree
  signature: string       // Device signature
  uploaded: boolean       // Synced to gateway?
  gatewayAck: string | null  // Gateway confirmation
}
```

#### Key Storage
```
Platform Keystore (iOS Keychain / Android Keystore):
  - private_key: Encrypted Ed25519 private key
  - device_id: Derived from public key
  - guardian_shares: Encrypted Shamir shares (if recovery enabled)

Local DB:
  - public_keys: Map of known device public keys
  - trusted_guardians: List of recovery guardians
  - reputation_scores: Cached reputation data
```

### Gateway Storage

#### PostgreSQL Schema

```sql
-- Devices table
CREATE TABLE devices (
  device_id VARCHAR(64) PRIMARY KEY,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  reputation_score INTEGER DEFAULT 0,
  kyc_verified BOOLEAN DEFAULT FALSE,
  guardian_of TEXT[]
);

-- Transactions table
CREATE TABLE transactions (
  tx_id VARCHAR(64) PRIMARY KEY,
  from_device VARCHAR(64) REFERENCES devices(device_id),
  to_device VARCHAR(64) REFERENCES devices(device_id),
  amount BIGINT NOT NULL,
  nonce INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  signature TEXT NOT NULL,
  receipt_signature TEXT,
  receipt_status VARCHAR(10),
  transport VARCHAR(10),
  gateway_id VARCHAR(64),
  reconciliation_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Merkle snapshots table
CREATE TABLE merkle_snapshots (
  snapshot_id VARCHAR(64) PRIMARY KEY,
  device_id VARCHAR(64) REFERENCES devices(device_id),
  root_hash VARCHAR(64) NOT NULL,
  tx_count INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  device_signature TEXT NOT NULL,
  gateway_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conflicts table
CREATE TABLE conflicts (
  conflict_id VARCHAR(64) PRIMARY KEY,
  tx_id VARCHAR(64),
  device_a VARCHAR(64),
  device_b VARCHAR(64),
  conflict_type VARCHAR(50),
  description TEXT,
  status VARCHAR(20),
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Gateways table
CREATE TABLE gateways (
  gateway_id VARCHAR(64) PRIMARY KEY,
  location TEXT,
  type VARCHAR(20),
  public_key TEXT,
  status VARCHAR(20),
  last_sync TIMESTAMP,
  health_score INTEGER
);
```

**Indexes**:
```sql
CREATE INDEX idx_tx_from ON transactions(from_device);
CREATE INDEX idx_tx_to ON transactions(to_device);
CREATE INDEX idx_tx_timestamp ON transactions(timestamp);
CREATE INDEX idx_tx_status ON transactions(reconciliation_status);
CREATE INDEX idx_snapshots_device ON merkle_snapshots(device_id);
CREATE INDEX idx_conflicts_status ON conflicts(status);
```

#### Redis Data Structures

```
// Pending reconciliation queue
QUEUE reconciliation_jobs {
  { deviceId, snapshotId, priority }
}

// Real-time device status
HASH device_status:{deviceId} {
  online: true/false,
  lastSeen: timestamp,
  pendingTx: count
}

// Transaction deduplication (short TTL)
SET tx_seen:{txId} (TTL: 1 hour)

// Rate limiting
HASH rate_limit:{deviceId} {
  txCount: number,
  windowStart: timestamp
}
```

---

## Cryptographic Primitives

### Signature Scheme: Ed25519

**Why Ed25519?**
- Fast: ~60,000 signatures/second
- Small: 32-byte keys, 64-byte signatures
- Secure: 128-bit security level
- Deterministic: Same message = same signature
- Widely supported: NaCl, libsodium, noble

**Key Generation**:
```typescript
import nacl from 'tweetnacl'

// Random generation
const keyPair = nacl.sign.keyPair()
// {
//   publicKey: Uint8Array(32),
//   secretKey: Uint8Array(64)  // Actually seed(32) + public(32)
// }

// Deterministic from seed (for recovery)
const seed = randomBytes(32)  // From CSPRNG
const keyPair = nacl.sign.keyPair.fromSeed(seed)
```

**Signing**:
```typescript
const message = new TextEncoder().encode(txData)
const signature = nacl.sign.detached(message, secretKey)
// signature: Uint8Array(64)
```

**Verification**:
```typescript
const isValid = nacl.sign.detached.verify(
  message,
  signature,
  publicKey
)
// Returns true/false
```

### Hashing: SHA-256

**Why SHA-256?**
- Industry standard
- Fast on modern hardware
- Good collision resistance
- Small output (32 bytes)

**Usage**:
```typescript
import { sha256 } from 'js-sha256'

// Transaction hash
const txHash = sha256(`${tx.id}:${tx.from}:${tx.to}:${tx.amount}`)

// Merkle node hash
const parentHash = sha256(leftHash + rightHash)
```

### Social Recovery: Shamir's Secret Sharing

**Why Shamir?**
- Split key into N shares
- Require M shares to recover (threshold)
- Losing < M shares doesn't compromise key
- Information-theoretic security

**Scheme** (conceptual):
```typescript
// Split key into 5 shares, need 3 to recover
const shares = shamir.split(privateKey, {
  shares: 5,
  threshold: 3
})

// Distribute to guardians
guardians.forEach((guardian, i) => {
  encryptAndSend(guardian, shares[i])
})

// Recovery
const recoveredKey = shamir.combine([
  share1,  // From guardian A
  share2,  // From guardian B
  share3   // From guardian C
])
```

---

## Reconciliation Algorithm

### Merkle Tree Construction

```typescript
class MerkleTree {
  constructor(transactions: Transaction[]) {
    this.root = this.buildTree(transactions)
  }
  
  private buildTree(txs: Transaction[]): MerkleNode {
    // Hash each transaction
    const leaves = txs.map(tx => ({
      hash: sha256(serialize(tx)),
      data: tx
    }))
    
    // Build tree bottom-up
    return this.buildLevel(leaves)
  }
  
  private buildLevel(nodes: MerkleNode[]): MerkleNode {
    if (nodes.length === 1) return nodes[0]
    
    const nextLevel = []
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i]
      const right = nodes[i + 1] || left  // Duplicate if odd
      
      nextLevel.push({
        hash: sha256(left.hash + right.hash),
        left: left,
        right: right !== left ? right : undefined
      })
    }
    
    return this.buildLevel(nextLevel)
  }
  
  getRoot(): string {
    return this.root.hash
  }
  
  getProof(txId: string): string[] {
    // Generate inclusion proof for specific transaction
    const proof = []
    // ... walk tree collecting sibling hashes
    return proof
  }
  
  verify(txId: string, proof: string[]): boolean {
    // Verify transaction is in tree
    // ... recompute root from proof
    return computedRoot === this.root.hash
  }
}
```

### Conflict Detection Algorithm

```typescript
class ConflictDetector {
  detect(
    deviceA: LedgerState,
    deviceB: LedgerState
  ): Conflict[] {
    const conflicts = []
    
    // Build Merkle trees
    const treeA = new MerkleTree(deviceA.transactions)
    const treeB = new MerkleTree(deviceB.transactions)
    
    // Quick check: do roots match?
    if (treeA.getRoot() === treeB.getRoot()) {
      return []  // Perfectly in sync
    }
    
    // Find divergence point
    const divergence = this.findDivergence(treeA, treeB)
    
    // Compare transactions from divergence onward
    const txMapA = new Map(
      deviceA.transactions
        .slice(divergence)
        .map(tx => [tx.id, tx])
    )
    
    const txMapB = new Map(
      deviceB.transactions
        .slice(divergence)
        .map(tx => [tx.id, tx])
    )
    
    // Check for conflicts
    txMapA.forEach((txA, txId) => {
      if (txMapB.has(txId)) {
        const txB = txMapB.get(txId)
        
        // Same ID but different data = conflict
        if (this.hashTx(txA) !== this.hashTx(txB)) {
          conflicts.push({
            txId,
            deviceA: deviceA.deviceId,
            deviceB: deviceB.deviceId,
            txA,
            txB,
            type: 'DUPLICATE_NONCE'
          })
        }
      }
    })
    
    // Check for double spends
    const doubleSpends = this.detectDoubleSpend(
      deviceA.transactions,
      deviceB.transactions
    )
    conflicts.push(...doubleSpends)
    
    return conflicts
  }
  
  private detectDoubleSpend(
    txsA: Transaction[],
    txsB: Transaction[]
  ): Conflict[] {
    const conflicts = []
    
    // Group by sender and nonce
    const nonceMap = new Map<string, Transaction[]>()
    
    ;[...txsA, ...txsB].forEach(tx => {
      const key = `${tx.from}:${tx.nonce}`
      if (!nonceMap.has(key)) {
        nonceMap.set(key, [])
      }
      nonceMap.get(key).push(tx)
    })
    
    // Find duplicate nonces with different recipients
    nonceMap.forEach((txs, key) => {
      if (txs.length > 1) {
        const recipients = new Set(txs.map(tx => tx.to))
        if (recipients.size > 1) {
          // Same nonce, different recipients = double spend!
          conflicts.push({
            type: 'DOUBLE_SPEND',
            txs: txs,
            description: `Nonce ${key} used for multiple recipients`
          })
        }
      }
    })
    
    return conflicts
  }
}
```

### Conflict Resolution

```typescript
class ConflictResolver {
  resolve(conflict: Conflict): Resolution {
    switch (conflict.type) {
      case 'DOUBLE_SPEND':
        return this.resolveDoubleSpend(conflict)
      
      case 'DUPLICATE_NONCE':
        return this.resolveDuplicateNonce(conflict)
      
      case 'MISSING_RECEIPT':
        return this.resolveMissingReceipt(conflict)
      
      default:
        return { action: 'ESCALATE', reason: 'Unknown conflict type' }
    }
  }
  
  private resolveDoubleSpend(conflict: Conflict): Resolution {
    const txs = conflict.txs
    
    // Rule 1: Transaction with valid receipt wins
    const withReceipts = txs.filter(tx => tx.receipt?.status === 'accepted')
    if (withReceipts.length === 1) {
      return {
        action: 'ACCEPT',
        tx: withReceipts[0],
        reason: 'Only TX with valid receipt'
      }
    }
    
    // Rule 2: Earlier timestamp wins
    if (withReceipts.length > 1) {
      const earliest = withReceipts.sort((a, b) =>
        a.timestamp - b.timestamp
      )[0]
      
      return {
        action: 'ACCEPT',
        tx: earliest,
        reason: 'Earliest timestamped TX with receipt'
      }
    }
    
    // Rule 3: No receipts - reject all
    return {
      action: 'REJECT_ALL',
      reason: 'Double spend with no valid receipts'
    }
  }
  
  private resolveDuplicateNonce(conflict: Conflict): Resolution {
    // Same ID, different content = signature invalid somewhere
    const txA = conflict.txA
    const txB = conflict.txB
    
    // Verify signatures
    const validA = this.verifySignature(txA)
    const validB = this.verifySignature(txB)
    
    if (validA && !validB) {
      return { action: 'ACCEPT', tx: txA, reason: 'Valid signature' }
    }
    
    if (validB && !validA) {
      return { action: 'ACCEPT', tx: txB, reason: 'Valid signature' }
    }
    
    if (!validA && !validB) {
      return { action: 'REJECT_ALL', reason: 'Both signatures invalid' }
    }
    
    // Both valid - impossible unless private key compromised
    return {
      action: 'ESCALATE',
      reason: 'Potential private key compromise'
    }
  }
}
```

---

## Transport Layer

### Bluetooth LE (BLE)

**Protocol**: Generic Attribute Profile (GATT)

**Services**:
```typescript
const OFFGRID_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb'
const TX_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb'
const RECEIPT_CHARACTERISTIC_UUID = '0000fff2-0000-1000-8000-00805f9b34fb'

// Advertise as available for payments
bleManager.startAdvertising({
  serviceUUIDs: [OFFGRID_SERVICE_UUID],
  localName: `OFFGRID_${deviceId}`
})

// Send transaction
await characteristic.write(
  encodeTLV({
    type: 'TRANSACTION',
    data: signedTx
  })
)

// Receive receipt
characteristic.onNotify((data) => {
  const receipt = decodeTLV(data)
  processReceipt(receipt)
})
```

**Advantages**:
- Ubiquitous (all smartphones)
- Reasonable range (10-100m)
- Low power
- Peer-to-peer

**Limitations**:
- Pairing can be slow
- Limited concurrent connections
- Platform differences (iOS vs Android)

### NFC (Near Field Communication)

**Protocol**: NDEF (NFC Data Exchange Format)

```typescript
// Write transaction to NFC tag
const ndefMessage = [
  {
    tnf: Ndef.TNF_MIME_MEDIA,
    type: 'application/offgrid.payment',
    payload: encodeTx(signedTx)
  }
]

await NfcManager.writeNdefMessage(ndefMessage)

// Read from NFC tag
const tag = await NfcManager.getTag()
const tx = decodeTx(tag.ndefMessage[0].payload)
```

**Advantages**:
- Instant (< 1 second)
- Very simple UX (tap)
- Highly secure (proximity required)
- Low power

**Limitations**:
- Very short range (< 10cm)
- Not all phones support NFC
- iOS limitations

### LoRa (Long Range Radio)

**Protocol**: LoRaWAN

**Architecture**:
```
Device ◄──LoRa──► Gateway ◄──IP──► Network Server
```

**Message Format**:
```typescript
interface LoRaMessage {
  devAddr: string       // 4 bytes
  payload: Uint8Array   // Encrypted TX data
  fCnt: number          // Frame counter
  mic: string           // Message Integrity Code
}

// Send transaction via LoRa
const payload = encrypt(
  serialize(signedTx),
  deviceKey
)

lora.send({
  devAddr: gatewayAddr,
  payload: payload,
  fCnt: frameCounter++,
  mic: computeMIC(payload)
})
```

**Advantages**:
- Long range (2-15 km)
- Low power
- Penetrates buildings
- Ideal for rural areas

**Limitations**:
- Very low bandwidth (< 50 kbps)
- Requires gateway infrastructure
- Regulatory restrictions
- Higher latency

### SMS (Short Message Service)

**Encoding**:
```typescript
function encodeSMS(tx: Transaction): string {
  // 160 character limit, must be compact
  return [
    'PAY',                        // 3 chars
    tx.from.slice(0, 8),          // 8 chars
    tx.to.slice(0, 8),            // 8 chars
    tx.amount.toString(36),       // Variable (base36)
    tx.nonce.toString(36),        // Variable
    tx.timestamp.toString(36),    // Variable
    tx.signature.slice(0, 32)     // 32 chars
  ].join('|')
}

function decodeSMS(sms: string): Partial<Transaction> {
  const parts = sms.split('|')
  if (parts[0] !== 'PAY') throw new Error('Invalid format')
  
  return {
    from: parts[1],
    to: parts[2],
    amount: parseInt(parts[3], 36),
    nonce: parseInt(parts[4], 36),
    timestamp: parseInt(parts[5], 36),
    signature: parts[6]
  }
}
```

**Advantages**:
- Works on feature phones
- Cellular coverage
- Fallback when all else fails

**Limitations**:
- Costs per message
- Very limited size
- Requires truncation
- Not truly offline (needs cell tower)

---

## Production Stack

### Mobile App

```
React Native (Expo)
├── react-native-ble-plx (Bluetooth)
├── react-native-nfc-manager (NFC)
├── @react-native-community/netinfo (Connectivity)
├── react-native-keychain (Secure storage)
├── @nozbe/watermelondb (Offline database)
├── react-native-crypto (Cryptography)
└── react-native-svg (QR codes, visualizations)
```

### Web Admin

```
Next.js 14
├── React 18
├── TypeScript
├── TailwindCSS
├── Shadcn/ui components
├── Recharts (Analytics)
├── Socket.io (Real-time updates)
└── React Query (Data fetching)
```

### Backend Services

```
Node.js + TypeScript
├── Fastify (API server)
├── PostgreSQL + Prisma (Database)
├── Redis (Cache + Queues)
├── Bull (Job queue)
├── Socket.io (WebSocket)
├── Winston (Logging)
└── Prometheus (Metrics)
```

### Infrastructure

```
AWS/GCP
├── ECS/Cloud Run (Containers)
├── RDS (PostgreSQL)
├── ElastiCache (Redis)
├── S3/Cloud Storage (Snapshots)
├── CloudWatch/Stackdriver (Monitoring)
├── Route53/Cloud DNS
└── CloudFront/Cloud CDN
```

---

## Scaling Considerations

### Device Scalability

| Devices | Strategy |
|---------|----------|
| 1-1,000 | Single gateway per region |
| 1K-10K | Multiple gateways with load balancing |
| 10K-100K | Regional gateway clusters |
| 100K-1M | Hierarchical gateway network |
| 1M+ | Sharded by geography + global coordinator |

### Transaction Throughput

**Per Device**:
- Theoretical max: 60K signatures/sec (Ed25519)
- Practical limit: ~100 TX/sec (network + validation)
- Recommended: 10 TX/sec with rate limiting

**Per Gateway**:
- Database writes: 10K TX/sec (PostgreSQL)
- Merkle reconciliation: 100 devices/sec
- Recommended: 1K devices per gateway

### Storage Growth

**Per Device**:
- Transaction: ~500 bytes
- 100 TX/day = 50 KB/day = 18 MB/year
- 1000 TX/day = 500 KB/day = 180 MB/year

**Per Gateway**:
- 1000 devices × 100 TX/day = 100K TX/day
- 50 MB/day = 18 GB/year (raw transactions)
- With indexes + snapshots: ~50 GB/year

**Archival Strategy**:
- Keep last 90 days in hot storage
- Archive older TX to cold storage (S3 Glacier)
- Keep Merkle snapshots indefinitely (small)

---

## Future Enhancements

### Zero-Knowledge Proofs
- Hide transaction amounts
- Prove solvency without revealing balance
- Privacy-preserving conflict resolution

### State Channels
- Open channels for high-frequency pairs
- Settle periodically on-chain
- Reduce reconciliation overhead

### Multi-Hop Routing
- Route payments through intermediaries
- Extend range beyond single hop
- Incentivize relay nodes

### Hardware Wallets
- Dedicated secure elements
- Offline signing devices
- Enhanced key protection

### Cross-Chain Bridges
- Settlement to Ethereum/Polygon
- Swap between cryptocurrencies
- Fiat on/off ramps

---

**This architecture balances offline capability, security, and scalability to enable truly off-grid payments.**