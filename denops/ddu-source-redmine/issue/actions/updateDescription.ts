import {
  ActionFlags,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.10.3/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.10.3/deps.ts";
import { define } from "https://deno.land/x/denops_std@v6.4.0/autocmd/mod.ts";
import { register } from "https://deno.land/x/denops_std@v6.4.0/lambda/mod.ts";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@0.7.0/issues/update.ts";
import { isItem } from "../type.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.17.3/mod.ts";
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

  const bufname = `redmine:///description#${item.issue.id}`;
  const bufnr = await prepareUnwritableBuffer(denops, bufname);
  await fn.setbufline(
    denops,
    bufnr,
    1,
    (item.issue.description ?? "").split(/\r?\n/),
  );
  await fn.setbufvar(denops, bufnr, "&filetype", "markdown");
  await fn.setbufvar(denops, bufnr, "&modified", false);

  const id = register(denops, async (lines: unknown) => {
    assert(lines, is.ArrayOf(is.String));
    await updateIssue(
      item.issue.id,
      { description: lines.join("\n").trim() },
      item,
    );
  }, { once: true });

  const command = getEditCommand(actionParams, kindParams);

  await denops.cmd(`${command} +buffer${bufnr}`);
  await define(
    denops,
    "BufWinLeave",
    bufname,
    `call denops#notify('${denops.name}', '${id}', [getbufline(${bufnr}, 1, '$')])`,
    {
      once: true,
    },
  );

  return ActionFlags.None;
}
