"use client"

import { useState, useEffect } from "react"
import { Wallet, TrendingUp, Calculator, AlertCircle, CheckCircle } from "lucide-react"

// Custom hooks
const useWallet = () => {
  const [walletState, setWalletState] = useState({
    connected: false,
    address: "",
    balance: 0,
    loading: false,
    error: "",
  })

  // Add Clanker tokens state
  const [tokens, setTokens] = useState([])
  const [loadingTokens, setLoadingTokens] = useState(false)

  const isMetaMaskInstalled = () => {
    return typeof window !== "undefined" && window.ethereum
  }

  const updateError = (error: string) => {
    setWalletState((prev) => ({ ...prev, error, loading: false }))
  }

  const updateBalance = async (address: string) => {
    try {
      const balanceWei = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })

      const balanceEth = Number.parseInt(balanceWei, 16) / Math.pow(10, 18)
      setWalletState((prev) => ({ ...prev, balance: balanceEth }))
      return balanceEth
    } catch (err: any) {
      updateError(`Failed to get balance: ${err.message}`)
      return 0
    }
  }

  // Add Clanker token fetching
  const fetchClankerTokens = async (address: string) => {
    setLoadingTokens(true)
    try {
      // Mock Clanker tokens for demo (replace with real API)
      const mockClankerTokens = [
        { symbol: "PEPE", name: "Pepe Token", address: "0x123...", decimals: 18, price: 0.001 },
        { symbol: "DOGE", name: "Doge Coin", address: "0x456...", decimals: 18, price: 0.08 },
        { symbol: "SHIB", name: "Shiba Inu", address: "0x789...", decimals: 18, price: 0.00001 },
        { symbol: "WOJAK", name: "Wojak Token", address: "0xabc...", decimals: 18, price: 0.005 },
      ]

      // Simulate token balances (in real app, check actual balances)
      const tokenBalances = mockClankerTokens
        .map((token) => ({
          ...token,
          balance: Math.random() * 1000 + 100, // Random balance between 100-1100
          usdValue: Math.random() * 200 + 50, // Random USD value between $50-250
        }))
        .filter((token) => token.balance > 0)

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
        params: [{ chainId: "0x2105" }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x2105",
              chainName: "Base",
              nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://mainnet.base.org"],
              blockExplorerUrls: ["https://basescan.org"],
            },
          ],
        })
      }
    }
  }

  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      updateError("MetaMask is not installed. Please install MetaMask to continue.")
      return
    }

    setWalletState((prev) => ({ ...prev, loading: true, error: "" }))

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
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
    } catch (err: any) {
      updateError(`Failed to connect wallet: ${err.message}`)
    }
  }

  const disconnect = () => {
    setWalletState({
      connected: false,
      address: "",
      balance: 0,
      loading: false,
      error: "",
    })
    setTokens([])
  }

  return {
    ...walletState,
    tokens,
    loadingTokens,
    connect,
    disconnect,
    isMetaMaskInstalled,
  }
}

interface Projection {
  years: number
  futureValue: number
  totalGains: number
  monthlyWithdrawal: number
  totalReturn: number
}

const usePensionProjections = () => {
  const [projections, setProjections] = useState<Projection[] | null>(null)

  const calculate = (currentBalance: number, tokens: any[] = []) => {
    // Calculate total portfolio value including tokens
    const totalTokenValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0)
    const ethPrice = 2000 // Mock ETH price
    const totalPortfolioValue = currentBalance * ethPrice + totalTokenValue
    const totalPortfolioETH = totalPortfolioValue / ethPrice

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

  return { projections, calculate }
}

