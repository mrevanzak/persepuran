import { TrainMap } from "@/features/train-map/components/train-map";
import { useTrainMapData } from "@/features/train-map/use-train-map-data";
import { useCurrentLocation } from "@/lib/use-current-location";

export default function HomeScreen() {
  useCurrentLocation();

  const { routes, stations, liveTrains } = useTrainMapData();

  return (
    <TrainMap liveTrains={liveTrains} routes={routes} stations={stations} />
  );
}
