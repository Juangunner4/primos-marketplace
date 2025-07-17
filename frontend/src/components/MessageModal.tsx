import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AppMessage } from '../types';
import './MessageModal.css';

interface MessageModalProps {
  open: boolean;
  message: AppMessage | null;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
}

const MessageModal: React.FC<MessageModalProps> = ({ open, message, onClose, onConfirm, confirmLabel }) => {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content">
        <p>{message.text}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          {onConfirm && (
            <Button variant="contained" onClick={onConfirm}>
              {confirmLabel || t('yes_edit')}
            </Button>
          )}
          <Button variant="outlined" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default MessageModal;
