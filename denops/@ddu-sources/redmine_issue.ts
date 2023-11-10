import {
  BaseSource,
  DduOptions,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import { Denops } from "https://deno.land/x/ddu_vim@v3.6.0/deps.ts";
import { listIssues } from "https://deno.land/x/deno_redmine@0.6.0/issues/list.ts";
import type { Issue } from "https://deno.land/x/deno_redmine@0.6.0/issues/type.ts";
import type { Context } from "https://deno.land/x/deno_redmine@0.6.0/context.ts";
import type { ActionData } from "../@ddu-kinds/redmine_issue.ts";

type Params = Context;

export class Source extends BaseSource<Params> {
  kind = "redmine_issue";

  gather(args: {
    denops: Denops;
    options: DduOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    input: string;
  }): ReadableStream<Item<ActionData>[]> {
    const connectionContext = {
      endpoint: args.sourceParams.endpoint,
      apiKey: args.sourceParams.apiKey,
    } as const;

    return new ReadableStream({
      async start(controller) {
        const issues = await listIssues(connectionContext);
        if (!issues.isOk()) {
          controller.close();
          return;
        }
        controller.enqueue(
          issues.value.map((issue) => convertToItem(issue, connectionContext)),
        );

        controller.close();
      },
    });
  }

  params(): Params {
    return {
      endpoint: "",
      apiKey: "",
    };
  }
}

function convertToItem(issue: Issue, context: Context): Item<ActionData> {
  return {
    word: `#${issue.id} ${issue.subject}`,
    action: {
      ...context,
      id: issue.id,
      description: issue.description,
    },
  };
}
