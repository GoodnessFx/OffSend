/**
 * Offline Payment Protocol SDK
 * Handles cryptographic operations, transaction signing, and Merkle tree reconciliation
 */

import { sha256 } from 'js-sha256';
import nacl from 'tweetnacl';

// Base64 encoding/decoding utilities
function encodeBase64(bytes: Uint8Array): string {
  const base64abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i;
  const l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
    result += base64abc[bytes[i] & 0x3f];
  }
  if (i === l + 1) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[(bytes[i - 2] & 0x03) << 4];
    result += '==';
  }
  if (i === l) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[(bytes[i - 1] & 0x0f) << 2];
    result += '=';
  }
  return result;
}

function decodeBase64(str: string): Uint8Array {
  const base64abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const base64codes = [
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255,
    255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255,
    255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
  ];
  
  let missingOctets = str.endsWith('==') ? 2 : str.endsWith('=') ? 1 : 0;
  let n = str.length;
  let result = new Uint8Array(3 * (n / 4));
  let buffer;
  
  for (let i = 0, j = 0; i < n; i += 4, j += 3) {
    buffer =
      (base64codes[str.charCodeAt(i)] << 18) |
      (base64codes[str.charCodeAt(i + 1)] << 12) |
      (base64codes[str.charCodeAt(i + 2)] << 6) |
      base64codes[str.charCodeAt(i + 3)];
    result[j] = buffer >> 16;
    result[j + 1] = (buffer >> 8) & 0xff;
    result[j + 2] = buffer & 0xff;
  }
  
  return result.subarray(0, result.length - missingOctets);
}

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  nonce: number;
  timestamp: number;
  signature: string;
  receipt?: TransactionReceipt;
  metadata?: {
    transport?: 'BLE' | 'NFC' | 'LoRa' | 'SMS';
    offline?: boolean;
  };
}

export interface TransactionReceipt {
  txId: string;
  receiverSignature: string;
  timestamp: number;
  status: 'accepted' | 'pending' | 'rejected';
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: Transaction;
}

export interface MerkleSnapshot {
  root: string;
  timestamp: number;
  signature: string;
  txCount: number;
}

export interface LedgerState {
  transactions: Transaction[];
  balance: number;
  nonce: number;
  merkleSnapshots: MerkleSnapshot[];
  pendingTransactions: Transaction[];
}

export class OfflinePaymentSDK {
  private keyPair: KeyPair;
  private ledger: LedgerState;
  private deviceId: string;

  constructor(seed?: Uint8Array) {
    this.keyPair = seed 
      ? nacl.sign.keyPair.fromSeed(seed)
      : nacl.sign.keyPair();
    
    this.deviceId = this.getPublicKeyHex().substring(0, 16);
    this.ledger = {
      transactions: [],
      balance: 1000, // Initial balance for demo
      nonce: 0,
      merkleSnapshots: [],
      pendingTransactions: []
    };
  }

