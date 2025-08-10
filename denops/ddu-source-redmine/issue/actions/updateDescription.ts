import {
  type Action,
  type ActionCallback,
  ActionFlags,
  type DduItem,
} from "jsr:@shougo/ddu-vim@10.4.0/types";
import { type Denops } from "jsr:@denops/std@7.6.0";
import * as fn from "jsr:@denops/std@7.6.0/function";
import { define } from "jsr:@denops/std@7.6.0/autocmd";
import { batch } from "jsr:@denops/std@7.6.0/batch";
import { add } from "jsr:@denops/std@7.6.0/lambda";
import { expr } from "jsr:@denops/std@7.6.0/eval";
import { format } from "jsr:@denops/std@7.6.0/bufname";
import { filetype, modified } from "jsr:@denops/std@7.6.0/option";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@v0.10.0/issues/update.ts";
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
    expr: "/description",
    fragment: `${item.issue.id}`,
  });
  const bufnr = await prepareUnwritableBuffer(denops, bufname);

  await batch(denops, async (d) => {
    await fn.setbufline(
      d,
      bufnr,
      1,
      (item.issue.description ?? "").split(/\r?\n/),
    );
    await filetype.setBuffer(d, bufnr, "markdown");
    await modified.setBuffer(d, bufnr, false);

    const lambda = add(d, async (lines: unknown) => {
      assert(lines, is.ArrayOf(is.String));
      await updateIssue(
        item.issue.id,
        { description: lines.join("\n").trim() },
        item,
      );
    });

    const command = getEditCommand(actionParams, kindParams);

    await d.cmd(`${command} +buffer${bufnr}`);
    await define(
      d,
      "BufWinLeave",
      bufname,
      `call ${lambda.request(expr`getbufline(${bufnr}, 1, '$')`)}`,
      {
        once: true,
      },
    );
  });

  return ActionFlags.None;
};

export const updateDescription = {
  description: "Update description of this issue",
  callback,
} as const satisfies Action<never>;
