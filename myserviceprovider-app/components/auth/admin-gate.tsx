"use client";

import React from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { GelatoConnectButton } from "./gelato-connect-button";
import { Shield, Crown, Users, AlertCircle } from "lucide-react";

interface AdminGateProps {
  children: React.ReactNode;
  requiredLevel?: 'holder' | 'admin';
  fallback?: React.ReactNode;
  showTokenInfo?: boolean;
}

export function AdminGate({ 
  children, 
  requiredLevel = 'holder', 
  fallback,
  showTokenInfo = true 
}: AdminGateProps) {
  const { 
    user, 
    isLoading, 
    error, 
    isVerifying, 
    hasPermission, 
    refreshAdminStatus,
    isAdmin,
    adminTokenId,
    ownedTokens 
  } = useAdminAuth();

  if (isLoading || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-gray-600 dark:text-gray-400">
          {isVerifying ? "Verifying NFT ownership..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
          <Shield className="h-8 w-8" />
          <h2 className="text-2xl font-bold">Authentication Required</h2>
        </div>
        
        <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">
          Connect your wallet to access ServiceFlow AI agent tools. 
          {requiredLevel === 'admin' ? ' Admin access requires holding specific Bandit Kidz NFTs.' : ''}
        </p>
        
        <GelatoConnectButton variant="primary" size="lg">
          Connect Smart Wallet
        </GelatoConnectButton>
        
        {fallback && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {fallback}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-8 w-8" />
          <h2 className="text-xl font-bold">Verification Error</h2>
        </div>
        
        <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">
          {error}
        </p>
        
        <button 
          onClick={refreshAdminStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry Verification
        </button>
      </div>
    );
  }

  if (!hasPermission(requiredLevel)) {
    const AccessIcon = requiredLevel === 'admin' ? Crown : Users;
    
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex items-center space-x-3 text-yellow-600 dark:text-yellow-400">
          <AccessIcon className="h-8 w-8" />
          <h2 className="text-2xl font-bold">Access Restricted</h2>
        </div>
        
        <div className="text-center space-y-3">
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {requiredLevel === 'admin' 
              ? "This area requires admin access. You must hold a Bandit Kidz NFT with an admin token ID."
              : "This area requires Bandit Kidz NFT ownership."
            }
          </p>
          
          {showTokenInfo && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bandit Kidz Contract: <span className="font-mono">0x45bC8A938E487FdE4F31A7E051c2b63627F6f966</span>
              </p>
              {requiredLevel === 'admin' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Admin Token IDs: 143, 1, 2, 3, 4, 5 (and more)
                </p>
              )}
              {ownedTokens.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  You own tokens: {ownedTokens.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={refreshAdminStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Status
          </button>
          
          <a
            href="https://opensea.io/collection/banditkidz"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Get Bandit Kidz NFT
          </a>
        </div>
        
        {fallback && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg w-full max-w-md">
            {fallback}
          </div>
        )}
      </div>
    );
  }

  // User has required access
  return (
    <div>
      {/* Optional status indicator */}
      {showTokenInfo && (isAdmin || user.isHolder) && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            {isAdmin ? (
              <Crown className="h-4 w-4 text-yellow-600" />
            ) : (
              <Shield className="h-4 w-4 text-green-600" />
            )}
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              {isAdmin ? `Admin Access (Token ID: ${adminTokenId})` : 'Bandit Kidz Holder'}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400 font-mono">
              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
            </span>
          </div>
        </div>
      )}
      
      {/* Render children with access */}
      {children}
    </div>
  );
}

export default AdminGate;