  getPublicKeyHex(): string {
    return Array.from(this.keyPair.publicKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  getBalance(): number {
    return this.ledger.balance;
  }

  getLedger(): LedgerState {
    return { ...this.ledger };
  }

  /**
   * Create a signed transaction
   */
  createTransaction(
    to: string,
    amount: number,
    transport: 'BLE' | 'NFC' | 'LoRa' | 'SMS' = 'BLE'
  ): Transaction {
    if (amount > this.ledger.balance) {
      throw new Error('Insufficient balance');
    }

    const tx: Transaction = {
      id: this.generateTxId(),
      from: this.deviceId,
      to,
      amount,
      nonce: this.ledger.nonce++,
      timestamp: Date.now(),
      signature: '',
      metadata: {
        transport,
        offline: true
      }
    };

    // Sign the transaction
    tx.signature = this.signTransaction(tx);

    // Tentatively deduct balance
    this.ledger.balance -= amount;
    this.ledger.pendingTransactions.push(tx);

    return tx;
  }

  /**
   * Sign a transaction
   */
  private signTransaction(tx: Transaction): string {
    const message = this.serializeTransaction(tx);
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, this.keyPair.secretKey);
    return encodeBase64(signature);
  }

  /**
   * Verify a transaction signature
   */
  verifyTransaction(tx: Transaction, publicKeyHex: string): boolean {
    const message = this.serializeTransaction(tx);
    const messageBytes = new TextEncoder().encode(message);
    const signature = decodeBase64(tx.signature);
    const publicKey = this.hexToBytes(publicKeyHex);

    return nacl.sign.detached.verify(messageBytes, signature, publicKey);
  }

  /**
   * Create a receipt for a received transaction
   */
  createReceipt(tx: Transaction, status: 'accepted' | 'rejected' = 'accepted'): TransactionReceipt {
    const receipt: TransactionReceipt = {
      txId: tx.id,
      receiverSignature: '',
      timestamp: Date.now(),
      status
    };

    // Sign the receipt
    const message = `${receipt.txId}:${receipt.status}:${receipt.timestamp}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, this.keyPair.secretKey);
    receipt.receiverSignature = encodeBase64(signature);

    if (status === 'accepted') {
      // Add to ledger and update balance
      tx.receipt = receipt;
      this.ledger.transactions.push(tx);
      this.ledger.balance += tx.amount;
    }

    return receipt;
  }

  /**
   * Finalize a pending transaction with a receipt
   */
  finalizeTransaction(txId: string, receipt: TransactionReceipt): void {
    const pendingIdx = this.ledger.pendingTransactions.findIndex(tx => tx.id === txId);
    
    if (pendingIdx === -1) {
      throw new Error('Transaction not found in pending queue');
    }

    const tx = this.ledger.pendingTransactions[pendingIdx];
    
    if (receipt.status === 'accepted') {
      tx.receipt = receipt;
      this.ledger.transactions.push(tx);
      this.ledger.pendingTransactions.splice(pendingIdx, 1);
    } else {
      // Refund the amount
      this.ledger.balance += tx.amount;
      this.ledger.pendingTransactions.splice(pendingIdx, 1);
    }
  }

  /**
   * Build a Merkle tree from transactions
   */
  buildMerkleTree(transactions: Transaction[]): MerkleNode | null {
    if (transactions.length === 0) return null;

    const leaves: MerkleNode[] = transactions.map(tx => ({
      hash: this.hashTransaction(tx),
      data: tx
    }));

    return this.buildMerkleTreeRecursive(leaves);
  }

  private buildMerkleTreeRecursive(nodes: MerkleNode[]): MerkleNode {
    if (nodes.length === 1) return nodes[0];

    const nextLevel: MerkleNode[] = [];

    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = i + 1 < nodes.length ? nodes[i + 1] : left;

      const parent: MerkleNode = {
        hash: sha256(left.hash + right.hash),
        left,
        right: right !== left ? right : undefined
      };

      nextLevel.push(parent);
    }

    return this.buildMerkleTreeRecursive(nextLevel);
  }

  /**
   * Create a Merkle snapshot of current ledger state
   */
  createMerkleSnapshot(): MerkleSnapshot {
    const tree = this.buildMerkleTree(this.ledger.transactions);
    const rootHash = tree?.hash || sha256('empty');

    const snapshot: MerkleSnapshot = {
      root: rootHash,
      timestamp: Date.now(),
      signature: '',
      txCount: this.ledger.transactions.length
    };

    // Sign the snapshot
    const message = `${snapshot.root}:${snapshot.timestamp}:${snapshot.txCount}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, this.keyPair.secretKey);
    snapshot.signature = encodeBase64(signature);

    this.ledger.merkleSnapshots.push(snapshot);

    return snapshot;
  }

