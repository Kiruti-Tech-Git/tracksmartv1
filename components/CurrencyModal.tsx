import { colors, spacingX, spacingY } from "@/constants/theme";
import { useCurrency } from "@/providers/CurrencyProvider";
import * as Icons from "phosphor-react-native";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import Typo from "./Typo";

type CurrencyCode = "KES" | "USD" | "EUR" | "GBP";

const CURRENCIES: { code: CurrencyCode; name: string; symbol: string }[] = [
  { code: "KES", name: "Kenyan Shilling", symbol: "KES" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

type CurrencyModalProps = {
  visible: boolean;
  onClose: () => void;
};

const CurrencyModal = ({ visible, onClose }: CurrencyModalProps) => {
  const { currency: selectedCurrency, setCurrency, format } = useCurrency();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Typo size={18} fontWeight="600" style={styles.modalTitle}>
              Select Currency
            </Typo>

            {CURRENCIES.map((currency) => (
              <CurrencyOption
                key={currency.code}
                currency={currency}
                isSelected={selectedCurrency === currency.code}
                onPress={() => {
                  setCurrency(currency.code);
                  onClose();
                }}
                format={format}
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const CurrencyOption = ({
  currency,
  isSelected,
  onPress,
  format,
}: {
  currency: (typeof CURRENCIES)[number];
  isSelected: boolean;
  onPress: () => void;
  format: (amount: number) => string;
}) => (
  <TouchableOpacity
    style={[styles.currencyItem, isSelected && styles.selectedItem]}
    onPress={onPress}
  >
    <View style={styles.currencyInfo}>
      <Typo fontWeight={isSelected ? "600" : "400"}>
        {currency.symbol} - {currency.name}
      </Typo>
    </View>
    {isSelected && (
      <Icons.CheckCircle weight="fill" size={20} color={colors.green} />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: colors.neutral900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacingX._20,
    maxHeight: "60%",
  },
  modalContent: {
    paddingBottom: spacingY._20,
  },
  modalTitle: {
    marginBottom: spacingY._15,
    textAlign: "center",
  },
  currencyItem: {
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedItem: {
    backgroundColor: colors.neutral700,
  },
  currencyInfo: {
    flex: 1,
  },
});

export default CurrencyModal;
