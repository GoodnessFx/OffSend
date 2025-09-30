import React, { useState, useEffect } from 'react';
import { OfflinePaymentSDK, Transaction } from '../packages/offline-sdk';
import { Bluetooth, Smartphone, Radio, MessageSquare, Send, Download, Users, Shield, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';

interface WalletInterfaceProps {
  onNavigateToAdmin: () => void;
}

export function WalletInterface({ onNavigateToAdmin }: WalletInterfaceProps) {
  const [sdk] = useState(() => new OfflinePaymentSDK());
  const [balance, setBalance] = useState(sdk.getBalance());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTx, setPendingTx] = useState<Transaction[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedTransport, setSelectedTransport] = useState<'BLE' | 'NFC' | 'LoRa' | 'SMS'>('BLE');
  const [isOnline, setIsOnline] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const ledger = sdk.getLedger();
    setTransactions(ledger.transactions);
    setPendingTx(ledger.pendingTransactions);
    setBalance(ledger.balance);
  }, [sdk]);

  const handleSendPayment = () => {
    if (!recipientId || !amount) {
      toast.error('Please enter recipient and amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || amountNum > balance) {
      toast.error('Invalid amount');
      return;
    }

    try {
      const tx = sdk.createTransaction(recipientId, amountNum, selectedTransport);
      
      // Simulate transfer and receipt
      setTimeout(() => {
        const receipt = sdk.createReceipt(tx, 'accepted');
        sdk.finalizeTransaction(tx.id, receipt);
        
        const ledger = sdk.getLedger();
        setTransactions(ledger.transactions);
        setPendingTx(ledger.pendingTransactions);
        setBalance(ledger.balance);
        
        toast.success(`Payment sent via ${selectedTransport}`, {
          description: `${amountNum} units transferred`
        });
      }, 2000);

      setRecipientId('');
      setAmount('');
      
      const ledger = sdk.getLedger();
      setPendingTx(ledger.pendingTransactions);
      setBalance(ledger.balance);
      
      toast.info('Payment initiated', {
        description: 'Waiting for peer acknowledgment...'
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const handleScan = (transport: 'BLE' | 'NFC' | 'LoRa' | 'SMS') => {
    setIsScanning(true);
    setSelectedTransport(transport);
    
    toast.info(`Scanning for ${transport} devices...`);
    
    // Simulate device discovery
    setTimeout(() => {
      setIsScanning(false);
      const mockDevices = ['device_a1b2', 'device_c3d4', 'device_e5f6'];
      toast.success('Devices found', {
        description: `Found ${mockDevices.length} nearby devices`
      });
    }, 2000);
  };

  const handleCreateSnapshot = () => {
    const snapshot = sdk.createMerkleSnapshot();
    toast.success('Merkle snapshot created', {
      description: `Root: ${snapshot.root.substring(0, 16)}...`
    });
  };

  const handleSync = () => {
    setIsOnline(true);
    toast.success('Connected to gateway', {
      description: 'Syncing transactions...'
    });
    
    setTimeout(() => {
      toast.success('Sync complete', {
        description: `${transactions.length} transactions verified`
      });
    }, 1500);
  };

  const getTransportIcon = (transport?: 'BLE' | 'NFC' | 'LoRa' | 'SMS') => {
    switch (transport) {
      case 'BLE': return <Bluetooth className="h-4 w-4" />;
      case 'NFC': return <Smartphone className="h-4 w-4" />;
      case 'LoRa': return <Radio className="h-4 w-4" />;
      case 'SMS': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white">Off-Grid Wallet</h1>
            <p className="text-sm text-gray-400">Device: {sdk.getDeviceId()}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToAdmin}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Admin
          </Button>
        </div>

        {/* Status Bar */}
        <div className="flex gap-2 mb-4">
          <Badge variant={isOnline ? "default" : "secondary"} className="flex-1">
            <div className={`h-2 w-2 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          <Badge variant="outline" className="flex-1 bg-white/5 border-white/20">
            <Shield className="h-3 w-3 mr-1" />
            Encrypted
          </Badge>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 border-0 text-white p-6 mb-6">
          <p className="text-sm opacity-90 mb-2">Available Balance</p>
          <h2 className="mb-4">{balance.toFixed(2)} OFFG</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSync}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Sync
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCreateSnapshot}
              className="flex-1"
            >
              <Shield className="h-4 w-4 mr-2" />
              Snapshot
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/10">
            <TabsTrigger value="send" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Send
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              History
            </TabsTrigger>
          </TabsList>

          {/* Send Tab */}
          <TabsContent value="send" className="space-y-4">
            {/* Transport Selection */}
            <div>
              <label className="text-white text-sm mb-2 block">Select Transport</label>
              <div className="grid grid-cols-4 gap-2">
                {(['BLE', 'NFC', 'LoRa', 'SMS'] as const).map(transport => (
                  <Button
                    key={transport}
                    variant={selectedTransport === transport ? "default" : "outline"}
                    onClick={() => handleScan(transport)}
                    disabled={isScanning}
                    className={`flex flex-col h-20 ${
                      selectedTransport === transport 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    {getTransportIcon(transport)}
                    <span className="text-xs mt-1">{transport}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Send Form */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Recipient ID</label>
                  <Input
                    placeholder="device_xxxx or scan QR"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="text-white text-sm mb-2 block">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <Button 
                  onClick={handleSendPayment}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Payment
                </Button>
              </div>
            </Card>

            {/* Pending Transactions */}
            {pendingTx.length > 0 && (
              <Card className="bg-yellow-900/20 border-yellow-600/30 p-4">
                <h3 className="text-yellow-300 text-sm mb-2">Pending ({pendingTx.length})</h3>
                <div className="space-y-2">
                  {pendingTx.map(tx => (
                    <div key={tx.id} className="flex justify-between text-sm text-yellow-100">
                      <span>To: {tx.to.substring(0, 12)}...</span>
                      <span>{tx.amount} OFFG</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-2">
            {transactions.length === 0 ? (
              <Card className="bg-white/5 border-white/10 p-8 text-center">
                <p className="text-gray-400">No transactions yet</p>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {transactions.slice().reverse().map(tx => (
                  <Card key={tx.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTransportIcon(tx.metadata?.transport)}
                        <div>
                          <p className="text-white text-sm">
                            {tx.from === sdk.getDeviceId() ? 'Sent' : 'Received'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`${tx.from === sdk.getDeviceId() ? 'text-red-400' : 'text-green-400'}`}>
                          {tx.from === sdk.getDeviceId() ? '-' : '+'}{tx.amount} OFFG
                        </p>
                        {tx.receipt && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {tx.receipt.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {tx.from === sdk.getDeviceId() 
                        ? `To: ${tx.to}` 
                        : `From: ${tx.from}`}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}