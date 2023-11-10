import {
  ActionFlags,
  Actions,
  BaseKind,
  Context,
  DduItem,
  NoFilePreviewer,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";

import type { Denops } from "https://deno.land/x/denops_std@v5.0.2/mod.ts";
import type { Context as ConnectionContext } from "https://deno.land/x/deno_redmine@0.6.0/context.ts";
import type { Issue } from "https://deno.land/x/deno_redmine@0.6.0/issues/type.ts";
import { is } from "https://deno.land/x/unknownutil@v3.10.0/mod.ts";

export type ActionData = ConnectionContext & Pick<Issue, "description">;

type Params = Record<PropertyKey, never>;

const hasDescription = is.ObjectOf({
  description: is.OneOf([
    is.String,
    is.Undefined,
  ]),
});

const actions: Actions<Params> = {
  note: async (args: {
    denops: Denops;
    context: Context;
    items: DduItem[];
  }) => {
    if (args.items.length !== 1) {
      return ActionFlags.Persist;
    }

    // TODO: open buffer with close action
    await args.denops.cmd("tabnew");
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
