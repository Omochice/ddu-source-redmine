import { ensure } from "jsr:@core/unknownutil@4.3.0";
import { mayHasCommand } from "./type.ts";

/**
 * Get edit command
 */
export function getEditCommand(
  actionParams: unknown,
  kindParams: unknown,
): string {
  return ensure(actionParams, mayHasCommand).command ??
    ensure(kindParams, mayHasCommand).command ?? "edit";
}
