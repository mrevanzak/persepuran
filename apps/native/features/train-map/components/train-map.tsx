import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import MapView, {
  AnimatedRegion,
  Marker,
  MarkerAnimated,
  Polyline,
} from "react-native-maps";
import { useFocusOnTrain } from "@/features/train-map/hooks/use-focus-on-train";
import { useTrainMapData } from "@/features/train-map/hooks/use-train-map-data";
import { MARKER_CENTER_OFFSET_X, MARKER_CENTER_OFFSET_Y } from "../constants";

export function TrainMap() {
  const { routes, stations, liveTrains } = useTrainMapData();
  const mapRef = useRef<MapView | null>(null);
  const [focusedTrainId, setFocusedTrainId] = useState<number | null>(null);
  const animatedRegionsRef = useRef(new Map<number, AnimatedRegion>());
  const markerRefs = useRef(new Map<number, MarkerAnimated | null>());
  const previousPositionsRef = useRef(
    new Map<number, { latitude: number; longitude: number }>()
  );
  const getOrCreateAnimatedRegion = useCallback(
    (trainId: number, latitude: number, longitude: number): AnimatedRegion => {
      const animatedRegions = animatedRegionsRef.current;
      let region = animatedRegions.get(trainId);

      if (!region) {
        region = new AnimatedRegion({ latitude, longitude });
        animatedRegions.set(trainId, region);
      }

      return region;
    },
    []
  );

  const focusedTrain = useMemo(
    () => liveTrains?.find((train) => train.id === focusedTrainId) ?? null,
    [focusedTrainId, liveTrains]
  );

  useFocusOnTrain(mapRef, focusedTrain);

  useEffect(() => {
    if (!liveTrains) {
      return;
    }

    const previousPositions = previousPositionsRef.current;
    const animatedRegions = animatedRegionsRef.current;
    const currentTrainIds = new Set<number>();
    const animationDuration = 500;

    liveTrains.forEach((train) => {
      currentTrainIds.add(train.id);

      const previousPosition = previousPositions.get(train.id);
      const hasPositionChanged =
        !previousPosition ||
        previousPosition.latitude !== train.position.latitude ||
        previousPosition.longitude !== train.position.longitude;

      const { latitude, longitude } = train.position;
      const region = getOrCreateAnimatedRegion(train.id, latitude, longitude);

      if (!hasPositionChanged) {
        return;
      }

      previousPositions.set(train.id, {
        latitude,
        longitude,
      });

      if (Platform.OS === "android") {
        const marker = markerRefs.current.get(train.id);
        marker?.animateMarkerToCoordinate(train.position, animationDuration);
      } else {
        region?.timing({
          latitude,
          longitude,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();
      }
    });

    Array.from(animatedRegions.keys()).forEach((trainId) => {
      if (!currentTrainIds.has(trainId)) {
        animatedRegions.delete(trainId);
      }
    });

    Array.from(previousPositions.keys()).forEach((trainId) => {
      if (!currentTrainIds.has(trainId)) {
        previousPositions.delete(trainId);
      }
    });

    Array.from(markerRefs.current.keys()).forEach((trainId) => {
      if (!currentTrainIds.has(trainId)) {
        markerRefs.current.delete(trainId);
      }
    });
  }, [getOrCreateAnimatedRegion, liveTrains]);

  return (
    <MapView
      mapType="hybridFlyover"
      ref={mapRef}
      showsCompass={false}
      showsUserLocation
      style={StyleSheet.absoluteFill}
    >
      {routes &&
        Object.entries(routes).map(([id, route]) => (
          <Polyline
            coordinates={route.coordinates}
            key={id}
            lineCap="round"
            lineJoin="round"
            strokeColor="blue"
            strokeWidth={4}
          />
        ))}
      {stations &&
        Object.entries(stations).map(([id, station]) => (
          <Marker
            coordinate={station.coordinates}
            description={station.cd}
            key={id}
            pinColor="#facc15"
            title={station.nm}
            useLegacyPinView
          />
        ))}
      {liveTrains?.map((train) => {
        const { latitude, longitude } = train.position;
        const animatedRegion = getOrCreateAnimatedRegion(
          train.id,
          latitude,
          longitude
        );

        return (
          <MarkerAnimated
            calloutOffset={{
              y: -48,
              x: 0,
            }}
            centerOffset={{
              y: MARKER_CENTER_OFFSET_Y,
              x: MARKER_CENTER_OFFSET_X,
            }}
            coordinate={
              Platform.OS === "android"
                ? train.position
                : animatedRegion
            }
            description={`${train.code} • ${
              train.moving ? "On the move" : "At station"
            }`}
            key={train.id}
            onDeselect={() => setFocusedTrainId(null)}
            onSelect={() => setFocusedTrainId(train.id)}
            pinColor={train.moving ? "#22c55e" : "#0ea5e9"}
            ref={(marker) => {
              if (marker) {
                markerRefs.current.set(train.id, marker);
              } else {
                markerRefs.current.delete(train.id);
              }
            }}
            title={train.name}
          />
        );
      })}
    </MapView>
  );
}
