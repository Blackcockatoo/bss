# Expressions privacy and data handling

Expressions runs on the Blue $nake Studio consumer surface. The MetaPet School and Field Mode policies exclude the route. The route is explicitly excluded from consumer analytics.

Opening the studio reads the device's registered companion and its visual inputs. The snapshot carries no real name, registration secret, raw memory or account information. The route does not register pets, update their preferred form, progress evolution or run live pet-care simulation. Current-format Body Forge data and older packets are read without triggering a migration.

Favourites, recent expressions, one saved animation recipe, one meme template and one comic are stored in a separate browser-local namespace keyed by registered pet ID. Clearing creative saves removes this workspace for the current pet. Session-only thumbnails are held as browser object URLs and released at the end of that catalogue session. Users retain any files they exported.

The imported recipe format is bounded to 4 KB, one known expression and validated numeric playback controls. Unknown fields are discarded. Imports cannot execute code or attach external assets. Captions are rendered as text. The export path rejects non-local SVG references and produces image pixels, with the character name and registry identifiers excluded from image metadata. WebP export keeps only frame bitstreams and transparency chunks. Local sharing requires an explicit user gesture and a browser-native file share target.

The studio needs no account, face scan, tracking, public upload, or server-side storage. Its implementation does not include cross-domain pet transfer or companion picture import.
