import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  SwapVert as SwapIcon,
  Settings as SettingsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  getJupiterQuote,
  getWalletTokens,
  getPopularTradeableTokens,
  SOLANA_TOKEN_ADDRESSES,
  formatTokenAmount,
  toRawAmount,
  JupiterQuoteResponse,
  WalletTokenInfo,
} from '../services/jupiterApi';
import './JupiterStyleTradingPanel.css';

type WalletToken = WalletTokenInfo;

interface JupiterStyleTradingPanelProps {
  tokenContract: string;
  tokenSymbol?: string;
  tokenName?: string;
}

interface TokenSelectorProps {
  token: string;
  amount: string;
  onAmountChange: (value: string) => void;
  type: 'input' | 'output';
  balance?: number;
  getTokenInfo: (address: string) => WalletToken | undefined;
  quoteLoading: boolean;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ 
  token, 
  amount, 
  onAmountChange, 
  type, 
  balance, 
  getTokenInfo,
  quoteLoading 
}) => {
  const tokenInfo = getTokenInfo(token);
  const isOutput = type === 'output';

  return (
    <Box className="jupiter-token-selector">
      <Box className="jupiter-token-header">
        <Typography variant="body2" className="jupiter-token-label">
          {isOutput ? 'To' : 'From'}
        </Typography>
        {balance !== undefined && balance > 0 && (
          <Typography variant="caption" className="jupiter-balance">
            Balance: {balance.toFixed(4)}
          </Typography>
        )}
      </Box>
      <Box className="jupiter-token-input-row">
        <Box className="jupiter-token-info">
          {tokenInfo?.logoURI && (
            <Box
              component="img"
              src={tokenInfo.logoURI}
              alt={tokenInfo.symbol}
              className="jupiter-token-logo"
              onError={(e: any) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <Box className="jupiter-token-details">
            <Typography variant="body1" className="jupiter-token-symbol">
              {tokenInfo?.symbol || 'Unknown'}
            </Typography>
            <Typography variant="caption" className="jupiter-token-name">
              {tokenInfo?.name || ''}
            </Typography>
          </Box>
          <ArrowDownIcon className="jupiter-dropdown-icon" />
        </Box>
        <Box className="jupiter-amount-input">
          <input
            type="text"
            placeholder="0"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            disabled={isOutput || quoteLoading}
            className="jupiter-amount-field"
          />
          {tokenInfo?.price && (
            <Typography variant="caption" className="jupiter-usd-value">
              ≈ ${(parseFloat(amount || '0') * tokenInfo.price).toFixed(2)}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const JupiterStyleTradingPanel: React.FC<JupiterStyleTradingPanelProps> = ({ 
  tokenContract, 
  tokenSymbol = 'TOKEN',
  tokenName 
}) => {
  const { publicKey, connected } = useWallet();

  // Core trading state
  const [inputAmount, setInputAmount] = useState<string>('');
  const [outputAmount, setOutputAmount] = useState<string>('');
  const [inputToken, setInputToken] = useState<string>(SOLANA_TOKEN_ADDRESSES.SOL);
  const [outputToken, setOutputToken] = useState<string>(tokenContract);
  const [quote, setQuote] = useState<JupiterQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allTokens, setAllTokens] = useState<WalletToken[]>([]);

  // UI state
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-refresh quotes
  const [lastQuoteTime, setLastQuoteTime] = useState<number>(0);
  const QUOTE_REFRESH_INTERVAL = 20000; // 20 seconds

  // Load available tokens
  useEffect(() => {
    const loadTokens = async () => {
      try {
        let tokens: WalletToken[] = [];
        
        if (connected && publicKey) {
          // Get wallet tokens with balances
          const userTokens = await getWalletTokens(publicKey.toBase58());
          tokens = [...userTokens];
        }

        // Also get popular tradeable tokens
        const popularTokens = await getPopularTradeableTokens();
        
        // Add popular tokens that user doesn't have
        for (const popularToken of popularTokens) {
          const existsInWallet = tokens.some(userToken => userToken.address === popularToken.address);
          if (!existsInWallet) {
            tokens.push({
              ...popularToken,
              balance: 0
            });
          }
        }

        // Ensure our target token is included
        const targetTokenExists = tokens.some(token => token.address === tokenContract);
        if (!targetTokenExists) {
          tokens.push({
            address: tokenContract,
            symbol: tokenSymbol,
            name: tokenName || tokenSymbol,
            decimals: 6, // Default
            balance: 0,
            logoURI: '',
            price: 0,
            priceChange24h: 0
          });
        }

        // Sort by balance (descending), then by symbol
        tokens.sort((a, b) => {
          if (a.balance !== b.balance) {
            return b.balance - a.balance;
          }
          return a.symbol.localeCompare(b.symbol);
        });

        setAllTokens(tokens);
      } catch (error) {
        console.error('Error loading tokens:', error);
        setError('Failed to load tokens');
      }
    };

    loadTokens();
  }, [connected, publicKey, tokenContract, tokenSymbol, tokenName]);

  // Get quote when inputs change
  useEffect(() => {
    const getQuote = async () => {
      if (!inputAmount || !inputToken || !outputToken || parseFloat(inputAmount) <= 0) {
        setQuote(null);
        setOutputAmount('');
        return;
      }

      setQuoteLoading(true);
      setError(null);

      try {
        const inputTokenInfo = allTokens.find(t => t.address === inputToken);
        if (!inputTokenInfo) return;

        const amount = toRawAmount(parseFloat(inputAmount), inputTokenInfo.decimals);
        const quoteResponse = await getJupiterQuote(inputToken, outputToken, amount);
        
        if (quoteResponse) {
          setQuote(quoteResponse);
          const outputTokenInfo = allTokens.find(t => t.address === outputToken);
          if (outputTokenInfo) {
            const formattedOutput = formatTokenAmount(quoteResponse.outAmount, outputTokenInfo.decimals);
            setOutputAmount(formattedOutput);
          }
          setLastQuoteTime(Date.now());
        }
      } catch (err) {
        console.error('Quote error:', err);
        setError('Failed to get quote');
        setQuote(null);
        setOutputAmount('');
      } finally {
        setQuoteLoading(false);
      }
    };

    const debounceTimer = setTimeout(getQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [inputAmount, inputToken, outputToken, allTokens]);

  // Auto-refresh quotes
  useEffect(() => {
    if (!quote || !inputAmount) return;

    const interval = setInterval(() => {
      const timeSinceLastQuote = Date.now() - lastQuoteTime;
      if (timeSinceLastQuote >= QUOTE_REFRESH_INTERVAL) {
        // Trigger quote refresh by updating a dependency
        setLastQuoteTime(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quote, inputAmount, lastQuoteTime]);

  const swapTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount(outputAmount);
    setOutputAmount('');
    setQuote(null);
  };

  const getTokenInfo = (address: string): WalletToken | undefined => {
    return allTokens.find(t => t.address === address);
  };

  const executeSwap = async () => {
    if (!quote || !connected || !publicKey) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Executing swap (Demo mode):', {
        input: inputAmount,
        inputToken: getTokenInfo(inputToken)?.symbol,
        output: outputAmount,
        outputToken: getTokenInfo(outputToken)?.symbol
      });

      // Demo mode - just show success
      setSuccess(`Swap executed successfully! (Demo mode)`);
      setInputAmount('');
      setOutputAmount('');
      setQuote(null);
    } catch (err) {
      console.error('Swap error:', err);
      setError('Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  const getPriceImpact = (): { value: number; color: string } | null => {
    if (!quote || !quote.priceImpactPct) return null;
    const impact = parseFloat(quote.priceImpactPct);
    let color: string;
    if (impact > 5) {
      color = '#f44336';
    } else if (impact > 1) {
      color = '#ff9800';
    } else {
      color = '#4caf50';
    }
    return { value: impact, color };
  };

  const getSwapButtonText = (): string => {
    if (loading) {
      return 'Swapping...';
    }
    if (quoteLoading) {
      return 'Getting best price...';
    }
    if (!quote) {
      return 'Enter an amount';
    }
    return `Swap ${getTokenInfo(inputToken)?.symbol} for ${getTokenInfo(outputToken)?.symbol}`;
  };

  if (!connected) {
    return (
      <Box className="jupiter-container">
        <Box className="jupiter-header">
          <Typography variant="h6" className="jupiter-title">
            Swap
          </Typography>
        </Box>
        <Box className="jupiter-connect-prompt">
          <Typography variant="body2" color="textSecondary">
            Connect your wallet to trade {tokenSymbol}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="jupiter-container">
      {/* Header */}
      <Box className="jupiter-header">
        <Typography variant="h6" className="jupiter-title">
          Swap
        </Typography>
        <Box className="jupiter-header-actions">
          <IconButton 
            size="small" 
            onClick={() => setShowSettings(!showSettings)}
            className="jupiter-settings-btn"
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => setLastQuoteTime(0)}
            className="jupiter-refresh-btn"
            disabled={quoteLoading}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Settings Panel */}
      {showSettings && (
        <Box className="jupiter-settings">
          <Typography variant="body2" className="jupiter-settings-label">
            Slippage tolerance
          </Typography>
          <Box className="jupiter-slippage-options">
            {[0.1, 0.5, 1.0].map(value => (
              <Button
                key={value}
                size="small"
                variant={slippage === value ? 'contained' : 'outlined'}
                onClick={() => setSlippage(value)}
                className="jupiter-slippage-btn"
              >
                {value}%
              </Button>
            ))}
          </Box>
        </Box>
      )}

      {/* Swap Interface */}
      <Box className="jupiter-swap-container">
        {/* Input Token */}
        <TokenSelector
          token={inputToken}
          amount={inputAmount}
          onAmountChange={setInputAmount}
          type="input"
          balance={getTokenInfo(inputToken)?.balance}
          getTokenInfo={getTokenInfo}
          quoteLoading={quoteLoading}
        />

        {/* Swap Button */}
        <Box className="jupiter-swap-divider">
          <IconButton 
            onClick={swapTokens}
            className="jupiter-swap-icon"
            size="small"
          >
            <SwapIcon />
          </IconButton>
        </Box>

        {/* Output Token */}
        <TokenSelector
          token={outputToken}
          amount={outputAmount}
          onAmountChange={() => {}} // Read-only for output
          type="output"
          getTokenInfo={getTokenInfo}
          quoteLoading={quoteLoading}
        />
      </Box>

      {/* Quote Information */}
      {quote && (
        <Box className="jupiter-quote-info">
          <Box className="jupiter-quote-row">
            <Typography variant="body2">Rate</Typography>
            <Typography variant="body2">
              1 {getTokenInfo(inputToken)?.symbol} ≈ {
                quote.outAmount && quote.inAmount 
                ? (parseInt(quote.outAmount) / parseInt(quote.inAmount)).toFixed(6)
                : '...'
              } {getTokenInfo(outputToken)?.symbol}
            </Typography>
          </Box>
          {getPriceImpact() && (
            <Box className="jupiter-quote-row">
              <Typography variant="body2">Price Impact</Typography>
              <Chip 
                label={`${getPriceImpact()?.value.toFixed(2)}%`}
                size="small"
                sx={{ 
                  backgroundColor: getPriceImpact()?.color, 
                  color: 'white', 
                  fontSize: '0.75rem' 
                }}
              />
            </Box>
          )}
          <Box className="jupiter-quote-row">
            <Typography variant="body2">Network Fee</Typography>
            <Typography variant="body2">~0.000005 SOL</Typography>
          </Box>
        </Box>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" className="jupiter-alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" className="jupiter-alert">
          {success}
        </Alert>
      )}

      {/* Execute Button */}
      <Button
        fullWidth
        variant="contained"
        onClick={executeSwap}
        disabled={!quote || loading || !inputAmount || parseFloat(inputAmount) <= 0}
        className="jupiter-swap-button"
        size="large"
      >
        {loading && <CircularProgress size={20} color="inherit" />}
        {getSwapButtonText()}
      </Button>

      {/* Footer */}
      <Typography variant="caption" className="jupiter-footer">
        Powered by Jupiter • Best price guaranteed
      </Typography>
    </Box>
  );
};

export default JupiterStyleTradingPanel;
