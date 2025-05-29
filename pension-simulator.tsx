"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"

const constants = {
  ETH_PRICE_USD: 3000, // Mock ETH price
}

const formatters = {
  currency: (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value),
  eth: (value) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value),
}

const useWallet = () => {
  const [walletState, setWalletState] = useState({
    connected: false,
    address: "",
    balance: 0,
    loading: false,
  })

  // Add new state for tokens
  const [tokens, setTokens] = useState([])
  const [loadingTokens, setLoadingTokens] = useState(false)

  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== "undefined"
  }

  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      alert("Please install MetaMask!")
      return
    }

    setWalletState((prev) => ({ ...prev, loading: true }))

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const accounts = await provider.listAccounts()

      if (accounts.length === 0) {
        setWalletState((prev) => ({ ...prev, loading: false }))
        return
      }

      // Add function to fetch Clanker tokens
      const fetchClankerTokens = async (address) => {
        setLoadingTokens(true)
        try {
          // Fetch popular Clanker tokens (you'd need the actual API endpoint)
          const response = await fetch("https://api.clanker.world/tokens")
          const clankerTokens = await response.json()

          // Check balances for each token
          const tokenBalances = []
          for (const token of clankerTokens.slice(0, 20)) {
            // Check top 20 tokens
            try {
              const balance = await window.ethereum.request({
                method: "eth_call",
                params: [
                  {
                    to: token.address,
                    data: `0x70a08231000000000000000000000000${address.slice(2)}`,
                  },
                  "latest",
                ],
              })

              const balanceNum = Number.parseInt(balance, 16) / Math.pow(10, token.decimals || 18)
              if (balanceNum > 0) {
                tokenBalances.push({
                  ...token,
                  balance: balanceNum,
                  usdValue: balanceNum * (token.price || 0),
                })
              }
            } catch (err) {
              console.log(`Failed to get balance for ${token.symbol}:`, err)
            }
          }

          setTokens(tokenBalances)
        } catch (err) {
          console.error("Failed to fetch Clanker tokens:", err)
        }
        setLoadingTokens(false)
      }

      const switchToBaseNetwork = async () => {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x2105" }], // Base chain ID
          })
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x2105",
                    chainName: "Base",
                    nativeCurrency: {
                      name: "ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://mainnet.base.org"],
                    blockExplorerUrls: ["https://basescan.org"],
                  },
                ],
              })
            } catch (addError) {
              console.error("Failed to add Base network:", addError)
            }
          } else {
            console.error("Failed to switch to Base network:", switchError)
          }
        }
      }

      const updateBalance = async (address) => {
        const balance = await provider.getBalance(address)
        return Number.parseFloat(ethers.utils.formatEther(balance))
      }

      const address = accounts[0]
      await switchToBaseNetwork()
      const balance = await updateBalance(address)

      // Fetch Clanker tokens
      await fetchClankerTokens(address)

      setWalletState((prev) => ({
        ...prev,
        connected: true,
        address,
        balance,
        loading: false,
      }))
    } catch (error) {
      console.error("Connection error:", error)
      setWalletState((prev) => ({ ...prev, loading: false }))
    }
  }

  const disconnect = () => {
    setWalletState({
      connected: false,
      address: "",
      balance: 0,
      loading: false,
    })
    setTokens([])
  }

  useEffect(() => {
    if (isMetaMaskInstalled()) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (walletState.connected && accounts.length === 0) {
          disconnect()
        } else if (accounts.length > 0) {
          connect()
        }
      })

      window.ethereum.on("chainChanged", (_chainId) => {
        connect()
      })
    }
  }, [walletState.connected])

  // Return tokens in the hook
  return {
    ...walletState,
    tokens,
    loadingTokens,
    connect,
    disconnect,
    isMetaMaskInstalled,
  }
}

