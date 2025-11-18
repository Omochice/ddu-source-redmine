import {
  type Action,
  type ActionCallback,
  ActionFlags,
  type DduItem,
} from "jsr:@shougo/ddu-vim@11.1.0/types";
import type { Denops } from "jsr:@denops/std@8.2.0";
import { isItem, type Item, type Params } from "../type.ts";
import { join } from "jsr:@std/path@1.1.3/posix";
import { systemopen } from "jsr:@lambdalisue/systemopen@1.0.0";

function issueUrl(issueItem: Item): URL {
  return new URL(join(issueItem.endpoint, "issues", `${issueItem.issue.id}`));
}

const callback: ActionCallback<Params> = async (args: {
  denops: Denops;
  kindParams: unknown;
  actionParams: unknown;
  items: DduItem[];
}): Promise<ActionFlags> => {
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
};

export const openBrowser = {
  description: "Open this issue on browser",
  callback,
} as const satisfies Action<never>;
