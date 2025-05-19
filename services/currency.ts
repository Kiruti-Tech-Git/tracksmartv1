type ExchangeRates = {
  [currency: string]: number;
};

// Fetch latest rates from an API (we'll use a fallback first)
const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/KES"
    );
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Failed to fetch rates, using fallback", error);
    // Fallback rates (update these periodically)
    return {
      USD: 0.0078,
      EUR: 0.0072,
      GBP: 0.0062,
      KES: 1,
    };
  }
};

let exchangeRates: ExchangeRates = {
  USD: 0.0078,
  EUR: 0.0072,
  GBP: 0.0062,
  KES: 1,
};

// Update rates periodically
const updateRates = async () => {
  const rates = await fetchExchangeRates();
  exchangeRates = rates;
};

// Update rates every 6 hours
updateRates();
setInterval(updateRates, 6 * 60 * 60 * 1000);

export const convertAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  if (fromCurrency === toCurrency) return amount;
  if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return amount;

  // Convert to USD first, then to target currency
  const amountInUSD = amount * exchangeRates[fromCurrency];
  return amountInUSD / exchangeRates[toCurrency];
};

export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};
