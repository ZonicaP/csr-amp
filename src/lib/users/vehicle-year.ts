export const oldestVehicleYear = 1980;

export function newestVehicleYear(now = new Date()) {
  return now.getFullYear() + 1;
}

export function vehicleYears(now = new Date()) {
  const newest = newestVehicleYear(now);
  return Array.from({ length: newest - oldestVehicleYear + 1 }, (_, index) => String(newest - index));
}
