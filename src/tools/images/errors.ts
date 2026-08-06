/**
 * A batch's failures are structural, not a taxonomy: every file that won't decode or
 * encode collapses to the same sentence, because what the user needs to know is which
 * file, not the codec-level reason it failed. Kept as a function, not a literal, so the
 * one sentence lives in one place.
 */
export function describeConvertFailure(name: string): string {
  return `${name} couldn't convert — try another file`;
}
