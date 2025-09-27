import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NFTCard, { MarketNFT } from "../NFTCard";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";

const sampleNFT: MarketNFT = {
  id: "1",
  image: "img",
  name: "Wey 1",
  price: 1,
  variant: "pink",
  rank: 5,
};

describe("NFTCard", () => {
  test("renders nft details when open", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <NFTCard nft={sampleNFT} open={true} onClose={() => {}} />
      </I18nextProvider>,
    );
    expect(screen.getByText("Wey 1")).toBeTruthy();
    expect(screen.getByText("#5")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  test("calls onClose when close button clicked", () => {
    const onClose = jest.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <NFTCard nft={sampleNFT} open={true} onClose={onClose} />
      </I18nextProvider>,
    );
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  test("uses custom buy label when provided", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <NFTCard
          nft={sampleNFT}
          open={true}
          onClose={() => {}}
          buyLabel="List"
        />
      </I18nextProvider>,
    );
    expect(screen.getByText("List")).toBeTruthy();
  });
});
