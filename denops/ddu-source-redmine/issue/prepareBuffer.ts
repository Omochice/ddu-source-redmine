import { Denops, fn } from "https://deno.land/x/ddu_vim@v4.2.0/deps.ts";
import {
  bufhidden,
  buftype,
  swapfile,
} from "https://deno.land/x/denops_std@v6.5.1/option/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.5.1/batch/mod.ts";
import { define } from "https://deno.land/x/denops_std@v6.5.1/autocmd/mod.ts";

type BufType =
  | ""
  | "nofile"
  | "nowrite"
  | "acwrite"
  | "quickfix"
  | "help"
  | "terminal"
  | "prompt"
  | "popup";

type BufHidden =
  | ""
  | "hide"
  | "unload"
  | "delete"
  | "wipe";

type BufferOption = {
  buftype?: BufType;
  bufhidden?: BufHidden;
  swapfile?: boolean;
};

async function prepareBuffer(
  denops: Denops,
  bufname: string,
  opts?: BufferOption,
): Promise<number> {
  const bufnr = await fn.bufadd(denops, bufname);
  await batch(denops, async (d) => {
    await fn.bufload(d, bufnr);
    await buftype.setBuffer(d, bufnr, opts?.buftype ?? "");
    await bufhidden.setBuffer(d, bufnr, opts?.bufhidden ?? "");
    await swapfile.setBuffer(d, bufnr, opts?.swapfile ?? false);
    await fn.deletebufline(d, bufnr, 1, "$");
  });
  return bufnr;
}

export async function prepareUnwritableBuffer(
  denops: Denops,
  bufname: string,
): Promise<number> {
  const bufnr = await prepareBuffer(denops, bufname, {
    buftype: "acwrite",
    bufhidden: "delete",
    swapfile: false,
  });
  await define(
    denops,
    "BufWriteCmd",
    bufname,
    `call setbufvar(${bufnr}, '&modified', 0)`,
    {
      nested: true,
    },
  );
  return bufnr;
}
