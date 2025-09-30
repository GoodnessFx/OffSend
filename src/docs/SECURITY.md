# Security Architecture & Threat Model

## Executive Summary

The Off-Grid Payment Protocol implements defense-in-depth security with cryptographic signatures, peer validation, Merkle tree reconciliation, and rate limiting to prevent fraud in offline environments. This document details the security mechanisms, threat model, recovery patterns, and production deployment checklist.

## Core Security Principles

### 1. **Zero Trust Architecture**
- Every transaction must be cryptographically signed
- No transaction is final without peer receipt
- All reconciliations must be deterministically verifiable
- Gateways cannot unilaterally modify transaction history

### 2. **Defense in Depth**
- **Layer 1**: Local cryptographic validation
- **Layer 2**: Peer receipt exchange
- **Layer 3**: Merkle tree reconciliation
- **Layer 4**: Gateway consensus
- **Layer 5**: Manual escalation for disputes

### 3. **Privacy by Design**
- Minimal data collection
- Pseudonymous device identifiers
- Local-first data storage
- Optional end-to-end encryption for metadata

### 4. **Resilience**
- Offline-first operation
- Graceful degradation
- Multi-path redundancy
- Social recovery mechanisms

---

## Threat Model

### Critical Threats

#### 1. **Double Spend Attack**
**Threat**: Attacker spends same funds with multiple recipients while offline

**Attack Vector**:
- Create valid signed transaction to Merchant A
- Create identical transaction to Merchant B
- Send both before either syncs with gateway

**Mitigation**:
- **Local Lock**: Balance deducted immediately on send
- **Nonce Enforcement**: Each transaction has unique sequential nonce
- **Peer Receipts**: Both parties must sign acknowledgment
- **Merkle Reconciliation**: Gateway detects conflict via tree diff
- **Timestamp Resolution**: Earlier signed transaction wins
- **Receipt Majority**: Transaction with most peer signatures wins

**Residual Risk**: Medium
- Sophisticated attacker could attempt timing attacks
- Requires gateway reconciliation within reasonable timeframe
- **Recommended**: Rate limit high-value offline transactions

#### 2. **Replay Attack**
**Threat**: Attacker intercepts and replays valid signed transaction

**Attack Vector**:
- Intercept BLE/NFC transmission
- Replay same signed message to different recipient

**Mitigation**:
- **Timestamped Nonces**: Each TX includes timestamp + unique nonce
- **Recipient Binding**: Signature includes recipient device ID
- **Short Time Window**: TXs older than 5 minutes rejected
- **Sequence Numbers**: Nonces must be sequential per sender

**Residual Risk**: Low
- Window of opportunity < 5 minutes
- Requires active interception during transfer

#### 3. **Man-in-the-Middle (MITM)**
**Threat**: Attacker intercepts and modifies transaction during transfer

**Attack Vector**:
- Position between sender and receiver (BLE/NFC)
- Modify transaction amount or recipient
- Forward modified transaction

**Mitigation**:
- **End-to-End Signatures**: Entire TX is signed, any modification invalidates
- **Public Key Binding**: Receiver verifies sender's public key
- **Tamper Detection**: Hash of TX must match signed hash
- **Receipt Verification**: Receiver signs exact TX received

**Residual Risk**: Very Low
- Cryptographically impossible without private key compromise
- Modified TX will fail signature verification

#### 4. **Sybil Attack**
**Threat**: Attacker creates many fake devices to manipulate network

**Attack Vector**:
- Create thousands of virtual devices
- Flood network with fake receipts
- Attempt to win majority in reconciliation disputes

**Mitigation**:
- **Reputation Scoring**: New devices start with low trust
- **Rate Limiting**: Limits on transactions from new devices
- **Gateway Verification**: Gateways validate device authenticity
- **Social Graph**: Trusted relationships weighted higher
- **Proof of Work**: Optional computational puzzle for new devices

**Residual Risk**: Medium
- Distributed attack difficult to detect
- **Recommended**: Require guardian approval for new device registration

#### 5. **Gateway Fraud**
**Threat**: Malicious gateway manipulates reconciliation results

**Attack Vector**:
- Gateway operator modifies Merkle roots
- Selectively drops valid transactions
- Reports false conflict resolutions

