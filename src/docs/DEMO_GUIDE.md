# Demo Guide - Global Off-Grid Payment Protocol

## Quick 3-Step Demo

### Step 1: Explore the Landing Page (30 seconds)
1. **Read the Hero Section**: Understand the core value proposition
2. **Check the Stats**: See active network metrics
3. **Review Features**: Offline-first, multi-transport, cryptographically secure
4. **Scroll to Use Cases**: Real-world applications

### Step 2: Launch Mobile Wallet (2 minutes)
1. Click **"Launch Wallet"** button
2. **View Your Balance**: 1000 OFFG tokens
3. **Select Transport**: Try BLE, NFC, LoRa, or SMS
4. **Send Payment**:
   - Enter recipient: `device_test`
   - Amount: `10`
   - Click "Send Payment"
5. **Watch the Flow**:
   - Payment goes to pending queue
   - Simulated peer receipt exchange (2 seconds)
   - Transaction moves to confirmed
   - Balance updates
6. **View Transaction History**: See your completed transaction with:
   - Transport method icon
   - Timestamp
   - Signed receipt status

### Step 3: Open Admin Console (2 minutes)
1. Click **"Admin Console"** button in wallet
2. **Dashboard Overview**:
   - Active devices: 892/1247
   - Total transactions: 45K+
   - Network health: 89%
3. **Gateway Tab**:
   - 4 gateways across different locations
   - Click "Reconcile" on any gateway
   - Watch sync animation
4. **Conflicts Tab**:
   - See pending conflict resolution
   - Click "Auto-Resolve" to use timestamp-based resolution
5. **Reconciliation Tab**:
   - View Merkle tree statistics
   - See recent sync operations

---

## Detailed Feature Walkthrough

### Mobile Wallet Features

#### 1. Multi-Transport Payment

**Bluetooth LE (BLE)**
- **Use Case**: Urban area, short-range peer payments
- **Demo**: Select BLE, click "Scan", see nearby devices
- **Range**: 10-100 meters
- **Try It**: Send payment, see instant transfer

**NFC (Near Field Communication)**
- **Use Case**: Tap-to-pay at merchant
- **Demo**: Select NFC for quick transaction
- **Range**: < 10 cm
- **Try It**: Imagine tapping phones together

**LoRa (Long Range)**
- **Use Case**: Rural community, gateway-mediated
- **Demo**: Select LoRa for village-to-village transfer
- **Range**: 2-15 km
- **Try It**: Payment routed through gateway

**SMS (Text Message)**
- **Use Case**: Feature phone, emergency backup
- **Demo**: Select SMS to encode payment in text
- **Range**: Cellular coverage
- **Try It**: See compact encoded format

#### 2. Transaction States

**Pending**: 
- Yellow card in wallet
- Waiting for peer receipt
- Can take 2-10 seconds depending on transport
- Auto-cancels after 10 minutes if no receipt

**Confirmed**:
- Green card in history
- Both parties have signed receipts
- Included in Merkle snapshots
- Ready for gateway reconciliation

**Failed**:
- Red card (if receiver rejects)
- Funds automatically returned
- Logged for audit trail

#### 3. Merkle Snapshots

**Purpose**: Create cryptographic summary of transaction history

**How to Use**:
1. Click "Snapshot" button in wallet
2. SDK builds Merkle tree from all transactions
3. Root hash signed with device key
4. Timestamp recorded
5. Toast shows root hash preview

**When It Matters**:
- Gateway reconciliation uses snapshots
- Conflict detection via tree comparison
- Proof of transaction history

#### 4. Gateway Sync

**Purpose**: Reconcile offline transactions with network

**How to Use**:
1. Click "Sync" button
2. Simulates connecting to gateway
3. Uploads Merkle snapshots
4. Downloads network state
5. Shows confirmation toast

**What Happens**:
- Device sends Merkle root to gateway
- Gateway compares with other devices
- Conflicts detected and flagged
- Admin console shows reconciliation

### Admin Console Features

#### 1. Network Metrics Dashboard

