const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";

export function georgiaPlate(index: number) {
  const size = letters.length;
  const first = letters[index % size];
  const second = letters[Math.floor(index / size) % size];
  const third = letters[Math.floor(index / (size * size)) % size];
  const digits = String((index * 137 + 4821) % 10000).padStart(4, "0");
  return `${first}${second}${third}${digits}`;
}

export function parsePlate(input: string): { value: string } | { error: string } {
  const plate = input.toUpperCase().replace(/[\s-]/g, "");
  if (!/^[A-Z0-9]{1,7}$/.test(plate)) return { error: "Enter a plate with 1 to 7 letters or numbers" };
  return { value: plate };
}
