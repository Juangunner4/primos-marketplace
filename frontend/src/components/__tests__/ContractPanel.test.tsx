import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ContractPanel from '../ContractPanel';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

// Mock the trench service
jest.mock('../../services/trench', () => ({
  getContractDetails: jest.fn(),
  getLatestCallers: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    contractAddress: 'test-contract-address'
  }),
  useNavigate: () => jest.fn(),
}));

import * as trenchService from '../../services/trench';

const mockContractData = {
  contract: 'test-contract-address',
  count: 5,
  firstCaller: 'first-caller-key',
  firstCallerMarketCap: 1500000,
  domain: 'testdomain.com',
  model: 'test-model'
};

const mockCallers = [
  {
    caller: 'caller1',
    calledAt: Date.now() - 1000,
    marketCapAtCall: 2000000,
    domainAtCall: 'domain1.com'
  },
  {
    caller: 'caller2',
    calledAt: Date.now() - 2000,
    marketCapAtCall: 1800000,
    domainAtCall: 'domain2.com'
  }
];

const mockUserData = {
  publicKey: 'first-caller-key',
  profilePicture: 'https://example.com/avatar1.jpg',
  twitterHandle: 'testuser1',
  discordHandle: 'testuser1#1234'
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('ContractPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (trenchService.getContractDetails as jest.Mock).mockResolvedValue({
      contractData: mockContractData,
      userData: mockUserData,
      latestCallers: mockCallers
    });
    (trenchService.getLatestCallers as jest.Mock).mockResolvedValue(mockCallers);
  });

  test('renders contract panel with basic information', async () => {
    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(screen.getByText('Community Sentiment')).toBeInTheDocument();
    });

    expect(screen.getByText('test-contract-address')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // count
  });

  test('displays formatted market cap correctly', async () => {
    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(screen.getByText('$1.50M')).toBeInTheDocument();
    });
  });

  test('formats market cap in billions correctly', async () => {
    const largeMarketCapData = {
      ...mockContractData,
      firstCallerMarketCap: 1091040000 // Should format to $1.09B
    };

    (trenchService.getContractDetails as jest.Mock).mockResolvedValue({
      contractData: largeMarketCapData,
      userData: mockUserData,
      latestCallers: mockCallers
    });

    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(screen.getByText('$1.09B')).toBeInTheDocument();
    });
  });

  test('displays latest callers section', async () => {
    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(screen.getByText('Latest Callers')).toBeInTheDocument();
    });

    // Check if caller information is displayed
    expect(screen.getByText('$2.00M')).toBeInTheDocument(); // First caller's market cap
    expect(screen.getByText('$1.80M')).toBeInTheDocument(); // Second caller's market cap
  });

  test('handles loading state', () => {
    (trenchService.getContractDetails as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderWithProviders(<ContractPanel />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (trenchService.getContractDetails as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch contract details')
    );

    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Error fetching contract details:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  test('displays user social media links when available', async () => {
    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('Discord')).toBeInTheDocument();
    });
  });

  test('does not display social media links when not available', async () => {
    const userDataWithoutSocial = {
      ...mockUserData,
      twitterHandle: null,
      discordHandle: null
    };

    (trenchService.getContractDetails as jest.Mock).mockResolvedValue({
      contractData: mockContractData,
      userData: userDataWithoutSocial,
      latestCallers: mockCallers
    });

    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(screen.queryByLabelText('Twitter')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Discord')).not.toBeInTheDocument();
    });
  });

  test('closes panel when close button is clicked', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    screen.getByLabelText('Close').click();
    expect(mockNavigate).toHaveBeenCalledWith('/trenches');
  });

  test('displays domain information', async () => {
    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(screen.getByText('testdomain.com')).toBeInTheDocument();
    });
  });

  test('handles empty latest callers list', async () => {
    (trenchService.getContractDetails as jest.Mock).mockResolvedValue({
      contractData: mockContractData,
      userData: mockUserData,
      latestCallers: []
    });

    renderWithProviders(<ContractPanel />);

    await waitFor(() => {
      expect(screen.getByText('Latest Callers')).toBeInTheDocument();
    });

    // Should not crash and should still show the section header
    expect(screen.queryByText('$2.00M')).not.toBeInTheDocument();
  });
});
