import React from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const BallBeatLoader = () => {
  const scale1 = new Animated.Value(1);
  const scale2 = new Animated.Value(1);
  const scale3 = new Animated.Value(1);

  React.useEffect(() => {
    const animate = (scale: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 0.3,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(scale1, 0);
    animate(scale2, 150);
    animate(scale3, 300);
  }, []);

  return (
    <View style={styles.container}>
      {[scale1, scale2, scale3].map((scale, idx) => (
        <Animated.View
          key={idx}
          style={[styles.circle, { transform: [{ scale }] }]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#333",
  },
});

export default BallBeatLoader;
