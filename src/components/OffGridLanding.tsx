import React from 'react';
import { Smartphone, Shield, Wifi, Globe, Zap, Users, Radio, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface OffGridLandingProps {
  onLaunchWallet: () => void;
  onLaunchAdmin: () => void;
}

export function OffGridLanding({ onLaunchWallet, onLaunchAdmin }: OffGridLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 mb-6">
              <Wifi className="h-3 w-3 mr-2" />
              No Internet Required
            </Badge>
            <h1 className="text-white mb-6">
              Global Off-Grid Payment Protocol
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Send, receive, and earn value anywhere on Earth — even without internet or banks. 
              Using mesh networks, Bluetooth, NFC, LoRa gateways, and SMS.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={onLaunchWallet}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Smartphone className="h-5 w-5 mr-2" />
                Launch Wallet
              </Button>
              <Button
                onClick={onLaunchAdmin}
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Shield className="h-5 w-5 mr-2" />
                Admin Console
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-20">
            {[
              { label: 'Active Devices', value: '1,247', icon: Smartphone },
              { label: 'Transactions/Day', value: '45K+', icon: Zap },
              { label: 'Gateway Nodes', value: '89', icon: Radio },
              { label: 'Success Rate', value: '98.7%', icon: CheckCircle }
            ].map((stat, idx) => (
              <Card key={idx} className="bg-white/5 border-white/10 p-6 backdrop-blur-sm">
                <stat.icon className="h-8 w-8 text-purple-400 mb-3" />
                <div className="text-3xl text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-20">
            <h2 className="text-white text-center mb-12">Built for Real-World Use</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Smartphone,
                  title: 'Offline-First',
                  description: 'Every transaction works offline. Sync automatically when connection is available.',
                  color: 'from-purple-600 to-purple-700'
                },
                {
                  icon: Shield,
                  title: 'Cryptographically Secure',
                  description: 'Signed transactions, peer receipts, and Merkle tree reconciliation prevent fraud.',
                  color: 'from-blue-600 to-blue-700'
                },
                {
                  icon: Radio,
                  title: 'Multi-Transport',
                  description: 'BLE, NFC, LoRa gateways, and SMS. Use whatever works in your environment.',
                  color: 'from-emerald-600 to-emerald-700'
                },
                {
                  icon: Globe,
                  title: 'Mesh Network',
                  description: 'Create local payment networks without relying on centralized infrastructure.',
                  color: 'from-amber-600 to-amber-700'
                },
                {
                  icon: Users,
                  title: 'Social Recovery',
                  description: 'Recover your wallet through trusted community guardians. No seed phrases to lose.',
                  color: 'from-pink-600 to-pink-700'
                },
                {
                  icon: MessageSquare,
                  title: 'SMS Fallback',
                  description: 'Works on feature phones via signed SMS payloads. Financial inclusion for all.',
                  color: 'from-cyan-600 to-cyan-700'
                }
              ].map((feature, idx) => (
                <Card key={idx} className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-colors">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-20">
            <h2 className="text-white text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Create Transaction',
                  description: 'Sign a payment with your device key. Select transport: Bluetooth, NFC, LoRa, or SMS.'
                },
                {
                  step: '02',
                  title: 'Peer Exchange',
                  description: 'Receiver validates signature and returns a signed receipt. Both devices store the proof.'
                },
                {
                  step: '03',
                  title: 'Reconciliation',
                  description: 'When online, devices sync Merkle snapshots with gateways to detect conflicts and settle.'
                }
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-8 border border-white/10">
                    <div className="text-6xl text-white/10 mb-4">{step.step}</div>
                    <h3 className="text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-sm">{step.description}</p>
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Security & Anti-Fraud */}
          <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-600/30 p-8 mb-20">
            <div className="flex items-start gap-6">
              <Shield className="h-12 w-12 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-white mb-3">Anti-Fraud & Double-Spend Protection</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <CheckCircle className="h-4 w-4 text-green-400 inline mr-2" />
                    Cryptographic signatures on every transaction
                  </div>
                  <div>
                    <CheckCircle className="h-4 w-4 text-green-400 inline mr-2" />
                    Peer-to-peer receipt exchange before finalization
                  </div>
                  <div>
                    <CheckCircle className="h-4 w-4 text-green-400 inline mr-2" />
                    Merkle tree reconciliation detects conflicts
                  </div>
                  <div>
                    <CheckCircle className="h-4 w-4 text-green-400 inline mr-2" />
                    Rate limiting and reputation scoring
                  </div>
                  <div>
                    <CheckCircle className="h-4 w-4 text-green-400 inline mr-2" />
                    Timestamped nonces prevent replay attacks
                  </div>
                  <div>
                    <CheckCircle className="h-4 w-4 text-green-400 inline mr-2" />
                    Gateway settlement for final conflict resolution
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Use Cases */}
          <div className="mb-20">
            <h2 className="text-white text-center mb-12">Real-World Use Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Rural Communities',
                  description: 'Enable payments in areas with no internet or banking infrastructure. LoRa gateways provide long-range connectivity.',
                  emoji: '🏘️'
                },
                {
                  title: 'Disaster Relief',
                  description: 'Maintain payment systems when infrastructure is down. Mesh networks keep communities connected.',
                  emoji: '🚨'
                },
                {
                  title: 'Market Vendors',
                  description: 'Accept instant payments via NFC tap or QR code scan. No expensive POS terminals required.',
                  emoji: '🛒'
                },
                {
                  title: 'Micro-Task Payments',
                  description: 'Pay workers instantly for gig work or local services. Low fees make micropayments viable.',
                  emoji: '💼'
                }
              ].map((useCase, idx) => (
                <Card key={idx} className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-colors">
                  <div className="text-4xl mb-3">{useCase.emoji}</div>
                  <h3 className="text-white mb-2">{useCase.title}</h3>
                  <p className="text-gray-400 text-sm">{useCase.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Card className="bg-gradient-to-br from-purple-600 to-blue-600 border-0 p-12 inline-block">
              <h2 className="text-white mb-4">Ready to Go Off-Grid?</h2>
              <p className="text-purple-100 mb-8 max-w-2xl">
                Join the decentralized payment revolution. No internet required, no banks needed.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={onLaunchWallet}
                  size="lg"
                  className="bg-white text-purple-900 hover:bg-gray-100"
                >
                  <Smartphone className="h-5 w-5 mr-2" />
                  Launch Wallet
                </Button>
                <Button
                  onClick={onLaunchAdmin}
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/20"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Admin Console
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white mb-4">Protocol</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Offline SDK</div>
                <div>Gateway API</div>
                <div>Developer Docs</div>
                <div>Security Audit</div>
              </div>
            </div>
            <div>
              <h4 className="text-white mb-4">Transports</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Bluetooth LE</div>
                <div>NFC / Tap-to-Pay</div>
                <div>LoRa Gateways</div>
                <div>SMS Integration</div>
              </div>
            </div>
            <div>
              <h4 className="text-white mb-4">Community</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>GitHub</div>
                <div>Discord</div>
                <div>Documentation</div>
                <div>NGO Partners</div>
              </div>
            </div>
            <div>
              <h4 className="text-white mb-4">Resources</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Whitepaper</div>
                <div>Use Cases</div>
                <div>Gateway Setup</div>
                <div>Recovery Guide</div>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 pt-8 border-t border-white/10">
            <p>Off-Grid Payment Protocol © 2025 • Built for financial inclusion • Open Source</p>
          </div>
        </div>
      </div>
    </div>
  );
}