Read from Contract
The useReadContract Hook allows you to read data on a smart contract, from a view or pure (read-only) function. They can only read the state of the contract, and cannot make any changes to it. Since read-only methods do not change the state of the contract, they do not require any gas to be executed, and can be called by any user without the need to pay for gas.

The component below shows how to retrieve the token balance of an address from the Wagmi Example contract


read-contract.tsx

contracts.ts

import { useReadContract } from 'wagmi'
import { wagmiContractConfig } from './contracts'

function ReadContract() {
  const { data: balance } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'balanceOf',
    args: ['0x03A71968491d55603FFe1b11A9e23eF013f75bCF'],
  })

  return (
    <div>Balance: {balance?.toString()}</div>
  )
}
If useReadContract depends on another value (address in the example below), you can use the query.enabled option to prevent the query from running until the dependency is ready.


const { data: balance } = useReadContract({
  ...wagmiContractConfig,
  functionName: 'balanceOf',
  args: [address],
  query: {
    enabled: !!address,
  },
})
Loading & Error States
The useReadContract Hook also returns loading & error states, which can be used to display a loading indicator while the data is being fetched, or an error message if contract execution reverts.


read-contract.tsx

read-contract.tsx (refetch)

read-contract.tsx (invalidate)

import { type BaseError, useReadContract } from 'wagmi'

function ReadContract() {
  const { 
    data: balance,
    error,
    isPending
  } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'balanceOf',
    args: ['0x03A71968491d55603FFe1b11A9e23eF013f75bCF'],
  })

  if (isPending) return <div>Loading...</div>

  if (error)
    return (
      <div>
        Error: {(error as BaseError).shortMessage || error.message}
      </div>
    )

  return (
    <div>Balance: {balance?.toString()}</div>
  )
}
Refetching On Blocks
The useBlockNumber Hook can be utilized to refetch or invalidate the contract data on a specific block interval.


read-contract.tsx (refetch)

read-contract.tsx (invalidate)

import { useEffect } from 'react'
import { useBlockNumber, useReadContract } from 'wagmi'

function ReadContract() {
  const { data: balance, refetch } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'balanceOf',
    args: ['0x03A71968491d55603FFe1b11A9e23eF013f75bCF'],
  })
  const { data: blockNumber } = useBlockNumber({ watch: true })

  useEffect(() => {
    // want to refetch every `n` block instead? use the modulo operator!
    // if (blockNumber % 5 === 0) refetch() // refetch every 5 blocks
    refetch()
  }, [blockNumber])

  return (
    <div>Balance: {balance?.toString()}</div>
  )
}
Calling Multiple Functions
We can use the useReadContract Hook multiple times in a single component to call multiple functions on the same contract, but this ends up being hard to manage as the number of functions increases, especially when we also want to deal with loading & error states.

Luckily, to make this easier, we can use the useReadContracts Hook to call multiple functions in a single call.


read-contract.tsx

import { type BaseError, useReadContracts } from 'wagmi'

function ReadContract() {
  const { 
    data,
    error,
    isPending
  } = useReadContracts({ 
    contracts: [{ 
      ...wagmiContractConfig,
      functionName: 'balanceOf',
      args: ['0x03A71968491d55603FFe1b11A9e23eF013f75bCF'],
    }, { 
      ...wagmiContractConfig, 
      functionName: 'ownerOf', 
      args: [69n], 
    }, { 
      ...wagmiContractConfig, 
      functionName: 'totalSupply', 
    }] 
  }) 
  const [balance, ownerOf, totalSupply] = data || [] 

  if (isPending) return <div>Loading...</div>

  if (error)
    return (
      <div>
        Error: {(error as BaseError).shortMessage || error.message}
      </div>
    ) 

  return (
    <>
      <div>Balance: {balance?.toString()}</div>
      <div>Owner of Token 69: {ownerOf?.toString()}</div> 
      <div>Total Supply: {totalSupply?.toString()}</div> 
    </>
  )
}
