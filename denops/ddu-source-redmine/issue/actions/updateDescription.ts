import {
  ActionFlags,
  DduItem,
} from "https://deno.land/x/ddu_vim@v5.0.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v5.0.0/deps.ts";
import { define } from "https://deno.land/x/denops_std@v6.5.1/autocmd/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.5.1/batch/mod.ts";
import { register } from "https://deno.land/x/denops_std@v6.5.1/lambda/mod.ts";
import { format } from "https://deno.land/x/denops_std@v6.5.1/bufname/mod.ts";
import {
  filetype,
  modified,
} from "https://deno.land/x/denops_std@v6.5.1/option/mod.ts";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@v0.10.0/issues/update.ts";
import { isItem } from "../type.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.18.1/mod.ts";
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
    await filetype.setBuffer(d, bufnr, "toml");
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
