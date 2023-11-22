import {
  ActionFlags,
  Context,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.6.0/deps.ts";
import { parse, stringify } from "https://deno.land/std@0.207.0/toml/mod.ts";
import { define } from "https://deno.land/x/denops_std@v5.0.2/autocmd/mod.ts";
import { echoerr } from "https://deno.land/x/denops_std@v5.0.2/helper/mod.ts";
import { register } from "https://deno.land/x/denops_std@v5.0.2/lambda/mod.ts";
import { type BufferOption, prepareBuffer } from "../prepareBuffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@0.7.0/issues/update.ts";
import { isItem } from "../type.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.10.0/mod.ts";
import { getEditCommand } from "../getEditCommand.ts";

const bufopts: BufferOption = {
  buftype: "nofile",
  bufhidden: "delete",
  swapfile: false,
  filetype: "toml",
} as const;

export async function update(args: {
  denops: Denops;
  context: Context;
  actionParams: unknown;
  kindParams: unknown;
  items: DduItem[];
}): Promise<ActionFlags> {
  const { denops, items } = args;
  if (items.length !== 1) {
    return ActionFlags.Persist;
  }

  const item = items[0]?.action;
  if (!isItem(item)) {
    return ActionFlags.None;
  }

  const bufname = `ddu-source-redmine_#${item.issue.id}-update`;
  const bufnr = await prepareBuffer(denops, bufname, bufopts);
  try {
    await fn.setbufline(
      denops,
      bufnr,
      1,
      stringify(item.issue).split(/\r?\n/),
    );
  } catch {
    echoerr(denops, "Convert Error: the issue cannot convert to toml format");
    return ActionFlags.None;
  }

  const id = register(denops, async (lines: unknown) => {
    assert(lines, is.ArrayOf(is.String));
    try {
      const content = parse(lines.join("\n"));
      await updateIssue(
        item.issue.id,
        content,
        item,
      );
    } catch {
      await echoerr(
        denops,
        `Content is invalid toml format: ${lines.join("\n")}`,
      );
    }
  }, { once: true });

  const command = getEditCommand(args.actionParams, args.kindParams);

  await args.denops.cmd(`${command} +buffer${bufnr}`);
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
