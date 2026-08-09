import type { CleanupOptions } from './types';

export const SAMPLE_EDIT_TEXT = `  Tooldo   is a suite of free tools  that run entirely  in your browser.


  Nothing you drop or type   ever leaves your device — there's no   server, no upload, and no account.


  Every tool works   the same way: add something,  adjust a few options,  and watch the result update  live.  `;

export const SAMPLE_CLEANUP: CleanupOptions = {
  trimLines: true,
  collapseSpaces: true,
  collapseBlankLines: true,
  trimEdges: true,
};

export const SAMPLE_ORIGINAL = `The quarterly report covers three regions.
Revenue grew eight percent year over year.
The team plans to expand into two new markets.
Customer feedback has been mostly positive.`;

export const SAMPLE_CHANGED = `The quarterly report covers four regions.
Revenue grew twelve percent year over year.
The team plans to expand into two new markets.
Customer feedback has been overwhelmingly positive.
A follow-up review is scheduled for next quarter.`;
