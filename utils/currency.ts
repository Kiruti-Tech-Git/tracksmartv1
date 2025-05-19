const EXCHANGE_RATES = {
  USD: 0.0078,
  EUR: 0.0072,
  GBP: 0.0062,
};

type Currency = keyof typeof EXCHANGE_RATES | "KES";

export const convertAmount = (amount: number, currency: Currency) => {
  if (currency === "KES") return amount;
  return amount * (EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] || 1);
};

export const formatAmount = (amount: number, currency: Currency) => {
  const convertedAmount = convertAmount(amount, currency);
  switch (currency) {
    case "USD":
      return `$${amount.toFixed(2)}`;
    case "EUR":
      return `€${amount.toFixed(2)}`;
    case "GBP":
      return `£${amount.toFixed(2)}`;
    default:
      return `KES ${amount.toFixed(2)}`;
  }
};
