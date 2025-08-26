import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  TrendingUp as BuyIcon,
  TrendingDown as SellIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  getJupiterQuote,
  getJupiterSwap,
  getWalletTokens,
  getPopularTradeableTokens,
  SOLANA_TOKEN_ADDRESSES,
  formatTokenAmount,
  toRawAmount,
  JupiterQuoteResponse,
  WalletTokenInfo,
} from '../services/jupiterApi';

// Use WalletTokenInfo directly instead of extending it
type WalletToken = WalletTokenInfo;

interface TradingPanelProps {
  tokenContract: string;
  tokenSymbol?: string;
  tokenName?: string;
}

const TradingPanel: React.FC<TradingPanelProps> = ({ 
  tokenContract, 
  tokenSymbol = 'TOKEN',
  tokenName 
}) => {
  const { publicKey, connected } = useWallet();

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');
  const [paymentToken, setPaymentToken] = useState<string>(SOLANA_TOKEN_ADDRESSES.SOL);
  const [quote, setQuote] = useState<JupiterQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allTradeableTokens, setAllTradeableTokens] = useState<WalletToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  // Fetch tokens from Jupiter and wallet
  useEffect(() => {
    const loadTokens = async () => {
      if (!connected || !publicKey) {
        // Load popular tokens even when wallet not connected
        setTokensLoading(true);
        try {
          const popularTokens = await getPopularTradeableTokens();
          const tokensWithZeroBalance: WalletToken[] = popularTokens.map(token => ({
            ...token,
            balance: 0
          }));
          setAllTradeableTokens(tokensWithZeroBalance);
        } catch (error) {
          console.error('Failed to load popular tokens:', error);
          setError('Failed to load popular tokens');
        } finally {
          setTokensLoading(false);
        }
        return;
      }

      setTokensLoading(true);
      try {
        // Get wallet tokens with balances
        const userTokens = await getWalletTokens(publicKey.toBase58());

        // Also get popular tradeable tokens
        const popularTokens = await getPopularTradeableTokens();
        
        // Combine wallet tokens with popular tokens, avoiding duplicates
        const combinedTokens: WalletToken[] = [...userTokens];
        
        // Add popular tokens that user doesn't have
        for (const popularToken of popularTokens) {
          const existsInWallet = userTokens.some(userToken => userToken.address === popularToken.address);
          if (!existsInWallet) {
            combinedTokens.push({
              ...popularToken,
              balance: 0
            });
          }
        }

        // Sort by balance (descending), then by symbol
        combinedTokens.sort((a, b) => {
          if (a.balance !== b.balance) {
            return b.balance - a.balance;
          }
          return a.symbol.localeCompare(b.symbol);
        });

        setAllTradeableTokens(combinedTokens);
      } catch (error) {
        console.error('Error loading tokens:', error);
        setError('Failed to load tokens');
        // Fallback to just popular tokens
        try {
          const popularTokens = await getPopularTradeableTokens();
          const tokensWithZeroBalance: WalletToken[] = popularTokens.map(token => ({
            ...token,
            balance: 0
          }));
          setAllTradeableTokens(tokensWithZeroBalance);
        } catch (fallbackError) {
          console.error('Failed to load fallback tokens:', fallbackError);
        }
      } finally {
        setTokensLoading(false);
      }
    };

    loadTokens();
  }, [connected, publicKey]);

  // Get available tokens for display
  const availableTokens = React.useMemo(() => {
    return allTradeableTokens;
  }, [allTradeableTokens]);

  // Get quote when amount or trade type changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && connected) {
      getQuote();
    } else {
      setQuote(null);
    }
  }, [amount, tradeType, paymentToken, connected]);

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const amountRaw = toRawAmount(parseFloat(amount), 9); // Assuming 9 decimals for SOL
      
      const inputMint = tradeType === 'buy' ? paymentToken : tokenContract;
      const outputMint = tradeType === 'buy' ? tokenContract : paymentToken;

      const quoteResponse = await getJupiterQuote(
        inputMint,
        outputMint,
        amountRaw,
        100 // 1% slippage
      );

      if (quoteResponse) {
        setQuote(quoteResponse);
      } else {
        setError('Unable to get price quote. Please try again.');
      }
    } catch (err) {
      setError('Failed to get price quote');
      console.error('Quote error:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!quote || !publicKey) {
      setError('Missing requirements for swap');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get swap transaction
      const swapResponse = await getJupiterSwap(quote, publicKey.toBase58());

      if (!swapResponse) {
        throw new Error('Failed to get swap transaction');
      }

      // For now, just show success message
      // In a real implementation, you would:
      // 1. Deserialize the transaction
      // 2. Sign and send it
      // 3. Wait for confirmation
      
      setSuccess(`${tradeType === 'buy' ? 'Buy' : 'Sell'} order prepared! (Demo mode - transaction not executed)`);
      setAmount('');
      setQuote(null);
    } catch (err) {
      setError(`Failed to execute ${tradeType} order`);
      console.error('Swap error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getExpectedOutput = () => {
    if (!quote) return null;
    
    const outputAmount = formatTokenAmount(quote.outAmount, 6);
    const outputSymbol = tradeType === 'buy' ? tokenSymbol : availableTokens.find((t: WalletToken) => t.address === paymentToken)?.symbol || 'TOKEN';
    
    return `≈ ${outputAmount} ${outputSymbol}`;
  };

  const getPriceImpact = () => {
    if (!quote || !quote.priceImpactPct) return null;
    const impact = parseFloat(quote.priceImpactPct);
    // Determine color based on price impact
    let color: string;
    if (impact > 5) {
      color = '#f44336';
    } else if (impact > 1) {
      color = '#ff9800';
    } else {
      color = '#4caf50';
    }
    return (
      <Chip 
        label={`${impact.toFixed(2)}% impact`}
        size="small"
        sx={{ backgroundColor: color, color: 'white', fontSize: '0.75rem' }}
      />
    );
  };

  if (!connected) {
    return (
      <Box sx={{ 
        p: 2, 
        textAlign: 'center', 
        backgroundColor: '#f9f9f9', 
        borderRadius: 1,
        border: '1px solid #ddd'
      }}>
        <Typography variant="body2" color="textSecondary">
          Connect your wallet to trade {tokenSymbol}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 2, 
      backgroundColor: '#f9f9f9', 
      borderRadius: 1,
      border: '1px solid #ddd'
    }}>
      {/* Trade Type Selector */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant={tradeType === 'buy' ? 'contained' : 'outlined'}
          startIcon={<BuyIcon />}
          onClick={() => setTradeType('buy')}
          sx={{
            flex: 1,
            backgroundColor: tradeType === 'buy' ? '#4caf50' : 'transparent',
            borderColor: '#4caf50',
            color: tradeType === 'buy' ? 'white' : '#4caf50',
            '&:hover': {
              backgroundColor: tradeType === 'buy' ? '#45a049' : 'rgba(76, 175, 80, 0.1)',
            },
          }}
        >
          Buy {tokenSymbol}
        </Button>
        <Button
          variant={tradeType === 'sell' ? 'contained' : 'outlined'}
          startIcon={<SellIcon />}
          onClick={() => setTradeType('sell')}
          sx={{
            flex: 1,
            backgroundColor: tradeType === 'sell' ? '#f44336' : 'transparent',
            borderColor: '#f44336',
            color: tradeType === 'sell' ? 'white' : '#f44336',
            '&:hover': {
              backgroundColor: tradeType === 'sell' ? '#d32f2f' : 'rgba(244, 67, 54, 0.1)',
            },
          }}
        >
          Sell {tokenSymbol}
        </Button>
      </Box>

      {/* Input Section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            label={`Amount to ${tradeType}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputProps={{ min: 0, step: 0.000001 }}
            size="small"
            disabled={loading}
          />
        </Box>
        {tradeType === 'buy' && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.875rem', color: '#666' }}>
              Pay with
            </Typography>
            <Box 
              component="select"
              value={paymentToken}
              onChange={(e: any) => setPaymentToken(e.target.value)}
              disabled={loading || tokensLoading}
              sx={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                '&:focus': {
                  outline: 'none',
                  borderColor: '#1976d2',
                  boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                },
                '&:disabled': {
                  backgroundColor: '#f5f5f5',
                  cursor: 'not-allowed',
                },
              }}
            >
              {tokensLoading ? (
                <option disabled>Loading wallet tokens...</option>
              ) : (
                availableTokens.map((token: WalletToken) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} - {token.name}
                    {token.balance > 0 && ` (${token.balance.toFixed(4)})`}
                    {token.price && ` - $${token.price.toFixed(6)}`}
                  </option>
                ))
              )}
            </Box>
            
            {/* Token Info Display */}
            {paymentToken && availableTokens.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {(() => {
                  const selectedToken = availableTokens.find(t => t.address === paymentToken);
                  if (!selectedToken) return null;
                  
                  return (
                    <>
                      {selectedToken.logoURI && (
                        <Box
                          component="img"
                          src={selectedToken.logoURI}
                          alt={selectedToken.symbol}
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                          }}
                          onError={(e: any) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {selectedToken.symbol}
                        {selectedToken.balance > 0 && ` • Balance: ${selectedToken.balance.toFixed(4)}`}
                        {selectedToken.price && ` • $${selectedToken.price.toFixed(6)}`}
                        {selectedToken.priceChange24h && (
                          <span style={{ 
                            color: selectedToken.priceChange24h >= 0 ? '#4caf50' : '#f44336',
                            marginLeft: '4px'
                          }}>
                            {selectedToken.priceChange24h >= 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}%
                          </span>
                        )}
                      </Typography>
                    </>
                  );
                })()}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Quote Display */}
      {quote && (
        <Box sx={{ 
          p: 1.5, 
          backgroundColor: '#fff', 
          borderRadius: 1, 
          border: '1px solid #e0e0e0',
          mb: 2 
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              You will receive:
            </Typography>
            {getPriceImpact()}
          </Box>
          <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
            {getExpectedOutput()}
          </Typography>
        </Box>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, fontSize: '0.875rem' }}>
          {success}
        </Alert>
      )}

      {/* Execute Button */}
      {(() => {
        let buttonText: string;
        if (loading) {
          buttonText = 'Getting Quote...';
        } else {
          buttonText = `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${tokenSymbol}`;
        }
        return (
          <Button
            fullWidth
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SwapIcon />}
            onClick={executeSwap}
            disabled={!quote || loading || !amount || parseFloat(amount) <= 0}
            sx={{
              backgroundColor: tradeType === 'buy' ? '#2e7d32' : '#c62828',
              border: '2px solid #000',
              '&:hover': {
                backgroundColor: tradeType === 'buy' ? '#1b5e20' : '#b71c1c',
              },
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            {buttonText}
          </Button>
        );
      })()}

      {/* Disclaimer */}
      <Typography variant="caption" sx={{ 
        display: 'block', 
        textAlign: 'center', 
        mt: 1, 
        color: '#666',
        fontStyle: 'italic'
      }}>
        Powered by Jupiter • Demo mode active
      </Typography>
    </Box>
  );
};

export default TradingPanel;
