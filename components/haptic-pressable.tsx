import { forwardRef } from "react";
import { Platform, Pressable, View, type PressableProps } from "react-native";
import * as Haptics from "expo-haptics";

export const HapticPressable = forwardRef<View, PressableProps>(function HapticPressable({ onPress, ...props }, ref) {
  return (
    <Pressable
      ref={ref}
      {...props}
      onPress={(event) => {
        if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
    />
  );
});
