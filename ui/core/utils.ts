// Returns if the two items are equal, or if both are null / undefined.
export function equalsOrBothNull<T>(a: T, b: T, comparator?: (_a: NonNullable<T>, _b: NonNullable<T>) => boolean): boolean {
  if (a == null && b == null)
    return true;

  if (a == null || b == null)
    return false;

  return (comparator || ((_a: NonNullable<T>, _b: NonNullable<T>) => a == b))(a!, b!);
}

export function sum(arr: Array<number>): number {
  return arr.reduce((total, cur) => total + cur, 0);
}

// Returns a new array containing only elements present in both a and b.
export function intersection<T>(a: Array<T>, b: Array<T>): Array<T> {
  return a.filter(value => b.includes(value));
}

export function stDevToConf90(stDev: number, N: number) {
  return 1.645 * stDev / Math.sqrt(N);
}

export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Only works for numeric enums
export function getEnumValues<E>(enumType: any): Array<E> {
  return Object.keys(enumType)
      .filter(key => !isNaN(Number(enumType[key])))
      .map(key => parseInt(enumType[key]) as unknown as E);
}

// Whether a click event was a right click.
export function isRightClick(event: MouseEvent): boolean {
  return event.button == 2;
}