"use client";

import React from "react";
import { GelatoDynamicWidget } from "@gelatonetwork/smartwallet-react-dynamic";
import { useGelatoAuth } from "../../hooks/useGelatoAuth";

interface GelatoConnectButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function GelatoConnectButton({ 
  variant = "primary", 
  size = "md", 
  className = "",
  children 
}: GelatoConnectButtonProps) {
  const { user, isLoading, login, logout } = useGelatoAuth();

  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
    outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
  };
  
  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-8 py-3 text-lg",
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (isLoading) {
    return (
      <button className={buttonClasses} disabled>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
          <span>Loading...</span>
        </div>
      </button>
    );
  }

  if (user?.isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="font-medium">{user.email || "Wallet User"}</div>
          <div className="text-xs font-mono">
            {user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : ""}
          </div>
        </div>
        <button onClick={logout} className={`${buttonClasses} bg-red-600 hover:bg-red-700`}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Use Dynamic's widget for authentication flow */}
      <GelatoDynamicWidget />
      
      {/* Fallback button if needed */}
      <button onClick={login} className={buttonClasses}>
        {children || "Connect Smart Wallet"}
      </button>
    </div>
  );
}

export default GelatoConnectButton;