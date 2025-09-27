import { useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, MarkerAnimated, Polyline } from "react-native-maps";
import { useFocusOnTrain } from "@/features/train-map/hooks/use-focus-on-train";
import { useTrainMapData } from "@/features/train-map/hooks/use-train-map-data";
import { MARKER_CENTER_OFFSET_X, MARKER_CENTER_OFFSET_Y } from "../constants";

export function TrainMap() {
  const { routes, stations, liveTrains } = useTrainMapData();
  const mapRef = useRef<MapView | null>(null);
  const [focusedTrainId, setFocusedTrainId] = useState<number | null>(null);

  const focusedTrain = useMemo(
    () => liveTrains?.find((train) => train.id === focusedTrainId) ?? null,
    [focusedTrainId, liveTrains]
  );

  useFocusOnTrain(mapRef, focusedTrain);

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
      {liveTrains?.map((train) => (
        <MarkerAnimated
          calloutOffset={{
            y: -48,
            x: 0,
          }}
          centerOffset={{
            y: MARKER_CENTER_OFFSET_Y,
            x: MARKER_CENTER_OFFSET_X,
          }}
          coordinate={train.position}
          description={`${train.code} • ${train.moving ? "On the move" : "At station"}`}
          key={train.id}
          onDeselect={() => setFocusedTrainId(null)}
          onSelect={() => setFocusedTrainId(train.id)}
          pinColor={train.moving ? "#22c55e" : "#0ea5e9"}
          title={train.name}
        />
      ))}
    </MapView>
  );
}
