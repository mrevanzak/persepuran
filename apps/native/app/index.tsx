import { TrainMap } from "@/features/train-map/components/train-map";
import { useCurrentLocation } from "@/lib/use-current-location";

export default function HomeScreen() {
  useCurrentLocation();

  return <TrainMap />;
}
