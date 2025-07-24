import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import './TxProgressModal.css';

interface TxProgressModalProps {
  open: boolean;
  step: number;
}

const TxProgressModal: React.FC<TxProgressModalProps> = ({ open, step }) => {
  const { t } = useTranslation();
  if (!open || step === 0) return null;
  const messages = [
    '',
    t('tx_step_init'),
    t('tx_step_sign'),
    t('tx_step_confirm'),
  ];
  return (
    <Dialog.Root open={open}>
      <Dialog.Overlay className="tx-modal-overlay" />
      <Dialog.Content className="tx-modal-content">
        <Dialog.Title className="tx-modal-title">
          {t('tx_progress_title')}
        </Dialog.Title>
        <div className="tx-modal-spinner" />
        <Dialog.Description asChild>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{messages[step]}</pre>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default TxProgressModal;
