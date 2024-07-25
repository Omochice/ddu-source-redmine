import {
  ActionFlags,
  Actions,
  BaseKind,
  DduItem,
  NoFilePreviewer,
} from "https://deno.land/x/ddu_vim@v4.2.0/types.ts";
import { update } from "../ddu-source-redmine/issue/actions/update.ts";
import { note } from "../ddu-source-redmine/issue/actions/note.ts";
import { updateDescription } from "../ddu-source-redmine/issue/actions/updateDescription.ts";
import { openBrowser } from "../ddu-source-redmine/issue/actions/open.ts";
import { isItem, type Item } from "../ddu-source-redmine/project/type.ts";

export const kindName = "redmine_project" as const;

export type ActionData = Item;

type Params = Record<PropertyKey, never>;

const actions: Actions<Params> = {
  sample: () => {
    console.log("sample");
    return ActionFlags.None;
  },
};

export class Kind extends BaseKind<Params> {
  override actions = actions;
  override getPreviewer = async (
    args: { item: DduItem },
  ): Promise<NoFilePreviewer | undefined> => {
    if (!isItem(args.item.action)) {
      return await Promise.resolve(undefined);
    }

    return await Promise.resolve({
      kind: "nofile",
      contents: args.item.action.project.description.split(/\r?\n/),
      filetype: "markdown",
    });
  };

  override params = (): Params => ({});
}
