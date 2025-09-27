import { useEffect, useRef } from "react";
import type MapView from "react-native-maps";
import type { Region } from "react-native-maps";
import {
  EPSILON_COORD_DIFF,
  FOCUS_ANIM_DURATION_MS,
  FOCUS_REGION_DELTA,
} from "../constants";
import type { ProjectedTrain } from "../utils/train-projection";

export function useFocusOnTrain(
  mapRef: React.RefObject<MapView | null>,
  focusedTrain: ProjectedTrain | null
) {
  const previousFocusPosition = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!(focusedTrain && mapRef.current)) {
      previousFocusPosition.current = null;
      return;
    }
    const { latitude, longitude } = focusedTrain.position;
    const previous = previousFocusPosition.current;
    if (
      previous &&
      Math.abs(previous.latitude - latitude) < EPSILON_COORD_DIFF &&
      Math.abs(previous.longitude - longitude) < EPSILON_COORD_DIFF
    ) {
      return;
    }
    previousFocusPosition.current = { latitude, longitude };
    const region: Region = {
      latitude,
      longitude,
      latitudeDelta: FOCUS_REGION_DELTA,
      longitudeDelta: FOCUS_REGION_DELTA,
    };
    mapRef.current.animateToRegion(region, FOCUS_ANIM_DURATION_MS);
  }, [focusedTrain, mapRef]);
}
