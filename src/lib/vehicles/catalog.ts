import { unstable_cache } from "next/cache";
import { displayVehicleName } from "@/lib/vehicles/names";

const month = 60 * 60 * 24 * 30;
const vpic = "https://vpic.nhtsa.dot.gov/api/vehicles";

type Named = { Make_Name?: string; MakeName?: string; Model_Name?: string };
type VpicResponse = { Results?: Named[] };

const passengerTypes = ["car", "truck", "multipurpose passenger vehicle"];

async function vpicNames(path: string, field: "make" | "model") {
  const response = await fetch(`${vpic}/${path}${path.includes("?") ? "&" : "?"}format=json`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Vehicle catalog is unavailable");
  const body = (await response.json()) as VpicResponse;
  const names = new Set<string>();
  for (const row of body.Results ?? []) {
    const value = field === "make" ? row.Make_Name ?? row.MakeName : row.Model_Name;
    if (!value) continue;
    const name = displayVehicleName(value);
    if (name.length > 0) names.add(name);
  }
  return [...names].sort((left, right) => left.localeCompare(right));
}

async function passengerMakes() {
  const lists = await Promise.all(passengerTypes.map((type) => vpicNames(`GetMakesForVehicleType/${encodeURIComponent(type)}`, "make")));
  return [...new Set(lists.flat())].sort((left, right) => left.localeCompare(right));
}

export const vehicleMakes = unstable_cache(passengerMakes, ["vpic-makes-passenger"], { revalidate: month });

export const vehicleModels = unstable_cache(
  async (make: string, year: string) => {
    const encoded = encodeURIComponent(make.trim());
    const path = year
      ? `GetModelsForMakeYear/make/${encoded}/modelyear/${encodeURIComponent(year)}`
      : `GetModelsForMake/${encoded}`;
    return vpicNames(path, "model");
  },
  ["vpic-models"],
  { revalidate: month },
);
