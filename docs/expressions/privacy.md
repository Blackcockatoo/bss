# Expressions privacy and data handling

Expressions runs on the Blue $nake Studio consumer surface. The MetaPet School and Field Mode policies exclude the route. The route is explicitly excluded from consumer analytics.

Opening the studio reads the device's registered companion and its visual inputs. The snapshot carries no real name, registration secret, raw memory or account information. The route does not register pets, update their preferred form, progress evolution or run live pet-care simulation. Current-format Body Forge data and older packets are read without triggering a migration.

Favourites, recent expressions, one saved animation recipe, one meme template and one comic are stored in a separate browser-local namespace keyed by registered pet ID. Clearing creative saves removes this workspace for the current pet. Catalogue thumbnails are rendered locally, held as object URLs for the session and kept in a separate, bounded Cache Storage cache (`metapet-expression-thumbs-v2`). The cache is written with `Cache.put` only and is never fetched from a server. Its keys contain a one-way hash of the snapshot, form and expression id, never the pet id, name, genome or registration data. It does not share a name prefix with the service worker's shell or Field Mode caches. "Clear thumbnail cache" deletes it, and clearing creative saves deletes it too. Users retain any files they exported.

Personality only changes how a performance moves. It is derived on the fly from the genome-decoded traits already on the device and is never stored or exported.

The imported recipe format is bounded to 4 KB, one known expression and validated numeric playback controls, including an integer variation from 0 to 999 that only reseeds decorative particles and secondary motion. Unknown fields are discarded. Imports cannot execute code or attach external assets. Captions are rendered as text. The export path rejects non-local SVG references and produces image pixels only. The browser verification script checks that exported PNGs contain no text, time, EXIF or other metadata chunks, and the character name and registry identifiers never appear in rendered SVG. WebP export keeps only frame bitstreams and transparency chunks. Local sharing requires an explicit user gesture and a browser-native file share target.

The studio needs no account, face scan, tracking, public upload, or server-side storage. Its implementation does not include cross-domain pet transfer or companion picture import.