**Total Devices**: 1,247 registered wallets
- **Active**: 892 (online in last 24h)
- **Inactive**: 355 (offline > 24h)

**Total Transactions**: 45,821 all-time
- Growing in real-time when auto-refresh enabled
- Distributed across all gateways

**Pending Reconciliations**: 23 in queue
- Devices waiting to sync
- Updated every 5 seconds

**Network Health**: 89%
- Based on gateway uptime
- Transaction success rate
- Conflict resolution rate

**Try It**:
- Click "Live" button to enable auto-refresh
- Watch metrics update in real-time
- See network breathing

#### 2. Gateway Management

**Gateway Types**:
- **LoRa**: Long-range rural connectivity
- **SMS**: Feature phone integration
- **Mesh**: Urban peer-to-peer network

**Gateway States**:
- **Online** (Green): Healthy, syncing normally
- **Syncing** (Yellow): Active reconciliation in progress
- **Offline** (Red): No connection > 15 minutes

**Actions**:
- **Reconcile**: Force sync with this gateway
- **Health %**: Current operational status
- **Last Sync**: Time since last successful sync

**Try It**:
1. Find "gw_market_04" (offline gateway)
2. Click "Reconcile"
3. Watch status change: Offline → Syncing → Online
4. See health percentage improve

#### 3. Conflict Resolution

**What Is a Conflict?**
- Same transaction ID with different data
- Double-spend attempts
- Merkle tree mismatches between devices
- Signature validation failures

**Automatic Resolution** (90% of cases):
- Timestamp comparison (earlier wins)
- Majority receipt validation
- Cryptographic proof verification

**Manual Escalation** (10% of cases):
- Human arbitrator reviews evidence
- Both parties' signatures examined
- Decision recorded on-chain

**Try It**:
1. Go to "Conflicts" tab
2. See pending conflict (double spend detected)
3. Click "Auto-Resolve"
4. System uses timestamps to determine valid transaction
5. Conflict status changes to "Resolved"

**Escalation Flow**:
1. Find another conflict
2. Click "Escalate"
3. Moves to manual review queue
4. Would notify arbitrators in production

#### 4. Reconciliation Dashboard

**Merkle Tree Stats**:
- **Total Snapshots**: 1,247 (one per active device)
- **Pending Merges**: 23 devices waiting to reconcile
- **Success Rate**: 98.7% automatic resolution
- **Avg Merge Time**: 3.2 seconds

**Recent Reconciliations**:
- Shows last 10 sync operations
- Gateway pairs that reconciled
- Success/failure status
- Time elapsed

**Force Global Reconciliation**:
- Emergency button to sync all devices
- Used during network partition recovery
- Takes 5-10 minutes for full network

---

## Simulated Scenarios

### Scenario 1: Market Vendor Payment

**Context**: You're buying vegetables at a local market. Vendor has no internet.

**Steps**:
1. Launch Wallet
2. Select **NFC** transport (tap-to-pay)
3. Enter vendor ID: `vendor_market`
4. Amount: `25` OFFG
5. Click Send Payment
6. Tap phones together (simulated)
7. Instant receipt exchange
8. Payment confirmed in 2 seconds

**What Happened**:
- Your device created signed transaction
- NFC transferred encrypted payload
- Vendor's device validated signature
- Vendor sent signed receipt back
- Both devices updated balances
- No internet needed!

### Scenario 2: Rural Village Transfer

**Context**: Sending money to family 10km away in rural area

**Steps**:
1. Select **LoRa** transport
2. Enter recipient: `village_elder`
3. Amount: `100` OFFG
4. Click Send Payment
5. Payment routed through gateway
6. Receipt received in 5 seconds

**What Happened**:
- Your device signed transaction
- LoRa radio transmitted to gateway
- Gateway forwarded to recipient's village gateway
- Recipient's gateway delivered to their device
- Receipt returned via same path
- Gateways log transaction for reconciliation

### Scenario 3: Offline Network Partition

**Context**: Your village is cut off from internet for 3 days

