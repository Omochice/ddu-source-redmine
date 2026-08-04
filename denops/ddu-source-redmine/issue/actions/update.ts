import {
  type Action,
  type ActionCallback,
  ActionFlags,
  type DduItem,
} from "jsr:@shougo/ddu-vim@11.3.0/types";
import type { Denops } from "jsr:@denops/std@8.2.0";
import * as fn from "jsr:@denops/std@8.2.0/function";
import { parse, stringify } from "jsr:@std/toml@1.0.11";
import { define } from "jsr:@denops/std@8.2.0/autocmd";
import { echoerr } from "jsr:@denops/std@8.2.0/helper";
import { add } from "jsr:@denops/std@8.2.0/lambda";
import { expr } from "jsr:@denops/std@8.2.0/eval";
import { format } from "jsr:@denops/std@8.2.0/bufname";
import { filetype, modified } from "jsr:@denops/std@8.2.0/option";
import { fromThrowable, ResultAsync } from "npm:neverthrow@8.2.0";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { updateIssue } from "../../redmine.ts";
import { isItem, type Params } from "../type.ts";
import { assert, is } from "jsr:@core/unknownutil@4.3.0";
import { getEditCommand } from "../getEditCommand.ts";

const callback: ActionCallback<Params> = async (args: {
  denops: Denops;
  actionParams: unknown;
  kindParams: unknown;
  items: DduItem[];
}): Promise<ActionFlags> => {
  const { denops, items, kindParams, actionParams } = args;
  if (items.length !== 1) {
    return ActionFlags.Persist;
  }

  const item = items[0]?.action;
  if (!isItem(item)) {
    return ActionFlags.None;
  }

  const bufname = format({
    scheme: "redmine",
    expr: "/update",
    fragment: `${item.issue.id}`,
  });
  const bufnr = await prepareUnwritableBuffer(denops, bufname);
  const fillBuffer = ResultAsync.fromThrowable(
    async (lines: string[]) => {
      await fn.setbufline(denops, bufnr, 1, lines);
      await filetype.setBuffer(denops, bufnr, "toml");
      await modified.setBuffer(denops, bufnr, false);
    },
    () => `Failed to prepare the buffer for issue #${item.issue.id}`,
  );
  const prepared = await fromThrowable(() => stringify(item.issue))()
    .mapErr(() => "Convert Error: the issue cannot convert to toml format")
    .asyncAndThen((toml) => fillBuffer(toml.split(/\r?\n/)));
  if (prepared.isErr()) {
    await echoerr(denops, prepared.error);
    return ActionFlags.None;
  }

  const lambda = add(denops, async (lines: unknown) => {
    assert(lines, is.ArrayOf(is.String));
    const text = lines.join("\n");
    await fromThrowable(() => parse(text))()
      .mapErr(() => `Content is invalid toml format: ${text}`)
      .asyncAndThen((content) =>
        updateIssue(item, item.issue.id, content).mapErr((cause) =>
          `Failed to update issue #${item.issue.id}: ${cause}`
        )
      )
      .match(() => {}, (message) => echoerr(denops, message));
  });

  const command = getEditCommand(actionParams, kindParams);

  await denops.cmd(`${command} +buffer${bufnr}`);
  await define(
    denops,
    "BufWinLeave",
    bufname,
    `call ${lambda.request(expr`getbufline(${bufnr}, 1, '$')`)}`,
    {
      once: true,
    },
  );

  return ActionFlags.None;
};

export const update = {
  description: "Update properties of this issue",
  callback,
} as const satisfies Action<never>;
