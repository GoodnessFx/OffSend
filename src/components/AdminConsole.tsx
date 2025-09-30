import React, { useState, useEffect } from 'react';
import { Activity, Server, Shield, AlertTriangle, CheckCircle, Users, TrendingUp, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';

interface Gateway {
  id: string;
  location: string;
  status: 'online' | 'offline' | 'syncing';
  lastSync: number;
  transactionsProcessed: number;
  health: number;
  type: 'LoRa' | 'SMS' | 'Mesh';
}

interface ConflictReport {
  id: string;
  txId: string;
  deviceA: string;
  deviceB: string;
  timestamp: number;
  status: 'pending' | 'resolved' | 'escalated';
  description: string;
}

interface NetworkMetrics {
  totalDevices: number;
  activeDevices: number;
  totalTransactions: number;
  pendingReconciliations: number;
  avgSyncTime: number;
  networkHealth: number;
}

export function AdminConsole({ onBack }: { onBack: () => void }) {
  const [gateways, setGateways] = useState<Gateway[]>([
    {
      id: 'gw_rural_01',
      location: 'Rural District A',
      status: 'online',
      lastSync: Date.now() - 120000,
      transactionsProcessed: 1247,
      health: 95,
      type: 'LoRa'
    },
    {
      id: 'gw_urban_02',
      location: 'Urban Center B',
      status: 'online',
      lastSync: Date.now() - 30000,
      transactionsProcessed: 3891,
      health: 98,
      type: 'Mesh'
    },
    {
      id: 'gw_remote_03',
      location: 'Remote Village C',
      status: 'syncing',
      lastSync: Date.now() - 300000,
      transactionsProcessed: 567,
      health: 78,
      type: 'SMS'
    },
    {
      id: 'gw_market_04',
      location: 'Market Hub D',
      status: 'offline',
      lastSync: Date.now() - 900000,
      transactionsProcessed: 2134,
      health: 45,
      type: 'LoRa'
    }
  ]);

  const [conflicts, setConflicts] = useState<ConflictReport[]>([
    {
      id: 'conflict_001',
      txId: 'tx_a1b2c3d4',
      deviceA: 'device_x1y2',
      deviceB: 'device_z3w4',
      timestamp: Date.now() - 600000,
      status: 'pending',
      description: 'Double spend detected: conflicting signatures'
    },
    {
      id: 'conflict_002',
      txId: 'tx_e5f6g7h8',
      deviceA: 'device_m5n6',
      deviceB: 'device_p7q8',
      timestamp: Date.now() - 1200000,
      status: 'resolved',
      description: 'Merkle tree mismatch - resolved via timestamp'
    }
  ]);

  const [metrics, setMetrics] = useState<NetworkMetrics>({
    totalDevices: 1247,
    activeDevices: 892,
    totalTransactions: 45821,
    pendingReconciliations: 23,
    avgSyncTime: 3.2,
    networkHealth: 89
  });

  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate metrics update
        setMetrics(prev => ({
          ...prev,
          activeDevices: prev.activeDevices + Math.floor(Math.random() * 10 - 5),
          totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 20),
          pendingReconciliations: Math.max(0, prev.pendingReconciliations + Math.floor(Math.random() * 4 - 2))
        }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleReconcile = (gatewayId: string) => {
    toast.info(`Initiating reconciliation for ${gatewayId}...`);
    
    setTimeout(() => {
      setGateways(gateways.map(gw => 
        gw.id === gatewayId 
          ? { ...gw, status: 'syncing' as const, lastSync: Date.now() }
          : gw
      ));
      
      setTimeout(() => {
        setGateways(gateways.map(gw => 
          gw.id === gatewayId 
            ? { ...gw, status: 'online' as const }
            : gw
        ));
        toast.success('Reconciliation complete');
      }, 3000);
    }, 500);
  };

  const handleResolveConflict = (conflictId: string) => {
    setConflicts(conflicts.map(c => 
      c.id === conflictId 
        ? { ...c, status: 'resolved' as const }
        : c
    ));
    toast.success('Conflict resolved via timestamped signatures');
  };

  const handleEscalateConflict = (conflictId: string) => {
    setConflicts(conflicts.map(c => 
      c.id === conflictId 
        ? { ...c, status: 'escalated' as const }
        : c
    ));
    toast.info('Conflict escalated to manual review');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'syncing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white mb-2">Gateway Admin Console</h1>
            <p className="text-gray-400">Monitor and manage off-grid payment network</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`${
                autoRefresh 
                  ? 'bg-green-600 border-green-500 text-white' 
                  : 'bg-white/10 border-white/20 text-white'
              } hover:bg-white/20`}
            >
              <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Back to Wallet
            </Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 opacity-80" />
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {((metrics.activeDevices / metrics.totalDevices) * 100).toFixed(0)}%
              </Badge>
            </div>
            <h3>Active Devices</h3>
            <p className="text-sm opacity-80">{metrics.activeDevices.toLocaleString()} / {metrics.totalDevices.toLocaleString()}</p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 text-white p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 opacity-80" />
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                +12%
              </Badge>
            </div>
            <h3>Total Transactions</h3>
            <p className="text-sm opacity-80">{metrics.totalTransactions.toLocaleString()}</p>
          </Card>

          <Card className="bg-gradient-to-br from-amber-600 to-amber-700 border-0 text-white p-6">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="h-8 w-8 opacity-80" />
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {metrics.avgSyncTime}s
              </Badge>
            </div>
            <h3>Pending Sync</h3>
            <p className="text-sm opacity-80">{metrics.pendingReconciliations} reconciliations</p>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 text-white p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-8 w-8 opacity-80" />
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                Healthy
              </Badge>
            </div>
            <h3>Network Health</h3>
            <p className="text-sm opacity-80">{metrics.networkHealth}%</p>
            <Progress value={metrics.networkHealth} className="mt-2 h-1 bg-white/20" />
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="gateways" className="w-full">
          <TabsList className="bg-white/10 mb-6">
            <TabsTrigger 
              value="gateways"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-900"
            >
              <Server className="h-4 w-4 mr-2" />
              Gateways
            </TabsTrigger>
            <TabsTrigger 
              value="conflicts"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-900"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Conflicts ({conflicts.filter(c => c.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger 
              value="reconciliation"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-900"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconciliation
            </TabsTrigger>
          </TabsList>

          {/* Gateways Tab */}
          <TabsContent value="gateways" className="space-y-4">
            {gateways.map(gateway => (
              <Card key={gateway.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      gateway.status === 'online' ? 'bg-green-600/20' :
                      gateway.status === 'offline' ? 'bg-red-600/20' :
                      'bg-yellow-600/20'
                    }`}>
                      {getStatusIcon(gateway.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white">{gateway.id}</h3>
                        <Badge variant="outline" className="bg-white/5 border-white/20">
                          {gateway.type}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{gateway.location}</p>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>Health: {gateway.health}%</span>
                        <span>•</span>
                        <span>{gateway.transactionsProcessed.toLocaleString()} tx</span>
                        <span>•</span>
                        <span>Last sync: {Math.floor((Date.now() - gateway.lastSync) / 60000)}m ago</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleReconcile(gateway.id)}
                    disabled={gateway.status === 'syncing'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {gateway.status === 'syncing' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reconcile
                      </>
                    )}
                  </Button>
                </div>
                <Progress value={gateway.health} className="h-2" />
              </Card>
            ))}
          </TabsContent>

          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="space-y-4">
            {conflicts.length === 0 ? (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-white mb-2">No Conflicts</h3>
                <p className="text-gray-400">All transactions are properly reconciled</p>
              </Card>
            ) : (
              conflicts.map(conflict => (
                <Card key={conflict.id} className={`border p-6 ${
                  conflict.status === 'pending' ? 'bg-red-900/10 border-red-600/30' :
                  conflict.status === 'escalated' ? 'bg-yellow-900/10 border-yellow-600/30' :
                  'bg-green-900/10 border-green-600/30'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`h-5 w-5 ${
                          conflict.status === 'pending' ? 'text-red-500' :
                          conflict.status === 'escalated' ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                        <h3 className="text-white">{conflict.id}</h3>
                        <Badge variant={
                          conflict.status === 'pending' ? 'destructive' :
                          conflict.status === 'escalated' ? 'default' :
                          'secondary'
                        }>
                          {conflict.status}
                        </Badge>
                      </div>
                      <p className="text-gray-300 mb-2">{conflict.description}</p>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>TX: {conflict.txId}</span>
                        <span>•</span>
                        <span>Devices: {conflict.deviceA} ↔ {conflict.deviceB}</span>
                        <span>•</span>
                        <span>{new Date(conflict.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {conflict.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleResolveConflict(conflict.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Auto-Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEscalateConflict(conflict.id)}
                          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        >
                          Escalate
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Reconciliation Tab */}
          <TabsContent value="reconciliation" className="space-y-4">
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-white mb-4">Merkle Tree Reconciliation</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Total Snapshots</p>
                    <p className="text-white">1,247</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Pending Merges</p>
                    <p className="text-white">{metrics.pendingReconciliations}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Success Rate</p>
                    <p className="text-white">98.7%</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Avg Merge Time</p>
                    <p className="text-white">{metrics.avgSyncTime}s</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white text-sm mb-2">Recent Reconciliations</h4>
                  <div className="space-y-2">
                    {[
                      { from: 'gw_rural_01', to: 'gw_urban_02', status: 'success', time: '2m ago' },
                      { from: 'gw_market_04', to: 'gw_remote_03', status: 'success', time: '5m ago' },
                      { from: 'gw_urban_02', to: 'gw_rural_01', status: 'success', time: '8m ago' }
                    ].map((rec, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{rec.from} ↔ {rec.to}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-0">
                            {rec.status}
                          </Badge>
                          <span className="text-gray-500">{rec.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Force Global Reconciliation
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}