**Mitigation**:
- **Multiple Gateway Verification**: Cross-check with 3+ gateways
- **Signed Merkle Roots**: Devices sign their own snapshots
- **Transparent Logs**: All reconciliations publicly auditable
- **Gateway Reputation**: Track gateway behavior over time
- **Community Governance**: Gateways operated by trusted NGOs/communities

**Residual Risk**: Low-Medium
- Requires collusion of multiple gateways
- Transparent logs enable detection
- **Recommended**: Require 3-of-5 gateway consensus for disputes

### High-Priority Threats

#### 6. **Device Loss/Theft**
**Threat**: Attacker gains physical access to unlocked device

**Mitigation**:
- **Device Lock**: PIN/biometric required
- **Secure Enclave**: Keys stored in hardware keystore
- **Social Recovery**: Guardians can freeze compromised device
- **Transaction Limits**: Require 2FA for large amounts
- **Remote Wipe**: Device can be disabled remotely (when online)

#### 7. **Private Key Compromise**
**Threat**: Attacker extracts private key from device

**Mitigation**:
- **Hardware Keystore**: Keys never leave secure enclave
- **No Export**: Private key cannot be extracted via API
- **Biometric Binding**: Key usage requires biometric approval
- **Guardian Recovery**: New key can be established via social recovery

#### 8. **Fake Receipt Attack**
**Threat**: Receiver claims they sent receipt but sender never received it

**Mitigation**:
- **Bidirectional Verification**: Both parties must have signed proof
- **Timeout Mechanism**: TX auto-cancels after 10 minutes without receipt
- **Balance Refund**: Failed TX returns funds to sender
- **Dispute Resolution**: Manual review with cryptographic proof

---

## Cryptographic Implementation

### Key Generation
```typescript
// Ed25519 keypair using NaCl
const keyPair = nacl.sign.keyPair()
// OR from seed for deterministic generation
const keyPair = nacl.sign.keyPair.fromSeed(seed)

// Store in platform keystore
Keychain.set('private_key', keyPair.secretKey)
```

### Transaction Signing
```typescript
// Serialize transaction
const message = `${tx.id}:${tx.from}:${tx.to}:${tx.amount}:${tx.nonce}:${tx.timestamp}`

// Sign with Ed25519
const signature = nacl.sign.detached(
  new TextEncoder().encode(message),
  secretKey
)

tx.signature = base64Encode(signature)
```

### Signature Verification
```typescript
// Reconstruct message
const message = `${tx.id}:${tx.from}:${tx.to}:${tx.amount}:${tx.nonce}:${tx.timestamp}`

// Verify signature
const valid = nacl.sign.detached.verify(
  new TextEncoder().encode(message),
  base64Decode(tx.signature),
  senderPublicKey
)
```

### Merkle Tree Construction
```typescript
// Hash each transaction
const leaves = transactions.map(tx => sha256(serialize(tx)))

// Build tree bottom-up
function buildMerkleTree(hashes) {
  if (hashes.length === 1) return hashes[0]
  
  const nextLevel = []
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i]
    const right = hashes[i + 1] || left
    nextLevel.push(sha256(left + right))
  }
  
  return buildMerkleTree(nextLevel)
}

const merkleRoot = buildMerkleTree(leaves)
```

---

## Recovery Patterns

### 1. **Device Loss Recovery**

