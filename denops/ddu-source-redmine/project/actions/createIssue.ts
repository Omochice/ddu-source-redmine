import {
  type Action,
  type ActionCallback,
  ActionFlags,
  type DduItem,
} from "jsr:@shougo/ddu-vim@11.1.0/types";
import type { Denops } from "jsr:@denops/std@7.5.0";
import { isItem, type Item, type Params } from "../type.ts";
import { join } from "jsr:@std/url@0.225.1/join";

const callback: ActionCallback<Params> = async (args: {
  denops: Denops;
  kindParams: unknown;
  actionParams: unknown;
  items: DduItem[];
}): Promise<ActionFlags> => {
  const { items } = args;
  const item = items.at(0);
  if (item == null) {
    console.error("hi");
    return ActionFlags.Persist;
  }

  if (!isItem(item.action)) {
    console.error("ho");
    return ActionFlags.None;
  }

  // NOTE:
  // - 1. open buffer
  // - 1. load the templates
  // - 1. register templates data to buffer variable
  // - 1. default template(exists?) apply buffer

  console.log(item);
  return ActionFlags.None;
};

export const createIssue = {
  description: "Create Issue",
  callback,
} as const satisfies Action<never>;
