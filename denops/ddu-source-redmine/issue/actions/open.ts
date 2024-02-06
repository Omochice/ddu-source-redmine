import {
  ActionFlags,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.10.2/types.ts";
import { Denops } from "https://deno.land/x/ddu_vim@v3.10.2/deps.ts";
import { isItem, type Item } from "../type.ts";
import { join } from "https://deno.land/std@0.214.0/url/join.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.15.0/mod.ts";

const mayHasBrowserCommand = is.ObjectOf({
  browserCommand: is.OptionalOf(is.String),
});

function issueUrl(issueItem: Item): URL {
  return join(issueItem.endpoint, "issues", `${issueItem.issue.id}`);
}

function getExternalBrowserCommand(): string | undefined {
  const os = Deno.build.os;
  if (os === "windows") {
    return "explorer";
  }
  if (os === "darwin") {
    return "open";
  }
  if (os === "linux") {
    return "sensible-browser";
  }
  return undefined;
}

function getBrowserCommand(
  actionParams: unknown,
  kindParams: unknown,
): string | undefined {
  return ensure(actionParams, mayHasBrowserCommand).browserCommand ??
    ensure(kindParams, mayHasBrowserCommand).browserCommand;
}

export async function openBrowser(args: {
  denops: Denops;
  kindParams: unknown;
  actionParams: unknown;
  items: DduItem[];
}): Promise<ActionFlags> {
  const { denops, items, actionParams, kindParams } = args;
  if (items.length !== 1) {
    return ActionFlags.Persist;
  }

  const item = items[0]?.action;
  if (!isItem(item)) {
    return ActionFlags.None;
  }

  const url = issueUrl(item);

  const userCommand = getBrowserCommand(actionParams, kindParams);
  if (userCommand !== undefined) {
    await denops.call(userCommand, url.href);
    return ActionFlags.None;
  }

  const externalCommand = getExternalBrowserCommand();
  if (externalCommand === undefined) {
    console.error("ERROR");
    return ActionFlags.None;
  }

  new Deno.Command(externalCommand, {
    args: [url.href],
    stdout: "null",
    stderr: "null",
  }).spawn();
  return ActionFlags.None;
}