**Simulation**:
1. Perform 5-10 transactions in wallet
2. Don't click "Sync" button
3. All transactions stay in pending/local state
4. Continue transacting within village
5. After 3 days, connectivity restored
6. Click "Sync"
7. All transactions reconciled at once

**What Happens**:
- Village operates as independent network
- Transactions use peer-to-peer receipts
- Local Merkle trees track all activity
- When gateway reconnects:
  - Upload local Merkle snapshot
  - Gateway compares with global state
  - Conflicts auto-resolved
  - Network state updated

### Scenario 4: Double-Spend Attempt (Caught!)

**Context**: Malicious user tries to spend same funds twice

**Steps**:
1. User sends 50 OFFG to merchant A (offline)
2. Before merchant syncs, user sends same 50 OFFG to merchant B
3. Both merchants eventually sync to gateway
4. Go to Admin Console → Conflicts tab
5. See conflict detected!
6. Click "Auto-Resolve"
7. Earlier transaction (merchant A) wins
8. Merchant B transaction rejected
9. Merchant B gets refund proof

**Defense Mechanisms**:
- Local balance lock prevents immediate re-spend
- Unique nonces per transaction
- Merkle tree comparison reveals duplicate
- Timestamp-based resolution
- Losing merchant notified automatically
- Attacker's reputation score decreased

---

## Advanced Features Demo

### Feature 1: Social Recovery

**Scenario**: Lost phone, need to recover wallet

**Setup** (in production):
1. Choose 5 trusted guardians
2. System splits private key into 5 encrypted shares
3. Each guardian gets one share
4. Need 3 guardians to recover

**Recovery Flow** (simulated):
1. Install app on new device
2. Select "Recover Wallet"
3. Contact 3 guardians
4. Each guardian approves recovery
5. System reconstructs private key
6. Transaction history synced from gateway
7. Old device automatically disabled

### Feature 2: Reputation System

**How It Works**:
- New devices limited to $10/transaction
- Each successful transaction increases reputation
- High-reputation devices get higher limits
- Disputes decrease reputation
- Guardians get unlimited privileges

**Try It** (simulated in code):
```
New User (0 days):
- Max $10 per TX
- 5 TX per hour
- Guardian approval for >$5

Trusted User (500+ TX):
- Max $1000 per TX
- 50 TX per hour
- No restrictions <$500
```

### Feature 3: Rate Limiting

**Purpose**: Prevent fraud in offline environments

**Limits**:
- New devices: 5 TX/hour, 15-min cooldown
- Medium reputation: 20 TX/hour, 5-min cooldown
- High reputation: 50 TX/hour, no cooldown

**What Happens When Exceeded**:
- Transaction rejected
- "Rate limit exceeded" error
- Suggested wait time shown
- Can override with guardian approval

### Feature 4: SMS Payment Encoding

**Try It**:
1. Select SMS transport
2. Send payment
3. Check developer console (F12)
4. See encoded SMS format:

```
PAY|device_a|device_b|25|42|1635789012|xF3jK9...
```

**Format Breakdown**:
- `PAY`: Payment indicator
- `device_a`: Sender ID (truncated)
- `device_b`: Recipient ID (truncated)
- `25`: Amount
- `42`: Nonce
- `1635789012`: Timestamp
- `xF3jK9...`: Signature (truncated)

**Why It's Compact**:
- SMS has 160 character limit
- Truncated IDs save space
- Signature shortened but verifiable
- Entire payment fits in one SMS

---

## Developer Features

### SDK Usage

The core payment SDK is accessible at `/packages/offline-sdk.ts`

**Basic Usage**:
```typescript
import { OfflinePaymentSDK } from './packages/offline-sdk'

// Initialize wallet
const wallet = new OfflinePaymentSDK()

// Get device info
const deviceId = wallet.getDeviceId()
const balance = wallet.getBalance()

// Create transaction
const tx = wallet.createTransaction(
  'recipient_device_id',
  25.00,
  'BLE'
)

// Verify transaction
const isValid = wallet.verifyTransaction(tx, senderPublicKey)

// Create receipt
const receipt = wallet.createReceipt(tx, 'accepted')

// Finalize transaction
wallet.finalizeTransaction(tx.id, receipt)

// Create Merkle snapshot
const snapshot = wallet.createMerkleSnapshot()

// Reconcile with another device
const result = wallet.reconcile(remoteLedger)
```

