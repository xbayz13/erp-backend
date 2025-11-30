export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

export function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloatBetween(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateReference(prefix: string, index: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const seq = String(index).padStart(4, '0');
  return `${prefix}-${year}${month}${day}-${seq}`;
}

