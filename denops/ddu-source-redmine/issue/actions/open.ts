import {
  ActionFlags,
  DduItem,
} from "https://deno.land/x/ddu_vim@v4.0.0/types.ts";
import { Denops } from "https://deno.land/x/ddu_vim@v4.0.0/deps.ts";
import { isItem, type Item } from "../type.ts";
import { join } from "https://deno.land/std@0.224.0/url/join.ts";
import { systemopen } from "https://deno.land/x/systemopen@v1.0.0/mod.ts";

function issueUrl(issueItem: Item): URL {
  return join(issueItem.endpoint, "issues", `${issueItem.issue.id}`);
}

export async function openBrowser(args: {
  denops: Denops;
  kindParams: unknown;
  actionParams: unknown;
  items: DduItem[];
}): Promise<ActionFlags> {
  const { items } = args;
  if (items.length !== 1) {
    return ActionFlags.Persist;
  }

  const item = items[0]?.action;
  if (!isItem(item)) {
    return ActionFlags.None;
  }

  const url = issueUrl(item);

  await systemopen(url.href);
  return ActionFlags.None;
}
