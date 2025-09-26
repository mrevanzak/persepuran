import { StyleSheet } from "react-native";
import MapView from "react-native-maps";

export default function HomeScreen() {
  return (
    <MapView
      followsUserLocation
      mapType="hybridFlyover"
      showsCompass={false}
      showsUserLocation
      style={StyleSheet.absoluteFill}
    />
  );
}
