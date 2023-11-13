import {
  ActionFlags,
  Context,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.6.0/deps.ts";
import { parse, stringify } from "https://deno.land/std@0.206.0/toml/mod.ts";
import { define } from "https://deno.land/x/denops_std@v5.0.2/autocmd/mod.ts";
import { echoerr } from "https://deno.land/x/denops_std@v5.0.2/helper/mod.ts";
import { register } from "https://deno.land/x/denops_std@v5.0.2/lambda/mod.ts";
import { type BufferOption, prepareBuffer } from "../prepare-buffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@0.6.0/issues/update.ts";
import { isIssue } from "../type.ts";
import {
  assert,
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.10.0/mod.ts";

const bufopts: BufferOption = {
  buftype: "nofile",
  bufhidden: "delete",
  swapfile: false,
} as const;

export async function update(args: {
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

  const bufname = `ddu-source-redmine_#${issue.id}`;
  const bufnr = await prepareBuffer(denops, bufname, bufopts);
  await fn.setbufline(
    denops,
    bufnr,
    1,
    [`description = """`, ...(issue.description ?? "").split(/\r?\n/), `"""`],
  );

  const id = register(denops, async (lines: unknown) => {
    assert(lines, is.ArrayOf(is.String));
    try {
      const content = parse(lines.join("\n"));
      // if (!isNotes(note)) {
      //   await echoerr(denops, "Schema is not matched");
      //   return;
      // }
      await updateIssue(
        issue.id,
        content,
        issue,
      );
    } catch {
      await echoerr(
        denops,
        `Content is invalid toml format: ${lines.join("\n")}`,
      );
    }
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