// Keep all original utility functions and constants
const formatters = {
  currency: (amount: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  },

  eth: (amount: number) => `${amount.toFixed(4)} ETH`,

  address: (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`,
}

const constants = {
  ETH_PRICE_USD: 2000,
}

// Keep all original components exactly as they were
const Header = ({ onBackHome }: { onBackHome: () => void }) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <button onClick={onBackHome} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">CF</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Capital Frens</span>
        </button>
      </div>
    </div>
  </header>
)

// Keep original LandingScreen
const LandingScreen = ({ onAnswer }: { onAnswer: (answer: "yes" | "no") => void }) => {
  return (
    <>
      <Header onBackHome={() => onAnswer("yes")} />
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-6 pt-24">
        <div className="max-w-4xl w-full text-center">
          <div className="mb-12">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
              Already want to
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                retire?
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12">
              Let's see where you stand on your journey to financial freedom
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <button
              onClick={() => onAnswer("yes")}
              className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-8 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-green-500/25"
            >
              <div className="relative z-10">
                <div className="text-6xl mb-4">🏖️</div>
                <h3 className="text-2xl font-bold mb-2">YES</h3>
                <p className="text-green-100">I'm ready to check my retirement potential</p>
              </div>
            </button>

            <button
              onClick={() => onAnswer("no")}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white p-8 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/25"
            >
              <div className="relative z-10">
                <div className="text-6xl mb-4">🎮</div>
                <h3 className="text-2xl font-bold mb-2">NO</h3>
                <p className="text-purple-100">I'm still grinding, show me something fun</p>
              </div>
            </button>
          </div>

          <div className="absolute top-20 left-20 text-4xl animate-bounce">💰</div>
          <div className="absolute top-32 right-32 text-3xl animate-pulse">🚀</div>
          <div className="absolute bottom-20 left-32 text-5xl animate-spin" style={{ animationDuration: "8s" }}>
            ⭐
          </div>
          <div className="absolute bottom-32 right-20 text-4xl animate-bounce" style={{ animationDelay: "1s" }}>
            🎯
          </div>
        </div>
      </div>
    </>
  )
}

// Keep original MemeScreen
const MemeScreen = ({ onBack }: { onBack: () => void }) => {
  const memes = [
    {
      text: "Me checking my crypto portfolio every 5 minutes",
      emoji: "📱",
      subtext: "It's still the same number, why did I check again?",
    },
    {
      text: "When someone asks about my retirement plan",
      emoji: "🤷‍♂️",
      subtext: "HODL until I'm old enough to forget my seed phrase",
    },
    {
      text: "My financial advisor vs My crypto portfolio",
      emoji: "📊",
      subtext: "One goes up in a straight line, the other is a rollercoaster 🎢",
    },
  ]

  const [currentMeme, setCurrentMeme] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMeme((prev) => (prev + 1) % memes.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Header onBackHome={onBack} />
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center p-6 pt-24">
        <div className="max-w-4xl w-full text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 shadow-2xl">
            <h1 className="text-5xl font-bold text-white mb-8">Fair enough! 😂</h1>

            <div className="bg-white/20 rounded-2xl p-8 mb-8">
              <div className="text-8xl mb-6">{memes[currentMeme].emoji}</div>
              <h2 className="text-2xl font-bold text-white mb-4">{memes[currentMeme].text}</h2>
              <p className="text-lg text-white/80">{memes[currentMeme].subtext}</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {memes.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentMeme ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={onBack}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20"
              >
                ← Back to Reality Check
              </button>
              <p className="text-white/60 text-sm">
                (When you're ready to actually plan for retirement, we'll be here! 🎯)
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Update BalanceDisplay to include Clanker tokens
const BalanceDisplay = ({
  balance,
  tokens = [],
  loadingTokens = false,
}: { balance: number; tokens?: any[]; loadingTokens?: boolean }) => (
  <div className="mb-8 space-y-4">
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

    {/* Clanker Tokens Section */}
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
                <p className="font-bold">{token.balance.toFixed(2)}</p>
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

interface WalletConnectionButtonProps {
  onConnect: () => void
  loading: boolean
  isMetaMaskInstalled: () => boolean
}

const WalletConnectionButton = ({ onConnect, loading, isMetaMaskInstalled }: WalletConnectionButtonProps) => {
  if (!isMetaMaskInstalled()) {
    return (
      <div className="text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-4" />
        <p className="text-gray-700 mb-2">MetaMask is not installed.</p>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Install MetaMask
        </a>
      </div>
    )
  }

  return (
    <button
      onClick={onConnect}
      className="group w-full relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-xl shadow-lg transition-all duration-300"
      disabled={loading}
    >
      <span className="relative z-10 flex items-center justify-center gap-3">
        <Wallet className="h-5 w-5" />
        {loading ? "Connecting..." : "Connect Wallet"}
      </span>
    </button>
  )
}

interface ConnectedWalletInfoProps {
  address: string
  onDisconnect: () => void
  onBackToStart: () => void
}

const ConnectedWalletInfo = ({ address, onDisconnect, onBackToStart }: ConnectedWalletInfoProps) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between bg-green-500/10 border border-green-500 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-6 w-6 text-green-500" />
        <div>
          <p className="text-sm text-gray-700">Connected with</p>
          <p className="font-semibold text-gray-900">{formatters.address(address)}</p>
        </div>
      </div>
      <button
        onClick={onDisconnect}
        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl transition-colors duration-300"
      >
        Disconnect
      </button>
    </div>

    <button
      onClick={onBackToStart}
      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition-colors duration-300"
    >
      ← Back to Start
    </button>
  </div>
)

interface ErrorAlertProps {
  error: string
}

const ErrorAlert = ({ error }: ErrorAlertProps) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <strong className="font-bold">Error:</strong>
    <span className="block sm:inline">{error}</span>
  </div>
)

interface ProjectionsDisplayProps {
  projections: Projection[] | null
  onRecalculate: () => void
}

const ProjectionsDisplay = ({ projections, onRecalculate }: ProjectionsDisplayProps) => {
  if (!projections) {
    return (
      <div className="text-center">
        <Calculator className="mx-auto h-10 w-10 text-gray-500 mb-4" />
        <p className="text-gray-600">Connect your wallet to see your pension projections.</p>
        <button
          onClick={onRecalculate}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
        >
          Recalculate
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <TrendingUp className="mx-auto h-10 w-10 text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900">Pension Projections</h2>
        <p className="text-gray-600">Based on 8% annual returns with your current balance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projections.map((result) => (
          <div key={result.years} className="bg-white shadow-md rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">{result.years} Year Projection</h3>
            <p>Future Value: {formatters.eth(result.futureValue)}</p>
            <p>Total Gains: {formatters.eth(result.totalGains)}</p>
            <p>Monthly Withdrawal: {formatters.eth(result.monthlyWithdrawal)}</p>
            <p>Total Return: {result.totalReturn.toFixed(2)}%</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onRecalculate}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Recalculate
        </button>
      </div>
    </div>
  )
}

// Keep all other original components (WalletConnectionButton, ConnectedWalletInfo, etc.)
// ... [rest of the original components remain exactly the same]

// Main component with original three-screen flow
const PensionSimulator = () => {
  const [currentScreen, setCurrentScreen] = useState<"landing" | "meme" | "simulator">("landing")
  const wallet = useWallet()
  const { projections, calculate } = usePensionProjections()

  useEffect(() => {
    if (wallet.balance > 0) {
      calculate(wallet.balance, wallet.tokens)
    }
  }, [wallet.balance, wallet.tokens])

  const handleLandingAnswer = (answer: "yes" | "no") => {
    if (answer === "yes") {
      setCurrentScreen("simulator")
    } else {
      setCurrentScreen("meme")
    }
  }

  const handleBackToLanding = () => {
    setCurrentScreen("landing")
    wallet.disconnect()
  }

  if (currentScreen === "landing") {
    return <LandingScreen onAnswer={handleLandingAnswer} />
  }

  if (currentScreen === "meme") {
    return <MemeScreen onBack={handleBackToLanding} />
  }

  // Simulator screen with all original components
  return (
    <>
      <Header onBackHome={handleBackToLanding} />
      <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-blue-100 min-h-screen pt-24">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Crypto Pension Simulator</h1>
            <p className="text-gray-600">
              Connect your wallet to analyze your Base blockchain balance and get pension projections
            </p>
          </div>

          <div className="mb-8">
            {!wallet.connected ? (
              <div>
                <WalletConnectionButton
                  onConnect={wallet.connect}
                  loading={wallet.loading}
                  isMetaMaskInstalled={wallet.isMetaMaskInstalled}
                />
                <div className="text-center mt-6">
                  <button onClick={handleBackToLanding} className="text-gray-500 hover:text-gray-700 underline text-sm">
                    ← Back to Home
                  </button>
                </div>
              </div>
            ) : (
              <ConnectedWalletInfo
                address={wallet.address}
                onDisconnect={wallet.disconnect}
                onBackToStart={handleBackToLanding}
              />
            )}
          </div>

          {wallet.error && <ErrorAlert error={wallet.error} />}

          {wallet.connected && (
            <BalanceDisplay balance={wallet.balance} tokens={wallet.tokens} loadingTokens={wallet.loadingTokens} />
          )}

          {projections && (
            <ProjectionsDisplay
              projections={projections}
              onRecalculate={() => calculate(wallet.balance, wallet.tokens)}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default PensionSimulator
