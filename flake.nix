{
  description = "Develop my brain with Nix";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-26.05";
  };

  outputs =
    { nixpkgs, ... }:
    let
      inherit (nixpkgs) lib;
      forAllSystems = lib.genAttrs lib.systems.flakeExposed;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs
              pkgs.prettierd
              pkgs.typescript-language-server
              pkgs.vscode-langservers-extracted
              # Browser runtime for Excalidraw SVG export
              pkgs.chromium
            ];
            env = {
              # Puppeteer: use system chromium, skip bundled download
              PUPPETEER_SKIP_DOWNLOAD = "true";
              # Puppeteer: path to system chromium executable
              PUPPETEER_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
            };
          };
        }
      );
    };
}
