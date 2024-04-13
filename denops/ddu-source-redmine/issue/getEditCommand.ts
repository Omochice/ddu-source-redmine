import { ensure } from "https://deno.land/x/unknownutil@v3.17.3/mod.ts";
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
