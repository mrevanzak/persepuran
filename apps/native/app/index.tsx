import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useCurrentLocation } from "@/lib/use-current-location";
import { orpc } from "@/utils/orpc";

export default function HomeScreen() {
  useCurrentLocation();

  const { data: routes } = useQuery(orpc.train.routes.queryOptions());
  const { data: stations } = useQuery(orpc.train.getStations.queryOptions());

  return (
    <MapView
      followsUserLocation
      mapType="hybridFlyover"
      showsCompass={false}
      showsUserLocation
      style={StyleSheet.absoluteFill}
    >
      {routes?.map(({ id, coordinates }) => (
        <Polyline
          coordinates={coordinates}
          key={id}
          strokeColor="#000"
          strokeWidth={2}
        />
      ))}
      {stations?.map((station) => (
        <Marker
          coordinate={{ latitude: station.pos[0], longitude: station.pos[1] }}
          description={station.cd}
          key={station.st_id}
          title={station.nm}
          useLegacyPinView
        />
      ))}
    </MapView>
  );
}
