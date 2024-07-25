import {
  ActionFlags,
  DduItem,
} from "https://deno.land/x/ddu_vim@v4.2.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v4.2.0/deps.ts";
import { parse, stringify } from "https://deno.land/std@0.224.0/toml/mod.ts";
import { define } from "https://deno.land/x/denops_std@v6.5.1/autocmd/mod.ts";
import { echoerr } from "https://deno.land/x/denops_std@v6.5.1/helper/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.5.1/batch/mod.ts";
import { register } from "https://deno.land/x/denops_std@v6.5.1/lambda/mod.ts";
import { format } from "https://deno.land/x/denops_std@v6.5.1/bufname/mod.ts";
import {
  filetype,
  modified,
} from "https://deno.land/x/denops_std@v6.5.1/option/mod.ts";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { update } from "https://deno.land/x/deno_redmine@v0.9.1/issues/update.ts";
import {
  assert,
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.18.1/mod.ts";
import { isItem } from "../type.ts";
import { getEditCommand } from "../getEditCommand.ts";

const isNotes = is.ObjectOf({
  notes: is.String,
  private_notes: is.OptionalOf(is.Boolean),
});
type Note = PredicateType<typeof isNotes>;

const convertNote = (note: Note): Required<Note> => {
  return {
    notes: note.notes.trim(),
    private_notes: note.private_notes ?? false,
  };
};

const noteTemplate = { notes: "", private_notes: false };

export async function note(args: {
  denops: Denops;
  kindParams: unknown;
  actionParams: unknown;
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
    expr: "/note",
    fragment: `${item.issue.id}`,
  });
  const bufnr = await prepareUnwritableBuffer(denops, bufname);

  await batch(denops, async (d) => {
    await fn.setbufline(
      d,
      bufnr,
      1,
      stringify(noteTemplate).trim().split(/\r?\n/),
    );

    await filetype.setBuffer(d, bufnr, "toml");
    await modified.setBuffer(d, bufnr, false);
    const id = register(d, async (lines: unknown) => {
      assert(lines, is.ArrayOf(is.String));
      try {
        const note = parse(lines.join("\n"));
        if (!isNotes(note)) {
          await echoerr(d, "Schema is not matched");
          return;
        }
        await update(item.issue.id, convertNote(note), item);
      } catch {
        await echoerr(d, `Content is invalid toml format: ${lines.join("\n")}`);
      }
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
