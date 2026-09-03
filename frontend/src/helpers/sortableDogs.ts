import type { ItemInterface } from "react-sortablejs";
import { Dog } from "./types";

export interface MatchedSortableDog {
  dog: Dog;
  index: number;
}

// Pairs each react-sortablejs `item` with its matching `Dog`, dropping any
// item whose id isn't (yet) found in `dogs` - this happens for one render
// whenever the sortable's local `items` state (kept in sync via a `useEffect`,
// which runs a tick *after* render/commit) hasn't caught up with a fresh
// `dogs` prop yet, e.g. right after an SSE-driven add/remove.
//
// Never return a placeholder/null entry for an unmatched item and let the
// caller `.map()` it to `null`: react-sortablejs clones each child internally
// via `React.cloneElement`, which throws `Cannot read properties of null
// (reading 'props')` on a `null` child - unlike React's own children
// reconciliation, which tolerates `null` children fine. Filtering here, before
// any JSX is built, is what actually prevents that crash - see
// TeamDogsEditor.tsx / LineupDogsOrder.tsx, both of which hit this in
// production (once on remove, once on add).
export const matchSortableDogs = (
  items: ItemInterface[],
  dogs: Dog[]
): MatchedSortableDog[] =>
  items
    .map((item, index) => ({ dog: dogs.find(({ _id }) => _id === item.id), index }))
    .filter((entry): entry is MatchedSortableDog => !!entry.dog);
