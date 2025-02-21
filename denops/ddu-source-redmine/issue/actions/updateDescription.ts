import { ActionFlags, type DduItem } from "jsr:@shougo/ddu-vim@5.0.0/types";
import { type Denops } from "jsr:@denops/std@7.4.0";
import * as fn from "jsr:@denops/std@7.4.0/function";
import { define } from "jsr:@denops/std@7.4.0/autocmd";
import { batch } from "jsr:@denops/std@7.4.0/batch";
import { register } from "jsr:@denops/std@7.4.0/lambda";
import { format } from "jsr:@denops/std@7.4.0/bufname";
import { filetype, modified } from "jsr:@denops/std@7.4.0/option";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@v0.10.0/issues/update.ts";
import { isItem } from "../type.ts";
import { assert, is } from "jsr:@core/unknownutil@4.3.0";
import { getEditCommand } from "../getEditCommand.ts";

export async function updateDescription(args: {
  denops: Denops;
  actionParams: unknown;
  kindParams: unknown;
  items: DduItem[];
}) {
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

    const id = register(d, async (lines: unknown) => {
      assert(lines, is.ArrayOf(is.String));
      await updateIssue(
        item.issue.id,
        { description: lines.join("\n").trim() },
        item,
      );
    }, { once: true });

    const command = getEditCommand(actionParams, kindParams);

    await d.cmd(`${command} +buffer${bufnr}`);
    await define(
      d,
      "BufWinLeave",
      bufname,
      `call denops#notify('${d.name}', '${id}', [getbufline(${bufnr}, 1, '$')])`,
      {
        once: true,
      },
    );
  });

  return ActionFlags.None;
}
