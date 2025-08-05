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
  Dashboard as DashboardIcon
} from '@mui/icons-material';

const ADMIN_WALLET = process.env.REACT_APP_ADMIN_WALLET;

interface DebugInfo {
  apiCallAttempted: boolean;
  apiCallSuccess: boolean;
  apiCallError: string | null;
  contractsLoaded: number;
  usersLoaded: number;
  renderAttempted: boolean;
  lastError: Error | null;
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    wallet: true,
    api: true,
    component: true,
    environment: true,
    errors: true
  });

  // Only show to admin wallet
  const isAdmin = publicKey && publicKey.toBase58() === ADMIN_WALLET;
  
  if (!isAdmin || process.env.NODE_ENV !== 'development') {
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
    <Box sx={{ mb: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          p: 1,
          backgroundColor: '#ffffff',
          borderRadius: 1,
          border: '1px solid #000000'
        }}
        onClick={() => toggleSection(sectionKey)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          {icon}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#000000' }}>
            {title}
          </Typography>
        </Box>
        {expandedSections[sectionKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>
      <Collapse in={expandedSections[sectionKey]}>
        <Box sx={{ p: 1, backgroundColor: '#ffffff', border: '1px solid #000000', borderTop: 'none' }}>
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
          bottom: 20,
          right: 20,
          zIndex: 1000,
          backgroundColor: '#000000',
          color: 'white',
          '&:hover': {
            backgroundColor: '#333333'
          }
        }}
        onClick={() => setIsOpen(true)}
      >
        <BugReportIcon />
      </Fab>

      {/* Debug Console Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 20,
            right: 20,
            top: 'auto',
            left: 'auto',
            margin: 0,
            maxWidth: '600px',
            maxHeight: '70vh',
            width: '600px'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#000000',
          color: 'white',
          py: 1
        }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReportIcon />
            Admin Dev Console - {componentName}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setIsOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 2, fontSize: '0.85rem' }}>
          <DebugSection title="Wallet & Auth Status" sectionKey="wallet" icon={<SecurityIcon sx={{ color: '#000000' }} />}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              Connected: {connected ? <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} />}<br/>
              Public Key: {publicKey ? `${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}` : <><CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} /> None</>}<br/>
              Is Admin: {isAdmin ? <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} />}<br/>
              Timestamp: {new Date().toISOString()}
            </Typography>
          </DebugSection>

          <DebugSection title="API & Data Status" sectionKey="api" icon={<ApiIcon sx={{ color: '#000000' }} />}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              API Attempted: {debugInfo.apiCallAttempted ? <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} />}<br/>
              API Success: {debugInfo.apiCallSuccess ? <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} />}<br/>
              Contracts Loaded: {debugInfo.contractsLoaded}<br/>
              Users Loaded: {debugInfo.usersLoaded}<br/>
              {additionalData.dataContracts !== undefined && (
                <>Current Contracts: {additionalData.dataContracts}<br/></>
              )}
              {additionalData.dataUsers !== undefined && (
                <>Current Users: {additionalData.dataUsers}<br/></>
              )}
            </Typography>
          </DebugSection>

          <DebugSection title="Component State" sectionKey="component" icon={<SettingsIcon sx={{ color: '#000000' }} />}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              Render Attempted: {debugInfo.renderAttempted ? <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} />}<br/>
              {additionalData.loading !== undefined && (
                <>Loading: {additionalData.loading ? <RefreshIcon sx={{ fontSize: 14, color: 'orange', verticalAlign: 'middle' }} /> : <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} />}<br/></>
              )}
              {additionalData.adding !== undefined && (
                <>Adding: {additionalData.adding ? <RefreshIcon sx={{ fontSize: 14, color: 'orange', verticalAlign: 'middle' }} /> : <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} />}<br/></>
              )}
              {additionalData.isHolder !== undefined && (
                <>Is Holder: {additionalData.isHolder ? <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} />}<br/></>
              )}
              {additionalData.canSubmit !== undefined && (
                <>Can Submit: {additionalData.canSubmit ? <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} />}<br/></>
              )}
              {additionalData.connectionPresent !== undefined && (
                <>Connection: {additionalData.connectionPresent ? <CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> : <CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} />}<br/></>
              )}
            </Typography>
          </DebugSection>

          <DebugSection title="Environment" sectionKey="environment" icon={<LanguageIcon sx={{ color: '#000000' }} />}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              Node Env: {process.env.NODE_ENV}<br/>
              Backend URL: {process.env.REACT_APP_BACKEND_URL || <><CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} /> Missing</>}<br/>
              {additionalData.environmentVars?.primoCollection !== undefined && (
                <>Primo Collection: {additionalData.environmentVars.primoCollection ? <><CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> Set</> : <><CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} /> Missing</>}<br/></>
              )}
              Helius Key: {process.env.REACT_APP_HELIUS_API_KEY ? <><CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> Set</> : <><CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} /> Missing</>}<br/>
              Admin Wallet: {ADMIN_WALLET ? <><CheckCircleIcon sx={{ fontSize: 14, color: 'green', verticalAlign: 'middle' }} /> Set</> : <><CancelIcon sx={{ fontSize: 14, color: 'red', verticalAlign: 'middle' }} /> Missing</>}
            </Typography>
          </DebugSection>

          {(debugInfo.apiCallError || debugInfo.lastError) && (
            <DebugSection title="Error Details" sectionKey="errors" icon={<ErrorIcon sx={{ color: '#000000' }} />}>
              {debugInfo.apiCallError && (
                <Box sx={{ mb: 2, p: 1, backgroundColor: '#f8d7da', borderRadius: 1, border: '1px solid #f5c6cb' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#721c24', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CancelIcon sx={{ fontSize: 16 }} /> API Error:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#721c24' }}>
                    {debugInfo.apiCallError}
                  </Typography>
                </Box>
              )}
              
              {debugInfo.lastError && (
                <Box sx={{ p: 1, backgroundColor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#856404', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WarningIcon sx={{ fontSize: 16 }} /> Last Error:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#856404' }}>
                    {debugInfo.lastError.message}<br/>
                    {debugInfo.lastError.stack?.split('\n').slice(0, 3).join('\n')}
                  </Typography>
                </Box>
              )}
            </DebugSection>
          )}

          {/* Additional Debug Data */}
          {Object.keys(additionalData).length > 0 && (
            <DebugSection title="Additional Data" sectionKey="additional" icon={<DashboardIcon sx={{ color: '#000000' }} />}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
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
