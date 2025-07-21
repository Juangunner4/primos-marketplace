import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import TransactionCard from "../TransactionCard";
import i18n from "../../i18n";

jest.mock("@mui/material/useMediaQuery", () => () => true);

describe("TransactionCard", () => {
  test("renders price and buttons", () => {
    const onBuy = jest.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <TransactionCard
          priceSol="1.23"
          priceUsd="2.34"
          onBuy={onBuy}
          variantBg="#fff"
          variantBorder="#000"
        />
      </I18nextProvider>,
    );
    expect(screen.getByText("1.371 SOL")).toBeTruthy();
    expect(screen.getByText(new RegExp(i18n.t('list_price')))).toBeTruthy();
    expect(
      screen.getByText(new RegExp(i18n.t('seller_receives')))
    ).toBeTruthy();
    expect(screen.getByText(i18n.t("buy_now"))).toBeTruthy();
    fireEvent.click(screen.getByText(i18n.t("buy_now")));
    expect(onBuy).toHaveBeenCalled();
  });

  test("allows custom button label", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TransactionCard
          priceSol="1.23"
          onBuy={() => {}}
          variantBg="#fff"
          variantBorder="#000"
          buyLabel="List"
        />
      </I18nextProvider>,
    );
    expect(screen.getByText("List")).toBeTruthy();
  });

  test("shows no price text when price missing", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TransactionCard
          priceSol={null}
          onBuy={() => {}}
          variantBg="#fff"
          variantBorder="#000"
        />
      </I18nextProvider>,
    );
    expect(screen.getByText(i18n.t("market_no_price"))).toBeTruthy();
  });
});
