import {
  type Action,
  type ActionCallback,
  ActionFlags,
  type DduItem,
} from "jsr:@shougo/ddu-vim@10.3.0/types";
import type { Denops } from "jsr:@denops/std@7.5.0";
import * as fn from "jsr:@denops/std@7.5.0/function";
import { parse, stringify } from "jsr:@std/toml@1.0.2";
import { define } from "jsr:@denops/std@7.5.0/autocmd";
import { echoerr } from "jsr:@denops/std@7.5.0/helper";
import { register } from "jsr:@denops/std@7.5.0/lambda";
import { format } from "jsr:@denops/std@7.5.0/bufname";
import { filetype, modified } from "jsr:@denops/std@7.5.0/option";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@v0.10.0/issues/update.ts";
import { isItem } from "../type.ts";
import { assert, is } from "jsr:@core/unknownutil@4.3.0";
import { getEditCommand } from "../getEditCommand.ts";

const callback: ActionCallback<never> = async (args: {
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
};

export const update = {
  description: "Update properties of this issue",
  callback,
} as const satisfies Action<never>;
