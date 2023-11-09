import {
  ActionFlags,
  Actions,
  BaseKind,
  Context,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";

import type { Denops } from "https://deno.land/x/denops_std@v5.0.2/mod.ts";

export type ActionData = {
  context: string;
};

type Params = Record<PropertyKey, never>;

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
    await args.denops.cmd("enew");
    return ActionFlags.None;
  },
};

export class Kind extends BaseKind<Params> {
  override actions = actions;
  override async getPreviewer() {
    return await Promise.resolve(undefined);
  }
  override params(): Params {
    return {};
  }
}
