import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * false while rendering on the server and while hydrating, true afterwards.
 * Use it for anything the server cannot know (e.g. whether the browser holds a sign-in token),
 * so the first browser render matches the server HTML and React reports no hydration mismatch.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
