import {
  type Action,
  type ActionCallback,
  ActionFlags,
  type DduItem,
} from "jsr:@shougo/ddu-vim@11.1.0/types";
import type { Denops } from "jsr:@denops/std@8.2.0";
import * as fn from "jsr:@denops/std@8.2.0/function";
import { define } from "jsr:@denops/std@8.2.0/autocmd";
import { batch } from "jsr:@denops/std@8.2.0/batch";
import { add } from "jsr:@denops/std@8.2.0/lambda";
import { expr } from "jsr:@denops/std@8.2.0/eval";
import { format } from "jsr:@denops/std@8.2.0/bufname";
import { filetype, modified } from "jsr:@denops/std@8.2.0/option";
import { stringify } from "jsr:@std/yaml@1.0.10";
import { extractYaml } from "jsr:@std/front-matter@1.0.9";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { update as updateIssue } from "https://deno.land/x/deno_redmine@v2.0.0/issues/update.ts";
import { isItem, type Params } from "../type.ts";
import { as, assert, is } from "jsr:@core/unknownutil@4.3.0";
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

  const lines = [
    "---",
    stringify({
      id: item.issue.id,
      title: item.issue.subject,
    }),
    "---",
    "",
    item.issue.description ?? "",
  ]
    .flatMap((e) => e.trim().split(/\r?\n/));
  await batch(denops, async (d) => {
    await fn.setbufline(
      d,
      bufnr,
      1,
      lines,
    );
    await filetype.setBuffer(d, bufnr, "markdown");
    await modified.setBuffer(d, bufnr, false);

    const lambda = add(d, async (lines: unknown) => {
      assert(lines, is.ArrayOf(is.String));
      const { attrs, body } = extractYaml(lines.join("\n").trim());
      assert(attrs, is.ObjectOf({ title: as.Optional(is.String) }));
      await updateIssue(
        item.issue.id,
        { subject: attrs.title ?? item.issue.subject, description: body },
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
