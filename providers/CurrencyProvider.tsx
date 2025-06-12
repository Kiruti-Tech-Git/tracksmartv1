// contexts/CurrencyContext.tsx
import React, { createContext, useContext, useState } from "react";

// Supported currencies
type CurrencyCode = "KES" | "USD" | "EUR" | "GBP";

// Exchange rates (we'll improve this later)
const DEFAULT_RATES = {
  USD: 0.0077, // 1 KES = 0.0078 USD
  EUR: 0.0067, // 1 KES = 0.0072 EUR
  GBP: 0.0057, // 1 KES = 0.0062 GBP
  KES: 1, // 1 KES = 1 KES
};

type CurrencyContextType = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  convert: (amount: number, from?: CurrencyCode) => number;
  format: (amount: number, from?: CurrencyCode) => string;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "KES",
  setCurrency: () => {},
  convert: (amount) => amount,
  format: (amount) => `${amount.toFixed(2)} KES`,
});

export const CurrencyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currency, setCurrency] = useState<CurrencyCode>("KES");

  // Convert amount from specified currency to current selected currency
  const convert = (amount: number, from: CurrencyCode = "KES"): number => {
    if (from === currency) return amount;
    const amountInKES = amount / DEFAULT_RATES[from]; // Convert to KES first
    return amountInKES * DEFAULT_RATES[currency]; // Then to target currency
  };

  // Format amount with currency symbol
  const format = (amount: number, from: CurrencyCode = "KES"): string => {
    const convertedAmount = convert(amount, from);

    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount);

    switch (currency) {
      case "USD":
        return `$${formatted}`;
      case "EUR":
        return `€${formatted}`;
      case "GBP":
        return `£${formatted}`;
      default:
        return `KES ${formatted}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, convert, format }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
