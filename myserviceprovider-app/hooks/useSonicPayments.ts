import { useState } from 'react';
import { ethers } from 'ethers';

// Sonic Testnet Payment Contract Address 
const SONIC_CONTRACT_ADDRESS = '0x08388768EEd51B2693D30AC1071D4AB558220eDE';
const SONIC_ABI = [
  // Updated ABI for testnet payment contract
  'function payWithUSDC(string calldata prompt, string calldata generationType) external',
  'function payWithS(string calldata prompt, string calldata generationType) external',
  'function payWithSSStt(string calldata prompt, string calldata generationType) external',
  'function useCredits(string calldata prompt, string calldata generationType) external',
  'function getUserStats(address user) external view returns (uint256 generations, uint256 credits)'
];

export function useSonicPayment() {
  const [pending, setPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function payUSDC({ amount, onSuccess }: { amount: string, onSuccess?: (tx: string) => void }) {
    setPending(true);
    setError(null);
    setTxHash(null);
    try {
      // Prompt user to connect wallet
      //@ts-ignore
      if (!window.ethereum) throw new Error('Wallet not detected');
      //@ts-ignore
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Always use browser provider for signer, but with dRPC for network calls
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(SONIC_CONTRACT_ADDRESS, SONIC_ABI, signer);

      // Amount in USDC decimals (assume 6 decimals)
      const usdcAmount = ethers.parseUnits(amount, 6);
      const tx = await contract.payForGeneration(await signer.getAddress(), usdcAmount);
      await tx.wait();
      setTxHash(tx.hash);
      if (onSuccess) onSuccess(tx.hash);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  return {
    payUSDC,
    pending,
    txHash,
    error
  };
}