  /**
   * Reconcile with another device's ledger
   */
  reconcile(remoteLedger: LedgerState): {
    conflicts: Transaction[];
    newTransactions: Transaction[];
    merged: LedgerState;
  } {
    const localTxMap = new Map(this.ledger.transactions.map(tx => [tx.id, tx]));
    const remoteTxMap = new Map(remoteLedger.transactions.map(tx => [tx.id, tx]));

    const conflicts: Transaction[] = [];
    const newTransactions: Transaction[] = [];

    // Find new transactions from remote
    remoteLedger.transactions.forEach(remoteTx => {
      if (!localTxMap.has(remoteTx.id)) {
        newTransactions.push(remoteTx);
      } else {
        const localTx = localTxMap.get(remoteTx.id)!;
        // Check for conflicts (same tx id but different data)
        if (this.hashTransaction(localTx) !== this.hashTransaction(remoteTx)) {
          conflicts.push(remoteTx);
        }
      }
    });

    // Merge transactions (for demo, trust timestamped transactions)
    const mergedTransactions = [
      ...this.ledger.transactions,
      ...newTransactions.filter(tx => this.verifyTransaction(tx, tx.from))
    ].sort((a, b) => a.timestamp - b.timestamp);

    // Recalculate balance
    const mergedBalance = this.recalculateBalance(mergedTransactions);

    const merged: LedgerState = {
      transactions: mergedTransactions,
      balance: mergedBalance,
      nonce: Math.max(this.ledger.nonce, remoteLedger.nonce),
      merkleSnapshots: [...this.ledger.merkleSnapshots],
      pendingTransactions: [...this.ledger.pendingTransactions]
    };

    return { conflicts, newTransactions, merged };
  }

  /**
   * Apply merged ledger state
   */
  applyMergedState(merged: LedgerState): void {
    this.ledger = merged;
  }

  /**
   * Export ledger for backup
   */
  exportLedger(): string {
    return JSON.stringify(this.ledger);
  }

  /**
   * Import ledger from backup
   */
  importLedger(data: string): void {
    this.ledger = JSON.parse(data);
  }

  // Helper methods
  private serializeTransaction(tx: Transaction): string {
    return `${tx.id}:${tx.from}:${tx.to}:${tx.amount}:${tx.nonce}:${tx.timestamp}`;
  }

  private hashTransaction(tx: Transaction): string {
    return sha256(this.serializeTransaction(tx));
  }

  private generateTxId(): string {
    return sha256(
      `${this.deviceId}:${this.ledger.nonce}:${Date.now()}:${Math.random()}`
    ).substring(0, 32);
  }

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }

  private recalculateBalance(transactions: Transaction[]): number {
    let balance = 1000; // Initial balance

    transactions.forEach(tx => {
      if (tx.from === this.deviceId && tx.receipt?.status === 'accepted') {
        balance -= tx.amount;
      } else if (tx.to === this.deviceId && tx.receipt?.status === 'accepted') {
        balance += tx.amount;
      }
    });

    return balance;
  }
}

/**
 * SMS Payment Encoder
 * Encodes payments into compact SMS format
 */
export class SMSPaymentEncoder {
  static encode(tx: Transaction): string {
    // Format: PAY|from|to|amount|nonce|timestamp|signature
    const parts = [
      'PAY',
      tx.from.substring(0, 8),
      tx.to.substring(0, 8),
      tx.amount.toString(),
      tx.nonce.toString(),
      tx.timestamp.toString(),
      tx.signature.substring(0, 32)
    ];
    return parts.join('|');
  }

  static decode(sms: string): Partial<Transaction> {
    const parts = sms.split('|');
    if (parts[0] !== 'PAY' || parts.length < 7) {
      throw new Error('Invalid SMS payment format');
    }

    return {
      from: parts[1],
      to: parts[2],
      amount: parseFloat(parts[3]),
      nonce: parseInt(parts[4]),
      timestamp: parseInt(parts[5]),
      signature: parts[6]
    };
  }
}