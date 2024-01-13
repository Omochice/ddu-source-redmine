import { ensure } from "https://deno.land/x/unknownutil@v3.14.1/mod.ts";
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
