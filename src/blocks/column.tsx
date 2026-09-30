import { createContext, useContext } from "react";

/**
 * Which column a block is being rendered in.
 *
 * Container queries already handle *size* — a grid drops to one column when
 * the box is narrow, whatever the window is doing. This carries the other
 * half: the decisions that are not about width but about role. A call to
 * action in a narrow rail wants its button on its own line and its padding
 * trimmed; an award beside the content is a note, not the centrepiece.
 *
 * Blocks that do not care simply never read it.
 */
export type BlockColumn = "main" | "side";

const BlockColumnContext = createContext<BlockColumn>("main");

export const BlockColumnProvider = BlockColumnContext.Provider;

export function useBlockColumn(): BlockColumn {
  return useContext(BlockColumnContext);
}

/** `true` in the narrow side column — the common test, spelled once. */
export function useIsSideColumn(): boolean {
  return useBlockColumn() === "side";
}
