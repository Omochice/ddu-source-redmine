import {
  type Action,
  type ActionCallback,
  ActionFlags,
  type DduItem,
} from "jsr:@shougo/ddu-vim@10.3.0/types";
import type { Denops } from "jsr:@denops/std@7.6.0";
import { isItem, type Item, type Params } from "../type.ts";
import { join } from "jsr:@std/url@0.225.1/join";
import { systemopen } from "jsr:@lambdalisue/systemopen@1.0.0";

function issueUrl(issueItem: Item): URL {
  return join(issueItem.endpoint, "issues", `${issueItem.issue.id}`);
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
