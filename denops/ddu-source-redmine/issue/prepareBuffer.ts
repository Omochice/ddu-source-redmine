import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.10.2/deps.ts";
import { define } from "https://deno.land/x/denops_std@v6.3.0/autocmd/mod.ts";

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
  await fn.bufload(denops, bufnr);
  await fn.setbufvar(denops, bufnr, "&buftype", opts?.buftype ?? "");
  await fn.setbufvar(denops, bufnr, "&bufhidden", opts?.bufhidden ?? "");
  await fn.setbufvar(denops, bufnr, "&swapfile", opts?.swapfile ?? false);
  await fn.deletebufline(denops, bufnr, 1, "$");
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
