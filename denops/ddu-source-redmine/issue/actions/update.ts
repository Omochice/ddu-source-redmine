import {
  ActionFlags,
  DduItem,
} from "https://deno.land/x/ddu_vim@v5.0.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v5.0.0/deps.ts";
import { parse, stringify } from "https://deno.land/std@0.224.0/toml/mod.ts";
import { define } from "https://deno.land/x/denops_std@v6.5.1/autocmd/mod.ts";
import { echoerr } from "https://deno.land/x/denops_std@v6.5.1/helper/mod.ts";
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

export async function update(args: {
  denops: Denops;
  actionParams: unknown;
  kindParams: unknown;
  items: DduItem[];
}): Promise<ActionFlags> {
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
  try {
    await fn.setbufline(
      denops,
      bufnr,
      1,
      stringify(item.issue).split(/\r?\n/),
    );
    await filetype.setBuffer(denops, bufnr, "toml");
    await modified.setBuffer(denops, bufnr, false);
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
