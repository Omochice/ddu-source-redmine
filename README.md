# ddu-source-redmine

Redmine source for ddu.vim

> [!CAUTION]
> This source is under development.
> We may commit breaking changes without some notifications.

## Required

- [vim-denops/denops.vim](https://github.com/vim-denops/denops.vim)
- [Shougo/ddu.vim](https://github.com/Shougo/ddu.vim)

## Configuration

```vim
call ddu#start(#{ sources: [#{ name: 'redmine_issue' }] })

call ddu#custom#patch_global(#{
      \   sourceParams: #{
      \     redmine_issue: #{
      \       endpoint: 'https://your.redmine.example.com',
      \       apiKey: $YOUR_REDMINE_APIKEY,
      \     },
      \   },
      \ })
```
