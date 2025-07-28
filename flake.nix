{
  description = "Redmine source for ddu.vim";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils.url = "github:numtide/flake-utils";
    nur = {
      url = "github:Omochice/nur-packages";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      treefmt-nix,
      flake-utils,
      nur,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ nur.overlays.default ];
        };
        treefmt = treefmt-nix.lib.evalModule pkgs (
          { ... }:
          {
            programs = {
              # keep-sorted start block=yes
              deno = {
                enable = true;
                includes = [
                  "*.ts"
                ];
              };
              formatjson5 = {
                enable = true;
                indent = 2;
              };
              keep-sorted.enable = true;
              mdformat.enable = true;
              nixfmt.enable = true;
              pinact = {
                enable = true;
                update = false;
              };
              yamlfmt = {
                enable = true;
                settings = {
                  formatter = {
                    type = "basic";
                    retain_line_breaks_single = true;
                  };
                };
              };
              # keep-sorted end
            };
          }
        );
        runAs =
          name: runtimeInputs: text:
          let
            program = pkgs.writeShellApplication {
              inherit name runtimeInputs text;
            };
          in
          {
            type = "app";
            program = "${program}/bin/${name}";
          };
        devPackages = rec {
          actions = [
            pkgs.actionlint
            pkgs.ghalint
            pkgs.zizmor
          ];
          deno = [ pkgs.deno ];
          renovate = [ pkgs.renovate ];
          default = actions ++ deno ++ renovate;
        };
      in
      {
        # keep-sorted start block=yes
        devShells =
          devPackages
          |> pkgs.lib.attrsets.mapAttrs (name: buildInputs: pkgs.mkShell { inherit buildInputs; });
        apps = {
          check-actions =
            ''
              actionlint
              ghalint run
              zizmor .github/workflows
            ''
            |> runAs "check-actions" devPackages.actions;
          check-renovate-config =
            "renovate-config-validator renovate.json5" |> runAs "check-renovate-config" devPackages.renovate;
          check-deno =
            ''
              deno task fmt:check
              deno task check
              deno task lint
            ''
            |> runAs "check-deno" devPackages.deno;
        };
        checks = {
          formatting = treefmt.config.build.check self;
        };
        formatter = treefmt.config.build.wrapper;
        # keep-sorted end
      }
    );
}
