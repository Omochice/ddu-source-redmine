{
  description = "Redmine source for ddu.vim";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
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
      nur,
    }:
    let
      supportedSystems = [
        "x86_64-linux"
        "x86_64-darwin"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      nixpkgsFor = forAllSystems (
        system:
        import nixpkgs {
          inherit system;
          # overlays = [ nur.overlays ];
        }
      );

      treefmt =
        system:
        treefmt-nix.lib.evalModule nixpkgs.legacyPackages.${system} (
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
    in
    {
      # keep-sorted start block=yes
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgsFor.${system};
        in
        {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              deno
            ];
          };
          check-action = pkgs.mkShell {
            buildInputs = with pkgs; [
              actionlint
              nur.packages.${system}.ghalint
            ];
          };
          renovate = pkgs.mkShell {
            buildInputs = with pkgs; [
              renovate
            ];
          };
        }
      );
      formatter = forAllSystems (system: (treefmt system).config.build.wrapper);
      # keep-sorted end
    };
}
