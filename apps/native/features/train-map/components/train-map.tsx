import { StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import type { ProjectedTrain, Routes, Stations } from "../train-projection";

type TrainMapProps = {
  routes?: Routes;
  stations?: Stations;
  liveTrains?: ProjectedTrain[] | null;
};

export function TrainMap({ routes, stations, liveTrains }: TrainMapProps) {
  return (
    <MapView
      followsUserLocation
      mapType="hybridFlyover"
      showsCompass={false}
      showsUserLocation
      style={StyleSheet.absoluteFill}
    >
      {routes &&
        Object.entries(routes).map(([id, route]) => (
          <Polyline
            coordinates={route.coordinates}
            key={id}
            strokeColor="#000"
            strokeWidth={2}
          />
        ))}

      {stations &&
        Object.entries(stations).map(([id, station]) => (
          <Marker
            coordinate={station.coordinates}
            description={station.cd}
            key={id}
            title={station.nm}
            useLegacyPinView
          />
        ))}

      {liveTrains?.map((train) => (
        <Marker
          coordinate={train.position}
          description={train.code}
          key={train.id}
          title={train.name}
        />
      ))}
    </MapView>
  );
}
