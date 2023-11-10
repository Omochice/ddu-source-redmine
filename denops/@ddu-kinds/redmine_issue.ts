import {
  ActionFlags,
  Actions,
  BaseKind,
  Context,
  DduItem,
  NoFilePreviewer,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.6.0/deps.ts";
import type { Context as ConnectionContext } from "https://deno.land/x/deno_redmine@0.6.0/context.ts";
import type { Issue } from "https://deno.land/x/deno_redmine@0.6.0/issues/type.ts";
import {
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.10.0/mod.ts";
import { stringify } from "https://deno.land/std@0.200.0/toml/mod.ts";
import { define } from "https://deno.land/x/denops_std@v5.0.2/autocmd/mod.ts";

export type ActionData = ConnectionContext & Pick<Issue, "description" | "id">;

type Params = Record<PropertyKey, never>;

const hasDescription = is.ObjectOf({
  id: is.Number,
  description: is.OneOf([
    is.String,
    is.Undefined,
  ]),
});

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

const actions: Actions<Params> = {
  note: async (args: {
    denops: Denops;
    context: Context;
    items: DduItem[];
  }) => {
    const { denops, items } = args;
    if (items.length !== 1) {
      return ActionFlags.Persist;
    }

    const issue = items[0]?.action;
    if (!hasDescription(issue)) {
      return ActionFlags.None;
    }

    // create empty buffer
    const bufname = `ddu-source-redmine_${issue.id}`;
    const bufnr = await fn.bufadd(denops, bufname);
    await fn.bufload(denops, bufnr);
    await fn.setbufvar(denops, bufnr, "&buftype", "nofile");
    await fn.setbufvar(denops, bufnr, "&bufhidden", "delete");
    await fn.setbufvar(denops, bufnr, "&swapfile", 0);
    await fn.deletebufline(denops, bufnr, 1, "$");
    await fn.setbufline(
      denops,
      bufnr,
      1,
      stringify(noteTemplate).trim().split(/\r?\n/),
    );

    // set event
    await define(denops, "BufDelete", `${bufnr}`, "echo 'hi'", {
      once: true,
    });

    // TODO: open buffer with close action
    await args.denops.cmd(`tabedit +buffer${bufnr}`);
    return ActionFlags.None;
  },
};

export class Kind extends BaseKind<Params> {
  override actions = actions;
  override async getPreviewer(
    args: { item: DduItem },
  ): Promise<NoFilePreviewer | undefined> {
    if (!hasDescription(args.item.action)) {
      return await Promise.resolve(undefined);
    }

    const description = (args.item.action.description ?? "").trim();
    return await Promise.resolve({
      kind: "nofile",
      contents: description === ""
        ? ["--THIS ISSUE DOESNOT HAVE DESCRIPTION--"]
        : description.split(/\r?\n/),
      filetype: "markdown",
    });
  }
  override params(): Params {
    return {};
  }
}
