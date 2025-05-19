// components/CategoryModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import * as Icons from "phosphor-react-native";

type CategoryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (category: {
    label: string;
    value: string;
    icon: string;
    bgColor: string;
  }) => void;
};

// List of available icons
const ICON_OPTIONS = [
  "ShoppingCart",
  "House",
  "Car",
  "Heart",
  "Pizza",
  "Airplane",
  "Hamburger",
  "Book",
  "Briefcase",
  "TShirt",
  "ForkKnife",
  "FilmStrip",
  "Lightbulb",
  "Tree",
  "Basketball",
  "MusicNotes",
  "PawPrint",
  "Planet",
  "Gift",
  "Wallet",
  "Bicycle",
  "Coffee",
    "Camera",
    "Smiley",
  "CallBell",
] as const;

// Color options
const COLOR_OPTIONS = [
  "#4B5563",
  "#075985",
  "#ca8a04",
  "#b45309",
  "#0f766e",
  "#be185d",
  "#de11d4",
  "#404040",
  "#065f46",
  "#7c3aed",
  "#a21caf",
  "#525252",
];

const CategoryModal = ({ visible, onClose, onSave }: CategoryModalProps) => {
  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] =
    useState<keyof typeof Icons>("ShoppingCart");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  const handleSave = () => {
    if (!categoryName.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    onSave({
      label: categoryName.trim(),
      value: categoryName.trim().toLowerCase().replace(/\s+/g, "-"),
      icon: selectedIcon,
      bgColor: selectedColor,
    });

    // Reset form
    setCategoryName("");
    setSelectedIcon("ShoppingCart");
    setSelectedColor(COLOR_OPTIONS[0]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Typo size={20} fontWeight="600" style={styles.modalTitle}>
            New Category
          </Typo>

          {/* Category Name Input */}
          <TextInput
            placeholder="Category Name"
            placeholderTextColor={colors.neutral400}
            value={categoryName}
            onChangeText={setCategoryName}
            style={styles.input}
          />

          {/* Icon Selection */}
          <Typo size={16} style={styles.sectionTitle}>
            Select Icon
          </Typo>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.iconContainer}>
              {ICON_OPTIONS.map((iconName) => {
                const IconComponent = Icons[iconName];
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.iconButton,
                      selectedIcon === iconName && styles.selectedIcon,
                    ]}
                    onPress={() => setSelectedIcon(iconName as keyof typeof Icons)}
                  >
                    <IconComponent
                      size={28}
                      color={
                        selectedIcon === iconName
                          ? colors.white
                          : colors.neutral400
                      }
                      weight="fill"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Color Selection */}
          <Typo size={16} style={styles.sectionTitle}>
            Select Color
          </Typo>
          <View style={styles.colorContainer}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Typo color={colors.white}>Cancel</Typo>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Typo color={colors.white}>Save Category</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacingX._20,
  },
  modalContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._20,
    padding: spacingX._20,
    maxHeight: "80%",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: spacingY._20,
  },
  input: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._10,
    padding: spacingY._12,
    color: colors.white,
    fontSize: 16,
    marginBottom: spacingY._20,
  },
  sectionTitle: {
    color: colors.neutral400,
    marginBottom: spacingY._10,
  },
  iconContainer: {
    flexDirection: "row",
    gap: spacingX._15,
    marginBottom: spacingY._20,
  },
  iconButton: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._10,
    padding: spacingY._10,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIcon: {
    backgroundColor: colors.green,
  },
  colorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingX._10,
    marginBottom: spacingY._20,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: colors.white,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: spacingX._10,
    marginTop: spacingY._10,
  },
  button: {
    flex: 1,
    borderRadius: radius._10,
    padding: spacingY._12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.rose,
  },
  saveButton: {
    backgroundColor: colors.green,
  },
});

export default CategoryModal;
