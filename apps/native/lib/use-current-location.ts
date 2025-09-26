import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";

export function useCurrentLocation() {
  return useQuery({
    queryKey: ["current-location"],
    queryFn: async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        throw new Error("Permission to access location was denied");
      }
      const location = await Location.getCurrentPositionAsync();
      return location;
    },
  });
}
