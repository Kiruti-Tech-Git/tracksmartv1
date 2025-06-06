import { colors, radius, spacingX } from "@/constants/theme";
import { AccountType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { Image, ImageSource } from "expo-image";
import { Router } from "expo-router";
import * as Icons from "phosphor-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Typo from "./Typo";

const AccountListItem = ({
  item,
  index,
  router,
}: {
  item: AccountType;
  index: number;
  router: Router;
}) => {
  const openAccount = () => {
    router.push({
      pathname: "/(modals)/accountModal",
      params: {
        id: item?.id,
        name: item?.name,
        image:
          typeof item?.image === "string" ? item.image : item?.image?.uri ?? "",
      },
    });
  };

  // Properly type the image source
  const getImageSource = (): ImageSource => {
    if (!item?.image) {
      return { uri: "https://placehold.co/100x100?text=No+Image" };
    }

    if (typeof item.image === "string") {
      return { uri: item.image };
    }
    console.log("po");

    return {
      uri: item.image.uri || "https://placehold.co/100x100?text=No+Image",
      ...(item.image.url ? { url: item.image.url } : {}),
    };
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .springify()
        .damping(13)}
    >
      <TouchableOpacity style={styles.container} onPress={openAccount}>
        <View style={styles.imageContainer}>
          <Image
            style={{ width: "100%", height: "100%" }}
            source={getImageSource()}
            contentFit="cover"
            transition={100}
            onError={(e) => console.log("Image load error:", e)}
          />
        </View>
        <View style={styles.nameContainer}>
          <Typo size={16}>{item.name}</Typo>
          <Typo size={14} color={colors.neutral400}>
            KES {(item.amount ?? 0).toFixed(2)}
          </Typo>
        </View>
        <Icons.CaretRight
          size={verticalScale(20)}
          color={colors.white}
          weight="bold"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AccountListItem;

// Keep your existing styles...

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(17),
  },
  imageContainer: {
    height: verticalScale(45),
    width: verticalScale(45),
    borderWidth: 1,
    borderColor: colors.neutral600,
    borderRadius: radius._12,
    overflow: "hidden",
    backgroundColor: colors.neutral800, // fallback bg
  },
  nameContainer: {
    flex: 1,
    gap: 2,
    marginLeft: spacingX._10,
  },
});
