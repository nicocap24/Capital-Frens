"use client"

import { useState, useEffect } from "react"
import { Wallet, TrendingUp, Calculator, ArrowRight, AlertCircle, CheckCircle } from "lucide-react"

// Custom hooks
const useWallet = () => {
  const [walletState, setWalletState] = useState({
    connected: false,
    address: "",
    balance: 0,
    loading: false,
    error: "",
  })

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
  }

  return {
    ...walletState,
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

  const calculate = (currentBalance: number) => {
    const ANNUAL_RETURN = 0.1
    const PERIODS = [2, 5, 10]
    const WITHDRAWAL_RATE = 0.8

    const results = PERIODS.map((years) => {
      const futureValue = currentBalance * Math.pow(1 + ANNUAL_RETURN, years)
      const totalGains = futureValue - currentBalance
      const monthlyWithdrawal = futureValue / (years * 12 * WITHDRAWAL_RATE)
      const totalReturn = ((futureValue - currentBalance) / currentBalance) * 100

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

// Utility functions
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

// Header Component
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

interface LandingScreenProps {
  onAnswer: (answer: "yes" | "no") => void
}

// Landing Screen Component
const LandingScreen = ({ onAnswer }: LandingScreenProps) => {
  return (
    <>
      <Header onBackHome={() => onAnswer("yes")} />
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-6 pt-24">
        {/* Main Question */}
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

        {/* Answer Buttons */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Yes Button */}
          <button
            onClick={() => onAnswer("yes")}
            className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-8 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-green-500/25"
          >
            <div className="relative z-10">
              <div className="text-6xl mb-4">🏖️</div>
              <h3 className="text-2xl font-bold mb-2">YES</h3>
              <p className="text-green-100">I'm ready to check my retirement potential</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>

          {/* No Button */}
          <button
            onClick={() => onAnswer("no")}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white p-8 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/25"
          >
            <div className="relative z-10">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold mb-2">NO</h3>
              <p className="text-purple-100">I'm still grinding, show me something fun</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 text-4xl animate-bounce">💰</div>
        <div className="absolute top-32 right-32 text-3xl animate-pulse">🚀</div>
        <div className="absolute bottom-20 left-32 text-5xl animate-spin" style={{ animationDuration: "8s" }}>
          ⭐
        </div>
        <div className="absolute bottom-32 right-20 text-4xl animate-bounce" style={{ animationDelay: "1s" }}>
          🎯
        </div>
      </div>
    </>
  )
}

interface MemeScreenProps {
  onBack: () => void
}

interface Meme {
  text: string
  emoji: string
  subtext: string
}

// Meme Screen Component
const MemeScreen = ({ onBack }: MemeScreenProps) => {
  const memes: Meme[] = [
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

          {/* Floating meme elements */}
          <div className="absolute top-10 left-10 text-6xl animate-spin" style={{ animationDuration: "10s" }}>
            🚀
          </div>
          <div className="absolute top-20 right-20 text-5xl animate-bounce">💎</div>
          <div className="absolute bottom-10 left-20 text-4xl animate-pulse">🌙</div>
          <div className="absolute bottom-20 right-10 text-6xl animate-bounce" style={{ animationDelay: "0.5s" }}>
            🎪
          </div>
        </div>
      </div>
    </>
  )
}

interface WalletConnectionButtonProps {
  onConnect: () => void
  loading: boolean
  isMetaMaskInstalled: () => boolean
}

// Main components (wallet connection, etc.)
const WalletConnectionButton = ({ onConnect, loading, isMetaMaskInstalled }: WalletConnectionButtonProps) => (
  <div className="text-center">
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
      <Wallet className="w-12 h-12 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-blue-100">Connect to analyze your ETH balance on Base blockchain</p>
    </div>

    <button
      onClick={onConnect}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Connecting...
        </>
      ) : (
        <>
          <Wallet size={20} />
          Connect MetaMask
        </>
      )}
    </button>

    {!isMetaMaskInstalled() && (
      <p className="text-sm text-gray-500 mt-4">
        Don't have MetaMask?{" "}
        <a
          href="https://metamask.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Install it here
        </a>
      </p>
    )}
  </div>
)

interface ConnectedWalletInfoProps {
  address: string
  onDisconnect: () => void
  onBackToStart: () => void
}

const ConnectedWalletInfo = ({ address, onDisconnect, onBackToStart }: ConnectedWalletInfoProps) => (
  <div className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <div>
          <h3 className="font-semibold text-gray-900">Wallet Connected</h3>
          <p className="text-sm text-gray-600">{formatters.address(address)}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onBackToStart} className="text-sm text-blue-500 hover:text-blue-700 underline">
          Start Over
        </button>
        <button onClick={onDisconnect} className="text-sm text-gray-500 hover:text-gray-700 underline">
          Disconnect
        </button>
      </div>
    </div>
  </div>
)

interface ErrorAlertProps {
  error: string
}

const ErrorAlert = ({ error }: ErrorAlertProps) => (
  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
    <div className="flex items-center">
      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
      <p className="text-red-700">{error}</p>
    </div>
  </div>
)

interface BalanceDisplayProps {
  balance: number
}

const BalanceDisplay = ({ balance }: BalanceDisplayProps) => (
  <div className="mb-8">
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
  </div>
)

interface ProjectionCardProps {
  projection: Projection
  index: number
}

const ProjectionCard = ({ projection, index }: ProjectionCardProps) => {
  const colorClasses = ["bg-yellow-100 text-yellow-600", "bg-blue-100 text-blue-600", "bg-green-100 text-green-600"]

  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 p-6 hover:border-blue-300 transition-colors">
      <div className="text-center mb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${colorClasses[index]}`}>
          <Calculator className="w-6 h-6" />
        </div>
        <h4 className="text-xl font-bold text-gray-900">{projection.years} Years</h4>
      </div>

      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Future Value</p>
          <p className="text-lg font-bold text-gray-900">{formatters.eth(projection.futureValue)}</p>
          <p className="text-sm text-gray-500">
            ≈ {formatters.currency(projection.futureValue * constants.ETH_PRICE_USD)}
          </p>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Total Gains</span>
          <span className="font-semibold text-green-600">+{formatters.eth(projection.totalGains)}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Total Return</span>
          <span className="font-semibold text-green-600">+{projection.totalReturn.toFixed(1)}%</span>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-600">Monthly Income Potential</p>
          <p className="text-lg font-bold text-blue-700">{formatters.eth(projection.monthlyWithdrawal)}</p>
          <p className="text-xs text-blue-500">Conservative 4% withdrawal rate</p>
        </div>
      </div>
    </div>
  )
}

