import { useCallback } from "react";
import { type LatLng, MapMarker } from "react-native-maps";
import Animated, {
  Easing,
  type EasingFunction,
  type EasingFunctionFactory,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface AnimateOptions extends LatLng {
  duration?: number;
  easing?: EasingFunction | EasingFunctionFactory;
}

export const useAnimatedRegion = (location: Partial<LatLng> = {}) => {
  const latitute = useSharedValue(location.latitude);
  const longitude = useSharedValue(location.longitude);

  const animatedProps = useAnimatedProps(() => ({
    coordinate: {
      latitude: latitute.value ?? 0,
      longitude: longitude.value ?? 0,
    },
  }));

  const animate = useCallback(
    (options: AnimateOptions) => {
      const { duration = 500, easing = Easing.inOut(Easing.ease) } = options;

      const animateValue = (
        value: SharedValue<number | undefined>,
        toValue?: number
      ) => {
        if (!toValue) {
          return;
        }

        value.value = withTiming(toValue, {
          duration,
          easing,
        });
      };

      animateValue(latitute, options.latitude);
      animateValue(longitude, options.longitude);
    },
    [latitute, longitude]
  );

  return {
    props: animatedProps,
    animate,
  };
};

export const AnimatedMarker = Animated.createAnimatedComponent(MapMarker);