const BalanceDisplay = ({ balance, tokens, loadingTokens }) => (
  <div className="mb-8 space-y-4">
    {/* ETH Balance */}
    <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Your Base Blockchain Balance</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-purple-100 text-sm">ETH Balance</p>
          <p className="text-2xl font-bold">{formatters.eth(balance)}</p>
        </div>
        <div>
          <p className="text-purple-100 text-sm">USD Value (Est.)</p>
          <p className="text-2xl font-bold">{formatters.currency(balance * constants.ETH_PRICE_USD)}</p>
        </div>
      </div>
    </div>

    {/* Clanker Tokens */}
    <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🎯 Clanker.world Tokens
        {loadingTokens && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
      </h3>

      {tokens.length > 0 ? (
        <div className="grid gap-3">
          {tokens.map((token, index) => (
            <div key={index} className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold">{token.symbol}</p>
                <p className="text-sm text-green-100">{token.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{token.balance.toFixed(4)}</p>
                <p className="text-sm text-green-100">${token.usdValue?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-green-100">
          {loadingTokens ? "Scanning for Clanker tokens..." : "No Clanker tokens found in your wallet"}
        </p>
      )}
    </div>
  </div>
)

const PensionSimulator = () => {
  const wallet = useWallet()
  const [deposit, setDeposit] = useState(1000)
  const [projections, setProjections] = useState([])

  const calculate = (currentBalance, tokens = []) => {
    const totalTokenValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0)
    const totalPortfolioValue = currentBalance * constants.ETH_PRICE_USD + totalTokenValue
    const totalPortfolioETH = totalPortfolioValue / constants.ETH_PRICE_USD

    // Use total portfolio value for calculations
    const ANNUAL_RETURN = 0.08
    const PERIODS = [2, 5, 10]
    const WITHDRAWAL_RATE = 0.8

    const results = PERIODS.map((years) => {
      const futureValue = totalPortfolioETH * Math.pow(1 + ANNUAL_RETURN, years)
      const totalGains = futureValue - totalPortfolioETH
      const monthlyWithdrawal = futureValue / (years * 12 * WITHDRAWAL_RATE)
      const totalReturn = ((futureValue - totalPortfolioETH) / totalPortfolioETH) * 100

      return {
        years,
        futureValue,
        totalGains,
        monthlyWithdrawal,
        totalReturn,
      }
    })

    setProjections(results)
  }

  useEffect(() => {
    if (wallet.connected) {
      calculate(wallet.balance, wallet.tokens)
    }
  }, [wallet.balance, wallet.connected, wallet.tokens])

  const handleDepositChange = (e) => {
    setDeposit(Number(e.target.value))
  }

  const handleSimulate = () => {
    calculate(wallet.balance, wallet.tokens)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Base Blockchain Pension Simulator</h1>

      {!wallet.connected ? (
        <div className="text-center">
          <p className="mb-4">Connect your wallet to get started.</p>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={wallet.connect}
            disabled={wallet.loading}
          >
            {wallet.loading ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <p>
              Wallet Address: {wallet.address}
              <button
                className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                onClick={wallet.disconnect}
              >
                Disconnect
              </button>
            </p>
          </div>

          {wallet.connected && (
            <BalanceDisplay balance={wallet.balance} tokens={wallet.tokens} loadingTokens={wallet.loadingTokens} />
          )}

          <div className="mb-8">
            <label htmlFor="deposit" className="block text-gray-700 text-sm font-bold mb-2">
              Initial Deposit (ETH):
            </label>
            <input
              type="number"
              id="deposit"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={deposit}
              onChange={handleDepositChange}
            />
          </div>

          <div className="mb-8">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleSimulate}
            >
              Simulate Pension
            </button>
          </div>

          {projections.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pension Projections</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projections.map((result) => (
                  <div key={result.years} className="bg-white shadow-md rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-2">{result.years} Year Projection</h3>
                    <p>Future Value: {formatters.eth(result.futureValue)} ETH</p>
                    <p>Total Gains: {formatters.eth(result.totalGains)} ETH</p>
                    <p>Monthly Withdrawal: {formatters.eth(result.monthlyWithdrawal)} ETH</p>
                    <p>Total Return: {result.totalReturn.toFixed(2)}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PensionSimulator