#### Social Recovery (Recommended)
**Setup**:
- User selects 5 trusted guardians (family, friends, community members)
- Threshold: 3-of-5 required for recovery
- Guardians receive encrypted key shards (Shamir's Secret Sharing)

**Recovery Process**:
1. User reports device lost
2. Contacts guardians to initiate recovery
3. Each guardian approves via their device
4. Once 3 approve, recovery key generated
5. New device initialized with recovered wallet
6. Old device marked as compromised in network

**Code Example**:
```typescript
// Split key into 5 shares, requiring 3 to recover
const shares = shamirSecretSharing.split(privateKey, {
  shares: 5,
  threshold: 3
})

// Distribute to guardians
guardians.forEach((guardian, i) => {
  sendEncryptedShare(guardian, shares[i])
})

// Recovery
const recoveryShares = [share1, share2, share3]
const recoveredKey = shamirSecretSharing.combine(recoveryShares)
```

#### Seed Phrase Backup (Alternative)
**Setup**:
- Generate 24-word BIP39 mnemonic
- User writes down and stores securely
- Optional passphrase for additional security

**Recovery**:
1. User enters seed phrase on new device
2. Private key deterministically regenerated
3. Transaction history re-synced from gateways

### 2. **Transaction Dispute Resolution**

#### Automatic Resolution (90% of cases)
```
IF both parties have valid signed receipts:
  → Transaction confirmed
  
ELSE IF sender has TX but no receipt after 10 min:
  → Transaction cancelled, funds returned
  
ELSE IF receipts conflict (different amounts):
  → Use earliest timestamp
  → Require both signatures to match
  
ELSE IF Merkle roots differ:
  → Gateway compares transaction logs
  → Majority receipt validation
  → Timestamp-based resolution
```

#### Manual Escalation (10% of cases)
1. **Collect Evidence**:
   - Signed transaction from sender
   - Signed receipt from receiver (if exists)
   - Merkle snapshots from both devices
   - Gateway reconciliation logs

2. **Review Process**:
   - Community arbitrator examines evidence
   - Checks cryptographic signatures
   - Validates timestamp sequence
   - Reviews device reputation scores

3. **Resolution**:
   - Decision recorded on-chain (if available)
   - Both parties notified
   - Appeals process available

### 3. **Network Partition Recovery**

**Scenario**: Community isolated for extended period (weeks/months)

**Strategy**:
1. **Local Consensus**: Devices continue transacting within partition
2. **Merkle Checkpoints**: Daily snapshots stored locally
3. **Gateway Reconnection**: When connectivity restored
4. **Bulk Reconciliation**:
   ```typescript
   // Compare Merkle roots
   if (localRoot === gatewayRoot) {
     // No conflicts, quick sync
     return SUCCESS
   }
   
   // Identify divergence point
   const divergenceBlock = findDivergence(localTree, gatewayTree)
   
   // Replay transactions from divergence
   const conflicts = reconcileFromBlock(divergenceBlock)
   
   // Resolve conflicts via timestamp + signature validation
   conflicts.forEach(conflict => {
     const resolution = resolveConflict(conflict)
     applyResolution(resolution)
   })
   ```

---

## Rate Limiting & Anti-Abuse

### Transaction Limits

| Device Reputation | Max TX Amount | Max TX/Hour | Cooldown | Additional Verification |
|------------------|---------------|-------------|----------|------------------------|
| New (0-7 days) | $10 | 5 | 15 min | Guardian approval for >$5 |
| Low (< 50 TX) | $50 | 10 | 10 min | 2FA for >$25 |
| Medium (50-500 TX) | $200 | 20 | 5 min | None |
| High (> 500 TX) | $1000 | 50 | None | Biometric for >$500 |
| Trusted (Guardian) | Unlimited | 100 | None | Biometric for >$1000 |

### Reputation Scoring
```typescript
function calculateReputation(device) {
  let score = 0
  
  // Transaction history
  score += device.successfulTransactions * 1
  score -= device.disputedTransactions * 10
  score -= device.cancelledTransactions * 2
  
  // Time on network
  const daysActive = (Date.now() - device.createdAt) / (1000 * 60 * 60 * 24)
  score += Math.min(daysActive * 2, 200)
  
  // Social connections
  score += device.guardianOf.length * 10
  score += device.trustedBy.length * 5
  
  // Gateway validation
  if (device.kycVerified) score += 100
  
  return Math.min(score, 1000)
}
```

---

## Production Deployment Checklist

### Pre-Launch Security Audit

#### Code Review
- [ ] Third-party security audit by reputable firm
- [ ] Cryptographic implementation review
- [ ] Smart contract audit (if on-chain settlement used)
- [ ] Dependency vulnerability scan
- [ ] Penetration testing

#### Key Management
- [ ] Hardware Security Module (HSM) for gateway keys
- [ ] Secure enclave usage verified on all platforms
- [ ] Key rotation procedures documented
- [ ] Recovery mechanisms tested
- [ ] Backup encryption validated

#### Network Security
- [ ] TLS 1.3 for all gateway communication
- [ ] Certificate pinning implemented
- [ ] DDoS protection for gateways
- [ ] Firewall rules configured
- [ ] Intrusion detection system active

### Launch Requirements

#### Infrastructure
- [ ] Minimum 5 geographically distributed gateways
- [ ] 99.9% uptime SLA for gateway network
- [ ] Automated failover tested
- [ ] Backup and disaster recovery plan
- [ ] Monitoring and alerting configured

#### Compliance
- [ ] Legal review for target jurisdictions
- [ ] AML/KYC procedures (if required)
- [ ] Data privacy compliance (GDPR, etc.)
- [ ] Terms of service and privacy policy
- [ ] User consent mechanisms

#### User Protection
- [ ] Transaction insurance or guarantee fund
- [ ] Dispute resolution process documented
- [ ] 24/7 support channel
- [ ] Bug bounty program launched
- [ ] Responsible disclosure policy

### Ongoing Security

#### Monitoring
- [ ] Real-time fraud detection
- [ ] Anomaly detection for unusual patterns
- [ ] Gateway health monitoring
- [ ] Network partition detection
- [ ] Rate limit breach alerting

#### Incident Response
- [ ] Security incident response plan
- [ ] Emergency key rotation procedures
- [ ] User notification templates
- [ ] Forensics and investigation procedures
- [ ] Post-mortem process

#### Updates
- [ ] Security patch deployment process
- [ ] Cryptographic algorithm upgrade path
- [ ] Backwards compatibility strategy
- [ ] Emergency update mechanism
- [ ] User notification system

---

## Risk Assessment

### High Risk (Immediate Attention Required)
| Risk | Impact | Likelihood | Mitigation Status |
|------|--------|------------|-------------------|
| Private key extraction | Critical | Low | ✅ Hardware keystore |
| Double spend attack | High | Medium | ⚠️ Requires gateway density |
| Gateway collusion | High | Low | ✅ Multi-gateway consensus |

### Medium Risk (Monitor Closely)
| Risk | Impact | Likelihood | Mitigation Status |
|------|--------|------------|-------------------|
| Sybil attack | Medium | Medium | ⚠️ Reputation system needed |
| Network partition | Medium | High | ✅ Merkle reconciliation |
| Device theft | Medium | High | ✅ Social recovery |

### Low Risk (Acceptable)
| Risk | Impact | Likelihood | Mitigation Status |
|------|--------|------------|-------------------|
| MITM attack | Low | Low | ✅ E2E signatures |
| Replay attack | Low | Very Low | ✅ Nonces + timestamps |
| Fake receipt | Low | Low | ✅ Bidirectional proof |

---

## Emergency Procedures

### Private Key Compromise
1. **Detection**: User reports suspicious transactions
2. **Freeze**: Mark device as compromised in gateway
3. **Recovery**: Initiate social recovery with guardians
4. **New Key**: Generate new keypair on trusted device
5. **Migration**: Transfer remaining balance to new wallet
6. **Blacklist**: Old key marked as compromised permanently

### Gateway Compromise
1. **Detection**: Monitoring detects anomalous behavior
2. **Isolation**: Remove gateway from consensus pool
3. **Investigation**: Forensic analysis of logs
4. **Communication**: Notify affected users
5. **Remediation**: Patch vulnerability, restore from backup
6. **Re-certification**: Third-party audit before reconnection

### Network-Wide Attack
1. **Activation**: Emergency response team assembled
2. **Assessment**: Determine attack vector and scope
3. **Mitigation**: Deploy countermeasures
4. **Communication**: Public disclosure to all users
5. **Recovery**: Roll back to last known good state
6. **Post-Mortem**: Document and improve defenses

---

## Security Auditing

### Automated Testing
```bash
# Cryptographic tests
npm run test:crypto

# Merkle tree reconciliation tests
npm run test:merkle

# Double-spend simulation
npm run test:double-spend

# Rate limiting tests
npm run test:rate-limit
```

### Manual Testing Checklist
- [ ] Attempt double spend with multiple devices
- [ ] Test Merkle conflict resolution
- [ ] Verify signature validation edge cases
- [ ] Test social recovery flow end-to-end
- [ ] Simulate network partition scenarios
- [ ] Test gateway failure handling
- [ ] Verify rate limiting effectiveness
- [ ] Test receipt exchange failure modes

---

## Conclusion

The Off-Grid Payment Protocol implements robust security through cryptographic primitives, multi-layer validation, and deterministic reconciliation. While no system is perfectly secure, the defense-in-depth approach significantly mitigates common attack vectors.

**Critical Success Factors**:
1. Professional security audit before production launch
2. Hardware-backed key storage on all devices
3. Sufficient gateway density for timely reconciliation
4. Community education on security best practices
5. Continuous monitoring and rapid incident response

**For Production Deployment**: This security model must be validated by independent security experts and adapted to specific deployment contexts and regulatory requirements.