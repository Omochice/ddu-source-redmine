import {
  ActionFlags,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.8.1/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.8.1/deps.ts";
import { define } from "https://deno.land/x/denops_std@v5.1.0/autocmd/mod.ts";
import { register } from "https://deno.land/x/denops_std@v5.1.0/lambda/mod.ts";
import { type BufferOption, prepareBuffer } from "../prepareBuffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@0.7.0/issues/update.ts";
import { isItem } from "../type.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.11.0/mod.ts";
import { getEditCommand } from "../getEditCommand.ts";

const bufopts: BufferOption = {
  buftype: "nofile",
  bufhidden: "delete",
  swapfile: false,
  filetype: "markdown",
} as const;

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

  const bufname = `ddu-source-redmine_#${item.issue.id}-description`;
  const bufnr = await prepareBuffer(denops, bufname, bufopts);
  await fn.setbufline(
    denops,
    bufnr,
    1,
    (item.issue.description ?? "").split(/\r?\n/),
  );

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
