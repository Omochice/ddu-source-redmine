{
  description = "Redmine sourec for ddu.vim";

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
              pinact.enable = true;
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
      apps = forAllSystems (
        system:
        let
          pkgs = nixpkgsFor.${system};
        in
        {
          release-build = {
            type = "app";
            program = toString (
              pkgs.writeShellScript "release" ''
                ${pkgs.goreleaser}/bin/goreleaser release --snapshot --clean
              ''
            );
          };
          release = {
            type = "app";
            program = toString (
              pkgs.writeShellScript "release" ''
                ${pkgs.goreleaser}/bin/goreleaser release --clean --skip announce
              ''
            );
          };
        }
      );
      defaultPackage = forAllSystems (system: self.packages.${system}.redmine-title);
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgsFor.${system};
        in
        {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              # keep-sorted start
              deno
              # keep-sorted end
            ];
          };
          check-action = pkgs.mkShell {
            buildInputs = with pkgs; [
              actionlint
              nur.packages.${system}.ghalint
            ];
          };
        }
      );
      formatter = forAllSystems (system: (treefmt system).config.build.wrapper);
      # keep-sorted end
    };
}
