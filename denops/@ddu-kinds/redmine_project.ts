import {
  type Actions,
  type DduItem,
  type NoFilePreviewer,
} from "jsr:@shougo/ddu-vim@11.1.0/types";
import { BaseKind } from "jsr:@shougo/ddu-vim@11.1.0/kind";
import { openBrowser } from "../ddu-source-redmine/project/actions/open.ts";
import { isItem, type Item } from "../ddu-source-redmine/project/type.ts";

export const kindName = "redmine_project" as const;

export type ActionData = Item;

type Params = Record<PropertyKey, never>;

const actions: Actions<Params> = {
  openBrowser,
};

export class Kind extends BaseKind<Params> {
  override actions = actions;
  override getPreviewer = async (
    args: { item: DduItem },
  ): Promise<NoFilePreviewer | undefined> => {
    if (!isItem(args.item.action)) {
      return await Promise.resolve(undefined);
    }

    return {
      kind: "nofile",
      contents: args.item.action.project.description?.split(/\r?\n/) ?? [""],
      filetype: "markdown",
    };
  };

  override params = (): Params => ({});
}
