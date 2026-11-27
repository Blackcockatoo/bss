# Vendored third-party scripts

Self-hosted so the Content Security Policy does not need to allow any
third-party script host. Files are byte-identical to the published npm
builds (and to the copies cdnjs served), verified by SHA-256 when vendored.

| Path | Package | Source file | License |
|---|---|---|---|
| `three-r128/three.min.js` | `three@0.128.0` | `build/three.min.js` | MIT (`three-r128/LICENSE`) |
| `tone-14.8.49/Tone.js` | `tone@14.8.49` | `build/Tone.js` | MIT (`tone-14.8.49/LICENSE.md`) |

Used by `public/geometry-sound.html`, which pins them with `integrity`
(SRI) hashes. If you update a file, update its hash there too:

    openssl dgst -sha384 -binary <file> | base64

The npm `three` / `tone` dependencies in package.json are newer versions used
by the React app; these legacy copies are only for the standalone page.
