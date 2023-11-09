import {
  BaseSource,
  DduOptions,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import { Denops } from "https://deno.land/x/ddu_vim@v3.6.0/deps.ts";
import { listIssues } from "https://deno.land/x/deno_redmine@0.6.0/issues/list.ts";
import type { Issue } from "https://deno.land/x/deno_redmine@0.6.0/issues/type.ts";

type ActionData = Record<PropertyKey, never>;

type Params = {
  endpoint: string;
  apiKey: string;
};

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
        controller.enqueue(issues.value.map(convertToItem));

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

function convertToItem(issue: Issue): Item<ActionData> {
  return {
    word: `#${issue.id} ${issue.subject}`,
  };
}
