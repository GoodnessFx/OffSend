import React, { useState, useEffect } from 'react';
import { OfflinePaymentSDK, Transaction, MerkleSnapshot } from '../packages/offline-sdk';
import { 
  CreditCard, Send, Clock, CheckCircle2, Wifi, WifiOff, MoreHorizontal,
  User, Settings, Shield, Database, Download, Upload, Award, Lock,
  TrendingUp, History, X, ChevronRight, Copy, Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

export function SimpleWallet() {
  const [sdk] = useState(() => new OfflinePaymentSDK());
  const [balance, setBalance] = useState(sdk.getBalance());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTx, setPendingTx] = useState<Transaction[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [snapshots, setSnapshots] = useState<MerkleSnapshot[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ledger = sdk.getLedger();
    setTransactions(ledger.transactions);
    setPendingTx(ledger.pendingTransactions);
    setBalance(ledger.balance);
    setSnapshots(ledger.merkleSnapshots);
  }, [sdk]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportData = () => {
    const data = sdk.exportLedger();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-backup-${Date.now()}.json`;
    a.click();
    toast.success('Wallet data exported');
  };

  const calculateReputation = () => {
    const successfulTx = transactions.filter(tx => tx.receipt?.status === 'accepted').length;
    const totalTx = transactions.length;
    if (totalTx === 0) return 0;
    return Math.min(100, Math.floor((successfulTx / totalTx) * 100));
  };

  const handlePay = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum > balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const tx = sdk.createTransaction(
        recipient || 'merchant',
        amountNum,
        'BLE'
      );
      
      // Simulate receipt exchange
      setTimeout(() => {
        const receipt = sdk.createReceipt(tx, 'accepted');
        sdk.finalizeTransaction(tx.id, receipt);
        
        const ledger = sdk.getLedger();
        setTransactions(ledger.transactions);
        setPendingTx(ledger.pendingTransactions);
        setBalance(ledger.balance);
        
        toast.success('Payment successful');
      }, 1500);

      const ledger = sdk.getLedger();
      setPendingTx(ledger.pendingTransactions);
      setBalance(ledger.balance);
      
      setShowPayment(false);
      setAmount('');
      setRecipient('');
      
      toast.info('Processing payment...');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const handleSync = () => {
    setIsOnline(true);
    toast.success('Synced with network');
    
    // Create Merkle snapshot
    const snapshot = sdk.createMerkleSnapshot();
    setSnapshots([...snapshots, snapshot]);
    
    setTimeout(() => {
      toast.success(`${transactions.length} transactions verified`);
    }, 1000);
  };

  const handleCreateSnapshot = () => {
    const snapshot = sdk.createMerkleSnapshot();
    setSnapshots([...snapshots, snapshot]);
    toast.success('Settlement snapshot created');
  };

  return (
    <div className="min-h-screen bg-[#212121] text-white relative">
      {/* Settings Panel */}
      {showSettings && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSettings(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-[#1a1a1a] border-r border-[#333] z-50 overflow-y-auto">
            <div className="p-6">
              {/* Profile Section */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="bg-[#2a2a2a] rounded-xl p-4 mb-6 border border-[#333]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-400">Device ID</div>
                    <div className="text-xs text-gray-500 font-mono">{sdk.getDeviceId()}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(sdk.getDeviceId())}
                    className="p-2 hover:bg-[#333] rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-400">Reputation Score:</span>
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-0">
                    {calculateReputation()}%
                  </Badge>
                </div>
              </div>

              {/* Settlement Section */}
              <div className="mb-6">
                <button
                  className="w-full flex items-center justify-between p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-xl transition-colors mb-2"
                  onClick={handleCreateSnapshot}
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-400" />
                    <div className="text-left">
                      <div className="text-sm">Settlement</div>
                      <div className="text-xs text-gray-500">Create snapshot</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>

                {/* Snapshots List */}
                {snapshots.length > 0 && (
                  <div className="bg-[#2a2a2a] rounded-xl p-3 border border-[#333] mb-2">
                    <div className="text-xs text-gray-400 mb-2">Recent Snapshots</div>
                    <div className="space-y-2">
                      {snapshots.slice(-3).reverse().map((snapshot, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span className="text-gray-400">
                              {new Date(snapshot.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-gray-500">{snapshot.txCount} tx</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Settlements */}
                {pendingTx.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-yellow-500 text-sm mb-2">
                      <Clock className="h-4 w-4" />
                      <span>Pending Settlement</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {pendingTx.length} transactions waiting for confirmation
                    </div>
                  </div>
                )}
              </div>

              {/* Security Section */}
              <div className="mb-6">
                <div className="text-xs text-gray-500 uppercase mb-3">Security</div>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-400" />
                      <span className="text-sm">Backup & Recovery</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-purple-400" />
                      <span className="text-sm">Security Settings</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Data Section */}
              <div className="mb-6">
                <div className="text-xs text-gray-500 uppercase mb-3">Data</div>
                <div className="space-y-2">
                  <button 
                    onClick={handleExportData}
                    className="w-full flex items-center justify-between p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="h-5 w-5 text-blue-400" />
                      <span className="text-sm">Export Wallet Data</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-orange-400" />
                      <span className="text-sm">Import Backup</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <History className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">Transaction History</span>
                    </div>
                    <Badge className="bg-gray-600 text-white border-0">
                      {transactions.length}
                    </Badge>
                  </button>
                </div>
              </div>

              {/* Network Stats */}
              <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#333] mb-6">
                <div className="text-xs text-gray-400 mb-3">Network Stats</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={isOnline ? 'text-green-500' : 'text-gray-400'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Snapshots</span>
                    <span>{snapshots.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Success Rate</span>
                    <span className="text-green-500">{calculateReputation()}%</span>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="text-center text-xs text-gray-600 pt-4 border-t border-[#333]">
                <p>Offline Payment Protocol v1.0</p>
                <p className="mt-1">Powered by Merkle Trees & Cryptography</p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-gray-400" />
            <span className="text-gray-400">Wallet</span>
          </div>
          <button
            onClick={handleSync}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] transition-colors"
          >
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-400">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-400">Offline</span>
              </>
            )}
          </button>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl p-6 mb-6 border border-[#333]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Available Balance</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
            </div>
          </div>
          <div className="mb-6">
            <div className="text-4xl mb-2">₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-gray-500">ID: {sdk.getDeviceId()}</div>
          </div>
          {pendingTx.length > 0 && (
            <div className="flex items-center gap-2 text-yellow-500 text-sm">
              <Clock className="h-4 w-4" />
              <span>{pendingTx.length} pending settlement</span>
            </div>
          )}
        </div>

        {/* Pay Button */}
        {!showPayment ? (
          <Button
            onClick={() => setShowPayment(true)}
            className="w-full bg-white text-black hover:bg-gray-200 h-12 rounded-xl"
          >
            <Send className="h-4 w-4 mr-2" />
            Pay
          </Button>
        ) : (
          <Card className="bg-[#2a2a2a] border-[#333] p-4 mb-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#1a1a1a] border-[#333] text-white text-2xl h-14"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">To (optional)</label>
                <Input
                  placeholder="Merchant or recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-[#1a1a1a] border-[#333] text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePay}
                  className="flex-1 bg-white text-black hover:bg-gray-200"
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => {
                    setShowPayment(false);
                    setAmount('');
                    setRecipient('');
                  }}
                  variant="outline"
                  className="flex-1 bg-transparent border-[#333] text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Transactions */}
        <div className="mt-8">
          <h3 className="text-gray-400 mb-4">Recent Activity</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MoreHorizontal className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice().reverse().map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-xl border border-[#333] hover:border-[#444] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                      {tx.from === sdk.getDeviceId() ? (
                        <Send className="h-4 w-4 text-red-400" />
                      ) : (
                        <Send className="h-4 w-4 text-green-400 rotate-180" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm">
                        {tx.from === sdk.getDeviceId() ? 'Sent' : 'Received'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.timestamp).toLocaleDateString()} at{' '}
                        {new Date(tx.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={tx.from === sdk.getDeviceId() ? 'text-red-400' : 'text-green-400'}>
                      {tx.from === sdk.getDeviceId() ? '-' : '+'}₦{tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {tx.receipt && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Settings Button */}
        <div className="fixed bottom-6 left-6">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#333] rounded-full border border-[#333] transition-colors shadow-lg"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm">Settings</span>
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-[#333]">
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Offline payments powered by cryptographic signatures</p>
            <p>Settlements processed when network is available</p>
          </div>
        </div>
      </div>
    </div>
  );
}