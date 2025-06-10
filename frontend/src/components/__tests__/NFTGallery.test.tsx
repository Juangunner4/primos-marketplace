import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import NFTGallery from '../../pages/NFTGallery';
import i18n from '../../i18n';

jest.mock('@solana/wallet-adapter-react', () => ({
    useWallet: () => ({ publicKey: null }),
}));

describe('NFTGallery', () => {
    test('prompts to connect wallet when no wallet is connected', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <NFTGallery />
            </I18nextProvider>
        );
        expect(screen.getByText(/Connect your wallet/i)).toBeTruthy();
    });
});
