import React from 'react';
import { SimpleWallet } from './components/SimpleWallet';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <div className="dark">
      <SimpleWallet />
      <Toaster />
    </div>
  );
}