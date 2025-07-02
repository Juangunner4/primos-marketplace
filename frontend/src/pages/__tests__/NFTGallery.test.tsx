import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import NFTGallery from "../NFTGallery";
import i18n from "../../i18n";

jest.mock("../../hooks/usePrivyWallet", () => ({
  usePrivyWallet: jest.fn(),
}));

jest.mock("../../utils/helius", () => ({
  getAssetsByCollection: jest.fn(() =>
    Promise.resolve([
      { id: "1", image: "img", name: "Primo", listed: false, attributes: [] },
    ]),
  ),
}));

jest.mock("../../utils/magiceden", () => ({
  getMagicEdenStats: jest.fn(() => Promise.resolve({ floorPrice: 0 })),
}));

jest.mock("../../utils/pyth", () => ({
  getPythSolPrice: jest.fn(() => Promise.resolve(0)),
}));

describe("NFTGallery", () => {
  test("prompts to connect wallet when no wallet is connected", () => {
    const { usePrivyWallet } = require("../../hooks/usePrivyWallet");
    (usePrivyWallet as jest.Mock).mockReturnValue({ publicKey: null });
    render(
      <I18nextProvider i18n={i18n}>
        <NFTGallery />
      </I18nextProvider>,
    );
    expect(screen.getByText(/Connect your wallet/i)).toBeTruthy();
  });

  test("opens NFTCard when nft clicked", async () => {
    const { usePrivyWallet } = require("../../hooks/usePrivyWallet");
    (usePrivyWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => "wallet1" },
    });
    render(
      <I18nextProvider i18n={i18n}>
        <NFTGallery />
      </I18nextProvider>,
    );
    const item = await screen.findByRole("button");
    fireEvent.click(item);
    await waitFor(() => {
      expect(screen.getByText("Primo")).toBeTruthy();
    });
  });
});
