import {
  type Action,
  type ActionCallback,
  ActionFlags,
  type DduItem,
} from "jsr:@shougo/ddu-vim@10.3.0/types";
import type { Denops } from "jsr:@denops/std@7.5.0";
import * as fn from "jsr:@denops/std@7.5.0/function";
import { stringify } from "jsr:@std/yaml@1.0.6";
import { extractYaml } from "jsr:@std/front-matter@1.0.9";
import { define } from "jsr:@denops/std@7.5.0/autocmd";
import { echoerr } from "jsr:@denops/std@7.5.0/helper";
import { batch } from "jsr:@denops/std@7.5.0/batch";
import { add } from "jsr:@denops/std@7.5.0/lambda";
import { expr } from "jsr:@denops/std@7.5.0/eval";
import { format } from "jsr:@denops/std@7.5.0/bufname";
import { filetype, modified } from "jsr:@denops/std@7.5.0/option";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { update } from "https://deno.land/x/deno_redmine@v0.10.0/issues/update.ts";
import { assert, is } from "jsr:@core/unknownutil@4.3.0";
import { isItem, type Params } from "../type.ts";
import { getEditCommand } from "../getEditCommand.ts";

type NoteOption = {
  private_notes?: boolean;
};

type Note = {
  notes: string;
} & NoteOption;

const callback: ActionCallback<Params> = async (args: {
  denops: Denops;
  kindParams: unknown;
  actionParams: unknown;
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
    expr: "/note",
    fragment: `${item.issue.id}`,
  });
  const bufnr = await prepareUnwritableBuffer(denops, bufname);

  const content = [
    "---",
    ...stringify({ private_notes: false }).trim().split(/\r?\n/),
    "---",
  ];

  await batch(denops, async (d) => {
    await fn.setbufline(
      d,
      bufnr,
      1,
      content,
    );

    await filetype.setBuffer(d, bufnr, "markdown");
    await modified.setBuffer(d, bufnr, false);
    const lambda = add(d, async (lines: unknown) => {
      assert(lines, is.ArrayOf(is.String));
      try {
        const { attrs, body } = extractYaml<NoteOption>(lines.join("\n"));
        const note = {
          notes: body.trim(),
          private_notes: attrs.private_notes ?? false,
        } satisfies Note;
        await update(item.issue.id, note, item);
      } catch {
        await echoerr(d, `Content is invalid format: ${lines.join("\n")}`);
      }
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

export const note = {
  description: "Add a note to this issue",
  callback,
} as const satisfies Action<never>;
