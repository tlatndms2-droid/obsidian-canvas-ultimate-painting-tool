# Trial dependencies and fixtures

- ABR parser: https://github.com/jlai/brush-viewer (MIT, Jason Lai). Original source and license in `abr-tools/vendor`. Supports sample and descriptor parsing; does not itself reproduce Photoshop rendering.
- Pigment approximation: https://github.com/rvanwijnen/spectral.js (MIT). Version pinned in `abr-tools/package-lock.json`. This is a candidate implementation, not an assertion of CSP-equivalent results.
- Runtime/build dependencies: esbuild, kaitai-struct, fast-png and their dependencies; pinned locally in `abr-tools/package-lock.json`. License files remain in installed packages.
- ABR fixtures: https://github.com/SethRobinson/Patchy/tree/main/test-fixtures/abr . Source notice copied to `samples/NOTICE.txt`. Myer Settlement Brushes is CC0 per that notice; two Photoshop probe fixtures are authored by the upstream project. The samples are retained for local feasibility tests, not advertised as original work.

Bundle distribution requires retaining all relevant license notices. This is a local Sandbox experiment, not a published release.