interface ProjectionsDisplayProps {
  projections: Projection[]
  onRecalculate: () => void
}

const ProjectionsDisplay = ({ projections, onRecalculate }: ProjectionsDisplayProps) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Pension Projections</h3>
      <p className="text-gray-600">Based on 10% annual returns with your current balance</p>
    </div>

    <div className="grid md:grid-cols-3 gap-6">
      {projections.map((projection, index) => (
        <ProjectionCard key={projection.years} projection={projection} index={index} />
      ))}
    </div>

    <div className="bg-yellow-50 rounded-xl p-6 mt-8">
      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Important Considerations
      </h4>
      <ul className="space-y-2 text-sm text-gray-700">
        <li>• These projections assume a consistent 10% annual return, which may vary significantly</li>
        <li>• Cryptocurrency investments are highly volatile and carry substantial risk</li>
        <li>• Consider diversifying your portfolio across different asset classes</li>
        <li>• Past performance doesn't guarantee future results</li>
        <li>• Consult with a financial advisor for personalized investment advice</li>
      </ul>
    </div>

    <div className="text-center">
      <button
        onClick={onRecalculate}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
      >
        <ArrowRight size={16} />
        Recalculate Projections
      </button>
    </div>
  </div>
)

// Main component
const PensionSimulator = () => {
  const [currentScreen, setCurrentScreen] = useState<"landing" | "meme" | "simulator">("landing")
  const wallet = useWallet()
  const { projections, calculate } = usePensionProjections()

  // Calculate projections when balance changes
  useEffect(() => {
    if (wallet.balance > 0) {
      calculate(wallet.balance)
    }
  }, [wallet.balance])

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

  const handleRecalculate = () => {
    if (wallet.balance > 0) {
      calculate(wallet.balance)
    }
  }

  // Render different screens based on current state
  if (currentScreen === "landing") {
    return <LandingScreen onAnswer={handleLandingAnswer} />
  }

  if (currentScreen === "meme") {
    return <MemeScreen onBack={handleBackToLanding} />
  }

  // Simulator screen
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

          {wallet.connected && <BalanceDisplay balance={wallet.balance} />}

          {projections && <ProjectionsDisplay projections={projections} onRecalculate={handleRecalculate} />}
        </div>
      </div>
    </>
  )
}

export default PensionSimulator
