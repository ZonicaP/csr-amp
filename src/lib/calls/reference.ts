export function formatCallReference(value: number) {
  if (!Number.isInteger(value) || value < 10000 || value > 99999) {
    throw new Error("Call reference is out of range");
  }
  return `C-${value}`;
}

export function randomCallReference(random: () => number = Math.random) {
  return formatCallReference(10000 + Math.floor(random() * 90000));
}
