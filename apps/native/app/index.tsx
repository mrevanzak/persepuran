import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { useCurrentLocation } from "@/lib/use-current-location";
import { orpc } from "@/utils/orpc";

export default function HomeScreen() {
  const { data } = useQuery(orpc.train.routes.queryOptions());
  const { data: location } = useCurrentLocation();

  return (
    <MapView
      followsUserLocation
      mapType="hybridFlyover"
      showsCompass={false}
      showsUserLocation
      style={StyleSheet.absoluteFill}
    >
      {data?.map(({ id, coordinates }) => (
        <Polyline
          coordinates={coordinates}
          key={id}
          strokeColor="#000"
          strokeWidth={2}
        />
      ))}
    </MapView>
  );
}
