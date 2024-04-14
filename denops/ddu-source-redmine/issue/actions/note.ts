import {
  ActionFlags,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.10.3/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.10.3/deps.ts";
import { parse, stringify } from "https://deno.land/std@0.222.1/toml/mod.ts";
import { define } from "https://deno.land/x/denops_std@v6.4.0/autocmd/mod.ts";
import { echoerr } from "https://deno.land/x/denops_std@v6.4.0/helper/mod.ts";
import { register } from "https://deno.land/x/denops_std@v6.4.0/lambda/mod.ts";
import { prepareUnwritableBuffer } from "../prepareBuffer.ts";
import { update } from "https://deno.land/x/deno_redmine@0.7.0/issues/update.ts";
import {
  assert,
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.18.0/mod.ts";
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

  const bufname = `redmine:///note#${item.issue.id}`;
  const bufnr = await prepareUnwritableBuffer(denops, bufname);

  await fn.setbufline(
    denops,
    bufnr,
    1,
    stringify(noteTemplate).trim().split(/\r?\n/),
  );
  await fn.setbufvar(denops, bufnr, "&filetype", "toml");
  await fn.setbufvar(denops, bufnr, "&modified", false);

  const id = register(denops, async (lines: unknown) => {
    assert(lines, is.ArrayOf(is.String));
    try {
      const note = parse(lines.join("\n"));
      if (!isNotes(note)) {
        await echoerr(denops, "Schema is not matched");
        return;
      }
      await update(
        item.issue.id,
        convertNote(note),
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
