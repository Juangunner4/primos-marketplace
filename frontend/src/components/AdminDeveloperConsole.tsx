import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Box, 
  Typography, 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton,
  Collapse
} from '@mui/material';
import { 
  BugReport as BugReportIcon, 
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  Settings as SettingsIcon,
  Language as LanguageIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const ADMIN_WALLET = process.env.REACT_APP_ADMIN_WALLET ?? 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';

interface DebugInfo {
  apiCallAttempted: boolean;
  apiCallSuccess: boolean;
  apiCallError: string | null;
  contractsLoaded: number;
  usersLoaded: number;
  renderAttempted: boolean;
  lastError: Error | null;
  networkErrors: { url: string; status?: number; message: string }[];
  apiEndpoints?: string[];
  responseData?: Record<string, any>;
  performanceMetrics?: Record<string, number>;
  consoleLogs?: { timestamp: string; level: string; message: string; args?: any[] }[];
}

interface AdminDeveloperConsoleProps {
  debugInfo: DebugInfo;
  componentName: string;
  additionalData?: Record<string, any>;
}

const AdminDeveloperConsole: React.FC<AdminDeveloperConsoleProps> = ({
  debugInfo,
  componentName,
  additionalData = {}
}) => {
  const { publicKey, connected } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{ timestamp: string; level: string; message: string; args?: any[] }[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    wallet: true,
    api: true,
    component: true,
    environment: true,
    errors: true,
    consoleLogs: true,
    heliusDebug: true,
    marketDebug: true,
    contractPanelDebug: true
  });

  // Console log capture system
  React.useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    const captureConsole = (level: string, originalMethod: any) => {
      return (...args: any[]) => {
        // Call original method first
        originalMethod.apply(console, args);
        
        // Capture the log for admin console
        const timestamp = new Date().toISOString();
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        setConsoleLogs(prev => [
          ...prev.slice(-49), // Keep last 50 logs
          { timestamp, level, message, args }
        ]);
      };
    };

    // Override console methods
    console.log = captureConsole('log', originalConsole.log);
    console.warn = captureConsole('warn', originalConsole.warn);
    console.error = captureConsole('error', originalConsole.error);
    console.info = captureConsole('info', originalConsole.info);

    // Cleanup function to restore original console
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, []);

  // Only show to admin wallet
  const isAdmin = publicKey && publicKey.toBase58() === ADMIN_WALLET;
  
  if (!isAdmin) {
    return null;
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const DebugSection: React.FC<{ 
    title: string; 
    sectionKey: string; 
    children: React.ReactNode;
    icon?: React.ReactNode;
  }> = ({ title, sectionKey, children, icon }) => (
    <Box sx={{ mb: { xs: 1, sm: 2 } }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          p: { xs: 0.5, sm: 1 },
          backgroundColor: '#ffffff',
          borderRadius: 1,
          border: '1px solid #000000'
        }}
        onClick={() => toggleSection(sectionKey)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flex: 1 }}>
          {icon}
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 'bold', 
            color: '#000000',
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}>
            {title}
          </Typography>
        </Box>
        {expandedSections[sectionKey] ? 
          <ExpandLessIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} /> : 
          <ExpandMoreIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        }
      </Box>
      <Collapse in={expandedSections[sectionKey]}>
        <Box sx={{ 
          p: { xs: 0.5, sm: 1 }, 
          backgroundColor: '#ffffff', 
          border: '1px solid #000000', 
          borderTop: 'none' 
        }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );

  return (
    <>
      {/* Floating Debug Button */}
      <Fab
        color="secondary"
        aria-label="admin console"
        sx={{
          position: 'fixed',
          top: { xs: 70, sm: 80 },
          left: { xs: 15, sm: 20 },
          zIndex: 9999,
          backgroundColor: '#000000',
          color: 'white',
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          '&:hover': {
            backgroundColor: '#333333'
          }
        }}
        onClick={() => setIsOpen(true)}
      >
        <BugReportIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
      </Fab>

      {/* Debug Console Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="lg"
        fullWidth
        aria-labelledby="admin-console-title"
        aria-describedby="admin-console-description"
        slotProps={{
          paper: {
            sx: {
              position: 'fixed',
              top: { xs: 120, sm: 140 },
              left: { xs: 10, sm: 20 },
              bottom: 'auto',
              right: 'auto',
              margin: 0,
              maxWidth: { xs: 'calc(100vw - 20px)', sm: '600px' },
              maxHeight: { xs: '70vh', sm: '75vh' },
              width: { xs: 'calc(100vw - 20px)', sm: '600px' },
              zIndex: 9998
            }
          }
        }}
        sx={{ zIndex: 9998 }}
      >
        <DialogTitle 
          id="admin-console-title"
          sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#000000',
          color: 'white',
          py: { xs: 0.5, sm: 1 },
          px: { xs: 1, sm: 2 }
        }}>
          <Typography variant="h6" component="div" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            <BugReportIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Admin Dev Console - {componentName}</Box>
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Admin Console</Box>
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsOpen(false)}
            sx={{ 
              color: 'white',
              p: { xs: 0.5, sm: 1 }
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
          </IconButton>
        </DialogTitle>
        
        {/* Hidden description for accessibility */}
        <div id="admin-console-description" style={{ display: 'none' }}>
          Admin Developer Console for debugging application state, API calls, and performance metrics
        </div>
        
        <DialogContent sx={{ 
          p: { xs: 1, sm: 2 }, 
          fontSize: { xs: '0.75rem', sm: '0.85rem' }
        }}>
          <DebugSection title="Wallet & Auth Status" sectionKey="wallet" icon={<SecurityIcon sx={{ color: '#000000' }} />}>
            <Typography variant="body2" sx={{ 
              fontFamily: 'monospace', 
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              lineHeight: { xs: 1.3, sm: 1.4 }
            }}>
              Connected: {connected ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
              Public Key: {publicKey ? `${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}` : <><CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} /> None</>}<br/>
              Is Admin: {isAdmin ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
              Timestamp: {new Date().toISOString()}
            </Typography>
          </DebugSection>

          <DebugSection title="API & Data Status" sectionKey="api" icon={<ApiIcon sx={{ color: '#000000' }} />}>
            <Typography variant="body2" sx={{ 
              fontFamily: 'monospace', 
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              lineHeight: { xs: 1.3, sm: 1.4 }
            }}>
              API Attempted: {debugInfo.apiCallAttempted ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
              API Success: {debugInfo.apiCallSuccess ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
              Contracts Loaded: {debugInfo.contractsLoaded}<br/>
              Users Loaded: {debugInfo.usersLoaded}<br/>
              {debugInfo.apiEndpoints && (
                <>API Endpoints: {debugInfo.apiEndpoints.join(', ')}<br/></>
              )}
              {debugInfo.performanceMetrics && Object.keys(debugInfo.performanceMetrics).length > 0 && (
                <>Performance: {Object.entries(debugInfo.performanceMetrics).map(([key, value]) => `${key}: ${value}ms`).join(', ')}<br/></>
              )}
              {additionalData.dataContracts !== undefined && (
                <>Current Contracts: {additionalData.dataContracts}<br/></>
              )}
              {additionalData.dataUsers !== undefined && (
                <>Current Users: {additionalData.dataUsers}<br/></>
              )}
            </Typography>
          </DebugSection>

          <DebugSection title="Component State" sectionKey="component" icon={<SettingsIcon sx={{ color: '#000000' }} />}>
            <Typography variant="body2" sx={{ 
              fontFamily: 'monospace', 
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              lineHeight: { xs: 1.3, sm: 1.4 }
            }}>
              Render Attempted: {debugInfo.renderAttempted ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
              {additionalData.loading !== undefined && (
                <>Loading: {additionalData.loading ? <RefreshIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'orange', verticalAlign: 'middle' }} /> : <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} />}<br/></>
              )}
              {additionalData.adding !== undefined && (
                <>Adding: {additionalData.adding ? <RefreshIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'orange', verticalAlign: 'middle' }} /> : <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} />}<br/></>
              )}
              {additionalData.isHolder !== undefined && (
                <>Is Holder: {additionalData.isHolder ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/></>
              )}
              {additionalData.canSubmit !== undefined && (
                <>Can Submit: {additionalData.canSubmit ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/></>
              )}
              {additionalData.connectionPresent !== undefined && (
                <>Connection: {additionalData.connectionPresent ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/></>
              )}
            </Typography>
          </DebugSection>

          <DebugSection title="Environment" sectionKey="environment" icon={<LanguageIcon sx={{ color: '#000000' }} />}>
            <Typography variant="body2" sx={{ 
              fontFamily: 'monospace', 
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              lineHeight: { xs: 1.3, sm: 1.4 }
            }}>
              Node Env: {process.env.NODE_ENV}<br/>
              Backend URL: {process.env.REACT_APP_BACKEND_URL || <><CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} /> Missing</>}<br/>
              {additionalData.environmentVars?.primoCollection !== undefined && (
                <>Primo Collection: {additionalData.environmentVars.primoCollection ? <><CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> Set</> : <><CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} /> Missing</>}<br/></>
              )}
              Helius Key: {process.env.REACT_APP_HELIUS_API_KEY ? <><CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> Set</> : <><CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} /> Missing</>}<br/>
              Admin Wallet: {ADMIN_WALLET ? <><CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> Set</> : <><CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} /> Missing</>}
            </Typography>
          </DebugSection>

          {(debugInfo.apiCallError || debugInfo.lastError || debugInfo.networkErrors.length > 0) && (
            <DebugSection title="Error Details" sectionKey="errors" icon={<ErrorIcon sx={{ color: '#000000' }} />}> 
              {debugInfo.apiCallError && (
                <Box sx={{ mb: 2, p: 1, backgroundColor: '#f8d7da', borderRadius: 1, border: '1px solid #f5c6cb' }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 'bold', 
                    color: '#721c24', 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5 
                  }}>
                    <CancelIcon sx={{ fontSize: { xs: 14, sm: 16 } }} /> API Error:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: { xs: '0.65rem', sm: '0.75rem' }, 
                    color: '#721c24' 
                  }}>
                    {debugInfo.apiCallError}
                  </Typography>
                </Box>
              )}

              {debugInfo.lastError && (
                <Box sx={{ p: 1, backgroundColor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 'bold', 
                    color: '#856404', 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5 
                  }}>
                    <WarningIcon sx={{ fontSize: { xs: 14, sm: 16 } }} /> Last Error:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: { xs: '0.65rem', sm: '0.75rem' }, 
                    color: '#856404' 
                  }}>
                    {debugInfo.lastError.message}<br/>
                    {debugInfo.lastError.stack?.split('\n').slice(0, 3).join('\n')}
                  </Typography>
                </Box>
              )}

              {debugInfo.networkErrors.length > 0 && (
                <Box sx={{ mt: 2, p: 1, backgroundColor: '#e2e3e5', borderRadius: 1, border: '1px solid #d6d8db' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 'bold',
                      color: '#383d41',
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    Network Errors ({debugInfo.networkErrors.length}):
                  </Typography>
                  {debugInfo.networkErrors.map((e, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        color: '#383d41'
                      }}
                    >
                      {e.status ? `${e.status}` : 'No Status'} - {e.url}: {e.message}
                    </Typography>
                  ))}
                </Box>
              )}
            </DebugSection>
          )}

          {/* Console Logs Section */}
          <DebugSection title={`Console Logs (${consoleLogs.length}/50)`} sectionKey="consoleLogs" icon={<SpeedIcon sx={{ color: '#000000' }} />}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                Live console output (last 20 shown)
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setConsoleLogs([])}
                sx={{ p: 0.5 }}
                title="Clear logs"
              >
                <CloseIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Box>
            <Box sx={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
              {consoleLogs.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                  No console logs captured yet
                </Typography>
              ) : (
                consoleLogs.slice(-20).reverse().map((log, idx) => {
                  const getLogBackgroundColor = (level: string) => {
                    if (level === 'error') return '#ffebee';
                    if (level === 'warn') return '#fff3e0';
                    return '#f5f5f5';
                  };

                  const getLogBorderColor = (level: string) => {
                    if (level === 'error') return '#f44336';
                    if (level === 'warn') return '#ff9800';
                    return '#2196f3';
                  };

                  return (
                    <Box 
                      key={`log-${log.timestamp}-${idx}`} 
                      sx={{ 
                        mb: 1, 
                        p: 0.5, 
                        backgroundColor: getLogBackgroundColor(log.level),
                        borderRadius: 0.5,
                        borderLeft: `3px solid ${getLogBorderColor(log.level)}`
                      }}
                    >
                      <Typography variant="caption" sx={{ 
                        fontSize: { xs: '0.6rem', sm: '0.7rem' }, 
                        color: '#666',
                        display: 'block'
                      }}>
                        {new Date(log.timestamp).toLocaleTimeString()} - {log.level.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace', 
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '100px',
                        overflowY: 'auto'
                      }}>
                        {log.message}
                      </Typography>
                    </Box>
                  );
                })
              )}
              {consoleLogs.length > 0 && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                    Showing last 20 of {consoleLogs.length} logs (max 50 stored)
                  </Typography>
                </Box>
              )}
            </Box>
          </DebugSection>

          {/* Helius Debug Data for NFT Gallery */}
          {additionalData.heliusDebugData && (
            <DebugSection title="Helius API Debug" sectionKey="heliusDebug" icon={<StorageIcon sx={{ color: '#000000' }} />}>
              <Typography variant="body2" sx={{ 
                fontFamily: 'monospace', 
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                lineHeight: { xs: 1.3, sm: 1.4 }
              }}>
                Collection: {additionalData.heliusDebugData.collectionId?.slice(0, 12)}...<br/>
                Wallet: {additionalData.heliusDebugData.walletAddress?.slice(0, 8)}...{additionalData.heliusDebugData.walletAddress?.slice(-8)}<br/>
                Assets Requested: {additionalData.heliusDebugData.assetsRequested}<br/>
                Assets Received: {additionalData.heliusDebugData.assetsReceived}<br/>
                Assets Filtered: {additionalData.heliusDebugData.assetsFiltered}<br/>
                Assets Rejected: {additionalData.heliusDebugData.assetsRejected}<br/>
                <br/>
                <strong>Data Completeness:</strong><br/>
                With Images: {additionalData.heliusDebugData.dataCompleteness?.withImages}<br/>
                With Metadata: {additionalData.heliusDebugData.dataCompleteness?.withMetadata}<br/>
                With Attributes: {additionalData.heliusDebugData.dataCompleteness?.withAttributes}<br/>
                Metadata Calls: {additionalData.heliusDebugData.dataCompleteness?.metadataCallSuccess}<br/>
                <br/>
                <strong>Missing Data:</strong><br/>
                No Images: {additionalData.heliusDebugData.missingDataSummary?.noImageCount} {additionalData.heliusDebugData.missingDataSummary?.noImageTokens?.length > 0 && `(${additionalData.heliusDebugData.missingDataSummary.noImageTokens.join(', ')})`}<br/>
                No Metadata: {additionalData.heliusDebugData.missingDataSummary?.noMetadataCount} {additionalData.heliusDebugData.missingDataSummary?.noMetadataTokens?.length > 0 && `(${additionalData.heliusDebugData.missingDataSummary.noMetadataTokens.join(', ')})`}<br/>
                No Attributes: {additionalData.heliusDebugData.missingDataSummary?.noAttributesCount} {additionalData.heliusDebugData.missingDataSummary?.noAttributesTokens?.length > 0 && `(${additionalData.heliusDebugData.missingDataSummary.noAttributesTokens.join(', ')})`}<br/>
                No Names: {additionalData.heliusDebugData.missingDataSummary?.noNameCount}<br/>
                No Ranks: {additionalData.heliusDebugData.missingDataSummary?.noRankCount}<br/>
                <br/>
                <strong>Performance:</strong><br/>
                Total Time: {additionalData.heliusDebugData.performanceMetrics?.totalFetchTime}ms<br/>
                Assets Fetch: {additionalData.heliusDebugData.performanceMetrics?.assetsFetchTime}ms<br/>
                Metadata Fetch: {additionalData.heliusDebugData.performanceMetrics?.metadataFetchTime}ms<br/>
                Stats Fetch: {additionalData.heliusDebugData.performanceMetrics?.statsFetchTime}ms<br/>
                SOL Price: {additionalData.heliusDebugData.performanceMetrics?.solPriceFetchTime}ms<br/>
                <br/>
                <strong>API Endpoints:</strong><br/>
                {additionalData.heliusDebugData.apiEndpoints?.join(', ')}
              </Typography>
            </DebugSection>
          )}

          {/* Market Debug Data for PrimosMarketGallery */}
          {additionalData.marketDebugData && (
            <DebugSection title="Market API Debug" sectionKey="marketDebug" icon={<AssignmentIcon sx={{ color: '#000000' }} />}>
              <Typography variant="body2" sx={{ 
                fontFamily: 'monospace', 
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                lineHeight: { xs: 1.3, sm: 1.4 }
              }}>
                Symbol: {additionalData.marketDebugData.magicEdenSymbol}<br/>
                Page: {additionalData.marketDebugData.currentPage} (Offset: {additionalData.marketDebugData.pageOffset})<br/>
                Listings Requested: {additionalData.marketDebugData.listingsRequested}<br/>
                Listings Received: {additionalData.marketDebugData.listingsReceived}<br/>
                Listings Filtered: {additionalData.marketDebugData.listingsFiltered}<br/>
                Listings Rejected: {additionalData.marketDebugData.listingsRejected}<br/>
                <br/>
                <strong>Data Completeness:</strong><br/>
                With Images: {additionalData.marketDebugData.dataCompleteness?.withImages}<br/>
                With Metadata: {additionalData.marketDebugData.dataCompleteness?.withMetadata}<br/>
                With Attributes: {additionalData.marketDebugData.dataCompleteness?.withAttributes}<br/>
                Metadata Calls: {additionalData.marketDebugData.dataCompleteness?.metadataCallSuccess}<br/>
                <br/>
                <strong>Missing Data:</strong><br/>
                No Images: {additionalData.marketDebugData.missingDataSummary?.noImageCount} {additionalData.marketDebugData.missingDataSummary?.noImageTokens?.length > 0 && `(${additionalData.marketDebugData.missingDataSummary.noImageTokens.join(', ')})`}<br/>
                No Metadata: {additionalData.marketDebugData.missingDataSummary?.noMetadataCount} {additionalData.marketDebugData.missingDataSummary?.noMetadataTokens?.length > 0 && `(${additionalData.marketDebugData.missingDataSummary.noMetadataTokens.join(', ')})`}<br/>
                No Attributes: {additionalData.marketDebugData.missingDataSummary?.noAttributesCount} {additionalData.marketDebugData.missingDataSummary?.noAttributesTokens?.length > 0 && `(${additionalData.marketDebugData.missingDataSummary.noAttributesTokens.join(', ')})`}<br/>
                No Names: {additionalData.marketDebugData.missingDataSummary?.noNameCount}<br/>
                No Ranks: {additionalData.marketDebugData.missingDataSummary?.noRankCount}<br/>
                No Prices: {additionalData.marketDebugData.missingDataSummary?.noPriceCount} {additionalData.marketDebugData.missingDataSummary?.noPriceTokens?.length > 0 && `(${additionalData.marketDebugData.missingDataSummary.noPriceTokens.join(', ')})`}<br/>
                No Sellers: {additionalData.marketDebugData.missingDataSummary?.noSellerCount} {additionalData.marketDebugData.missingDataSummary?.noSellerTokens?.length > 0 && `(${additionalData.marketDebugData.missingDataSummary.noSellerTokens.join(', ')})`}<br/>
                No Token ATA: {additionalData.marketDebugData.missingDataSummary?.noTokenAtaCount}<br/>
                <br/>
                <strong>Performance:</strong><br/>
                Total Time: {additionalData.marketDebugData.performanceMetrics?.totalFetchTime}ms<br/>
                Listings Fetch: {additionalData.marketDebugData.performanceMetrics?.listingsFetchTime}ms<br/>
                Metadata Fetch: {additionalData.marketDebugData.performanceMetrics?.metadataFetchTime}ms<br/>
                Stats Fetch: {additionalData.marketDebugData.performanceMetrics?.statsFetchTime}ms<br/>
                SOL Price: {additionalData.marketDebugData.performanceMetrics?.solPriceFetchTime}ms<br/>
                Attributes: {additionalData.marketDebugData.performanceMetrics?.attributesFetchTime}ms<br/>
                <br/>
                <strong>Market Stats:</strong><br/>
                Floor Price: {additionalData.marketDebugData.marketStats?.floorPrice ? `${additionalData.marketDebugData.marketStats.floorPrice.toFixed(4)} SOL` : 'N/A'}<br/>
                Listed Count: {additionalData.marketDebugData.marketStats?.listedCount ?? 'N/A'}<br/>
                Unique Holders: {additionalData.marketDebugData.marketStats?.uniqueHolders ?? 'N/A'}<br/>
                SOL Price: ${additionalData.marketDebugData.marketStats?.solPrice?.toFixed(2) ?? 'N/A'}<br/>
                <br/>
                <strong>Pagination Health:</strong><br/>
                Expected vs Actual: {additionalData.marketDebugData.paginationHealth?.expectedVsActual}<br/>
                Offset: {additionalData.marketDebugData.paginationHealth?.paginationOffset}<br/>
                Total Pages: {additionalData.marketDebugData.paginationHealth?.totalPagesCalculated}<br/>
                <br/>
                <strong>API Endpoints:</strong><br/>
                {additionalData.marketDebugData.apiEndpoints?.join(', ')}
              </Typography>
            </DebugSection>
          )}

          {/* Contract Panel Debug Data */}
          {additionalData.contractPanelDebugData && (
            <DebugSection title="Contract Panel Debug" sectionKey="contractPanelDebug" icon={<ApiIcon sx={{ color: '#000000' }} />}>
              <Typography variant="body2" sx={{ 
                fontFamily: 'monospace', 
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                lineHeight: { xs: 1.3, sm: 1.4 }
              }}>
                Contract Address: {additionalData.contractPanelDebugData.contractAddress?.slice(0, 8)}...{additionalData.contractPanelDebugData.contractAddress?.slice(-8)}<br/>
                Network Detected: {additionalData.contractPanelDebugData.networkDetected}<br/>
                Trench Data Loaded: {additionalData.contractPanelDebugData.trenchDataLoaded ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                First Caller Found: {additionalData.contractPanelDebugData.firstCallerFound ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                PFP Load Attempted: {additionalData.contractPanelDebugData.pfpLoadAttempted ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                PFP Load Success: {additionalData.contractPanelDebugData.pfpLoadSuccess ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                {additionalData.contractPanelDebugData.pfpLoadError && (
                  <>PFP Load Error: {additionalData.contractPanelDebugData.pfpLoadError}<br/></>
                )}
                User Data Found: {additionalData.contractPanelDebugData.userDataFound ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                PFP Loaded (Legacy): {additionalData.contractPanelDebugData.pfpLoaded ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                Market Cap Fetched: {additionalData.contractPanelDebugData.marketCapFetched ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                CoinGecko Loaded: {additionalData.contractPanelDebugData.coinGeckoLoaded ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                Latest Callers Count: {additionalData.contractPanelDebugData.latestCallersCount}<br/>
                Token Metadata Loaded: {additionalData.contractPanelDebugData.tokenMetadataLoaded ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                Token Info Loaded: {additionalData.contractPanelDebugData.tokenInfoLoaded ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                <br/>
                <strong>Component State:</strong><br/>
                Loading: {additionalData.loading ? <RefreshIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'orange', verticalAlign: 'middle' }} /> : <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} />}<br/>
                Market Cap Loading: {additionalData.marketCapLoading ? <RefreshIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'orange', verticalAlign: 'middle' }} /> : <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} />}<br/>
                Caller Info Loaded: {additionalData.callerInfoLoaded ? <CheckCircleIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: 'red', verticalAlign: 'middle' }} />}<br/>
                <br/>
                <strong>Data Counts:</strong><br/>
                CoinGecko Data: {additionalData.coinGeckoDataCount}<br/>
                Token Holders: {additionalData.tokenHoldersCount}<br/>
                Liquidity Pools: {additionalData.liquidityPoolsCount}<br/>
                Latest Callers: {additionalData.latestCallersCount}<br/>
              </Typography>
            </DebugSection>
          )}

          {/* Additional Debug Data */}
          {Object.keys(additionalData).length > 0 && (
            <DebugSection title="Additional Data" sectionKey="additional" icon={<DashboardIcon sx={{ color: '#000000' }} />}>
              <Typography variant="body2" sx={{ 
                fontFamily: 'monospace', 
                fontSize: { xs: '0.65rem', sm: '0.75rem' }
              }}>
                <pre style={{ 
                  margin: 0, 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(additionalData, null, 2)}
                </pre>
              </Typography>
            </DebugSection>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDeveloperConsole;
