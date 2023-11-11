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
import { update } from "https://deno.land/x/deno_redmine@0.6.0/issues/update.ts";
import {
  assert,
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.10.0/mod.ts";
import { parse, stringify } from "https://deno.land/std@0.206.0/toml/mod.ts";
import { define } from "https://deno.land/x/denops_std@v5.0.2/autocmd/mod.ts";
import { echoerr } from "https://deno.land/x/denops_std@v5.0.2/helper/mod.ts";
import { register } from "https://deno.land/x/denops_std@v5.0.2/lambda/mod.ts";

export type ActionData = ConnectionContext & Pick<Issue, "description" | "id">;

type Params = Record<PropertyKey, never>;

const isIssue = is.ObjectOf({
  id: is.Number,
  description: is.OneOf([
    is.String,
    is.Undefined,
  ]),
  endpoint: is.String,
  apiKey: is.String,
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
    if (!isIssue(issue)) {
      return ActionFlags.None;
    }

    const bufname = `ddu-source-redmine_#${issue.id}`;
    const bufnr = await fn.bufadd(denops, bufname);
    await fn.bufload(denops, bufnr);
    await fn.setbufvar(denops, bufnr, "&buftype", "nofile");
    await fn.setbufvar(denops, bufnr, "&bufhidden", "delete");
    await fn.setbufvar(denops, bufnr, "&swapfile", false);
    await fn.deletebufline(denops, bufnr, 1, "$");
    await fn.setbufline(
      denops,
      bufnr,
      1,
      stringify(noteTemplate).trim().split(/\r?\n/),
    );

    const id = register(denops, async (lines: unknown) => {
      assert(lines, is.ArrayOf(is.String));
      try {
        const note = parse(lines.join("\n"));
        if (!isNotes(note)) {
          await echoerr(denops, "Schema is not matched");
          return;
        }
        await update(
          issue.id,
          convertNote(note),
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
      `call denops#request('${denops.name}', '${id}', [getbufline(${bufnr}, 1, '$')])`,
      {
        once: true,
      },
    );

    return ActionFlags.None;
  },
};

export class Kind extends BaseKind<Params> {
  override actions = actions;
  override async getPreviewer(
    args: { item: DduItem },
  ): Promise<NoFilePreviewer | undefined> {
    if (!isIssue(args.item.action)) {
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
