/**
 * A batch's failures are structural, not a taxonomy: every photo that won't decode or
 * segment collapses to the same sentence, because what the user needs to know is which
 * file, not the model-level reason it failed. Kept as a function, not a literal, so the
 * one sentence lives in one place.
 */
export function describeRemoveFailure(name: string): string {
  return `${name} couldn't be processed — try another photo`;
}