### Customization Points

**1. Transport Layer**:
- Add new transport adapters
- Implement hardware-specific protocols
- Custom peer discovery mechanisms

**2. Reconciliation Logic**:
- Modify conflict resolution rules
- Custom Merkle tree implementations
- Different consensus mechanisms

**3. Security Policies**:
- Adjust rate limits per deployment
- Custom reputation algorithms
- Different key management strategies

---

## Troubleshooting

### Wallet Issues

**Problem**: Balance not updating after transaction
- **Check**: Transaction status (pending vs confirmed)
- **Solution**: Wait for receipt exchange (2-10 sec)
- **Debug**: Check browser console for errors

**Problem**: Can't send payment
- **Check**: Available balance
- **Check**: Rate limit status
- **Solution**: Wait for cooldown period

**Problem**: Transaction stuck in pending
- **Cause**: Receiver didn't send receipt
- **Auto-Fix**: Cancels after 10 minutes
- **Manual**: Click "Cancel" if available

### Admin Console Issues

**Problem**: Gateway shows offline
- **Demo**: This is intentional for demonstration
- **Fix**: Click "Reconcile" to simulate reconnection

**Problem**: Metrics not updating
- **Check**: "Live" toggle enabled
- **Solution**: Click "Live" button to enable auto-refresh

**Problem**: Conflict won't resolve
- **Check**: Is it in "escalated" status?
- **Meaning**: Would go to manual review in production

---

## What's NOT Simulated (Production Needs)

### Real Hardware Required
- Actual Bluetooth pairing and data transfer
- Physical NFC tapping
- Real LoRa radio hardware
- SMS gateway integration

### Backend Services Needed
- PostgreSQL database for persistence
- Redis for queue management
- Multiple gateway servers
- Relayer reconciliation service

### Security Features Not Fully Implemented
- True hardware keystore integration
- Biometric authentication
- Secure enclave usage
- Professional cryptographic audit

### Network Features
- True mesh networking (libp2p)
- Multi-hop routing
- Network partition detection
- Automatic gateway failover

---

## Next Steps

### For Users
1. **Explore All Transports**: Try BLE, NFC, LoRa, SMS
2. **Send Multiple Payments**: Build transaction history
3. **Create Snapshots**: See Merkle tree in action
4. **Check Admin Console**: Understand network overview
5. **Resolve Conflicts**: See dispute resolution

### For Developers
1. **Review SDK Code**: `/packages/offline-sdk.ts`
2. **Inspect Components**: `/components/WalletInterface.tsx`
3. **Read Security Docs**: `/docs/SECURITY.md`
4. **Plan Integration**: Adapt for your use case
5. **Security Audit**: Required for production

### For Deployers
1. **Hardware Selection**: Choose devices and gateways
2. **Network Design**: Plan gateway placement
3. **Security Review**: Professional audit required
4. **Pilot Program**: Test with small community
5. **Scale Up**: Expand based on learnings

---

## Support & Resources

### Documentation
- **README.md**: Project overview and architecture
- **SECURITY.md**: Threat model and security mechanisms
- **This Guide**: Interactive demo walkthrough

### Code Structure
- `/packages/offline-sdk.ts`: Core payment protocol
- `/components/WalletInterface.tsx`: Mobile wallet UI
- `/components/AdminConsole.tsx`: Gateway management
- `/components/OffGridLanding.tsx`: Landing page

### Community (Hypothetical)
- GitHub: github.com/offgrid-protocol
- Discord: discord.gg/offgrid
- Docs: docs.offgrid.network
- Email: support@offgrid.network

---

**Enjoy exploring the future of offline payments! 🚀**