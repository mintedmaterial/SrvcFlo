'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import BackgroundPaths from '@/components/background-path';

// Dynamically import AgentChat to avoid SSR issues
const AgentChat = dynamic(() => import('@/components/agent-chat'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-white">Loading Agent Interface...</div>
    </div>
  ),
});

export default function HomePage() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return <AgentChat />;
  }

  return (
    <BackgroundPaths
      title="ServiceFlow AI"
      onEnter={() => setShowApp(true)}
    />
  );
}
