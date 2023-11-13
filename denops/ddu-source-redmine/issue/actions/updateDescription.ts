import {
  ActionFlags,
  Context,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.6.0/deps.ts";
import { define } from "https://deno.land/x/denops_std@v5.0.2/autocmd/mod.ts";
import { register } from "https://deno.land/x/denops_std@v5.0.2/lambda/mod.ts";
import { type BufferOption, prepareBuffer } from "../prepare-buffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@0.7.0/issues/update.ts";
import { isIssue } from "../type.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.10.0/mod.ts";

const bufopts: BufferOption = {
  buftype: "nofile",
  bufhidden: "delete",
  swapfile: false,
  filetype: "markdown",
} as const;

export async function updateDescription(args: {
  denops: Denops;
  context: Context;
  items: DduItem[];
}) {
  const { denops, items } = args;
  if (items.length !== 1) {
    return ActionFlags.Persist;
  }

  const issue = items[0]?.action;
  if (!isIssue(issue)) {
    return ActionFlags.None;
  }

  const bufname = `ddu-source-redmine_#${issue.id}-description`;
  const bufnr = await prepareBuffer(denops, bufname, bufopts);
  await fn.setbufline(
    denops,
    bufnr,
    1,
    (issue.description ?? "").split(/\r?\n/),
  );

  const id = register(denops, async (lines: unknown) => {
    assert(lines, is.ArrayOf(is.String));
    await updateIssue(
      issue.id,
      { description: lines.join("\n").trim() },
      issue,
    );
  }, { once: true });

  await args.denops.cmd(`tabedit +buffer${bufnr}`);
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
