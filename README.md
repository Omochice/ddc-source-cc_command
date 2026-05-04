# ddc-source-cc_command

A ddc.vim source for using claude-code skills and commands.

## Dependencies

- [vim-denops/denops.vim](https://github.com/vim-denops/denops.vim)
- [Shougo/ddc.vim](https://github.com/Shougo/ddc.vim)

## Usage

```vim
call ddc#custom#patch_global('sources', ['cc_command'])

call ddc#custom#patch_global('sourceOptions', #{
      \   cc_command: #{
      \     mark: 'C.C',
      \     forceCompletionPattern: '/\S*',
      \     keywordPattern: "[A-Za-z0-9_-]+",
      \   },
      \ })
```

See [doc/](./doc/ddc-source-cc_command.txt) for more information.

## Acknowledgements

This plugin is inspired by:

- [lambdalisue/nvim-aibo](https://github.com/lambdalisue/nvim-aibo/)
- [biosugar0/cmp-claudecode](https://github.com/biosugar0/cmp-claudecode)

## License

[zlib](./LICENSE)
