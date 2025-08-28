'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Web3AuthProvider } from '@/components/Web3AuthProvider';
import { SonicThemeProvider } from '@/components/SonicThemeProvider';
import { MatrixBackground } from '@/components/MatrixBackground';
import { AuthenticatedServiceFlow } from '@/components/AuthenticatedServiceFlow';
import { Toaster } from '@/components/ui/toaster';

export function ServiceFlowComplete() {
  return (
    <UserProvider>
      <SonicThemeProvider>
        <Web3AuthProvider>
          <div className="relative min-h-screen">
            {/* Matrix background with Sonic styling */}
            <MatrixBackground
              density={1.0}
              speed={1.2}
              sonicMode={true}
              interactive={true}
            />
            
            {/* Main application */}
            <div className="relative z-10">
              <AuthenticatedServiceFlow />
            </div>
            
            {/* Toast notifications */}
            <Toaster />
          </div>
        </Web3AuthProvider>
      </SonicThemeProvider>
    </UserProvider>
  );
}