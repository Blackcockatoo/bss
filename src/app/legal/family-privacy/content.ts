/**
 * DRAFT family privacy notice: source text.
 *
 * Every factual claim below should stay true to the code. Where a claim
 * depends on a specific part of the app, the source is noted so it can be
 * re-checked when that code changes:
 *
 * - Analytics allowlist: src/lib/analyticsBoundary.ts (ANALYTICS_ALLOWED_PREFIXES)
 *   and src/components/ConsumerAnalytics.tsx.
 * - Local storage: src/lib/persistence/* (IndexedDB) and Zustand `persist`
 *   stores (localStorage). No account system exists.
 * - Server calls: the only same-origin API routes are /api/genome-resonance/*
 *   and /api/genome/sonify/[petId]; they compute a response and store nothing.
 * - Cookies: only the functional Field Mode cookies set in src/proxy.ts and
 *   src/app/schools/field/exit/route.ts.
 * - Camera, microphone, location: blocked by the Permissions-Policy header in
 *   next.config.js.
 * - Expressions exports: PNG/GIF/WebP/ZIP made in the browser; ancillary
 *   metadata chunks are not written (src/lib/expressions/studio.test.ts).
 * - Google Fonts: @import in public/geometry-sound.html and the public/moss60*.html pages.
 *
 * Placeholders in [square brackets] must be filled in before publishing.
 */

export type FamilyPrivacySection = {
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
};

export const FAMILY_PRIVACY_KIDS_SECTIONS: readonly FamilyPrivacySection[] = [
  {
    heading: "Your pet lives on your device",
    paragraphs: [
      "Your MetaPet, its DNA, its name, its memories and your game progress are saved inside the web browser on the device you are using. They are not sent to us, and we can't see them.",
      "There are no MetaPet accounts. We never ask for your email, password, phone number or photo.",
    ],
  },
  {
    heading: "Keep your real details to yourself",
    paragraphs: [
      "Please don't type your real full name, address, school, phone number or other personal details into a pet name or any text box. Use a made-up name instead. That's what a good digital citizen does!",
    ],
  },
  {
    heading: "Stickers and pictures you make",
    paragraphs: [
      "When you make an Expression sticker, GIF or sticker pack, it is drawn on your device and saved to your device. The file only contains the picture. It doesn't hide your name, location or any other information inside it.",
      "Before you share something you made, ask a parent, carer or teacher first.",
    ],
  },
  {
    heading: "No ads and no tracking while you play",
    paragraphs: [
      "There are no ads in MetaPet. We don't track what you do on your pet, in the games, in Expressions or in the DNA and identity tools.",
      "MetaPet can't turn on your camera or microphone, and it can't find out where you are.",
    ],
  },
  {
    heading: "Deleting your pet",
    paragraphs: [
      "If you clear this website's data in your browser settings, your pet and progress are deleted from that device. We can't bring them back, because we never had a copy.",
    ],
  },
  {
    heading: "If something feels wrong",
    paragraphs: [
      "If anything on MetaPet makes you feel worried, unsafe or upset, stop and tell a trusted adult.",
    ],
  },
];

export const FAMILY_PRIVACY_PARENT_SECTIONS: readonly FamilyPrivacySection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      "MetaPet is made by Blue Snake Studios, an Australian business. Contact: [contact email to be confirmed]. Postal address: [to be confirmed].",
    ],
  },
  {
    heading: "What is stored, and where",
    paragraphs: [
      "MetaPet has no user accounts and no sign-in. Pets, genomes, names, memories, settings, game progress, saved Expression recipes and favourites are stored in your browser's local storage (localStorage and IndexedDB) on your device. Blue Snake Studios does not receive or hold a copy.",
      "Because this data is only on the device, we cannot view, export, correct or delete it for you, and we cannot restore it if it is lost. You stay in control: clearing this site's data in the browser deletes it immediately.",
    ],
  },
  {
    heading: "Information that does reach a server",
    bullets: [
      "Hosting: the site is hosted by Vercel. Like any website, every page request reaches the host, which receives technical information such as your IP address, browser type, the page requested and the time. [Confirm the hosting provider's log retention period and region before publishing.]",
      "Genome Resonance tool: when you run a simulation or ask for an explanation, the trait numbers you chose and the pet's ID are sent to our server so it can calculate a result. The server returns the result and does not save the request.",
      "Product analytics: Vercel Web Analytics loads only on the adult-facing /pricing and /studio pages. It counts page visits so we can see which pages are used. It does not load on the pet, Expressions, games, arcade, DNA, identity, MOSS60, school, teacher or legal pages, and an automated test stops new pages from turning it on by accident.",
      "Web fonts on some older pages: Geometry Sound and the classic MOSS60 pages ask Google Fonts for typefaces, so Google receives your IP address and browser details when those pages load. [We plan to self-host these fonts. Update this line once that's done.]",
    ],
  },
  {
    heading: "What we don't do",
    bullets: [
      "No advertising, no advertising IDs and no behavioural profiling.",
      "No selling or renting personal information.",
      "No chat with strangers, public profiles or friend lists.",
      "No access to the camera, microphone or location. The site's Permissions-Policy header blocks them.",
      "No tracking cookies. The only cookies are functional ones that switch the classroom Field Mode on or off.",
    ],
  },
  {
    heading: "Sharing and exports",
    paragraphs: [
      "Expressions stickers, GIFs, WebP files and ZIP sticker packs are created entirely in the browser and saved to your device. The image files contain only image data. No name, location, device or pet record is embedded in them. Nothing is uploaded unless you choose to share a file yourself, for example through your device's share sheet.",
      "Some tools (such as MOSS60 share links and the pet registration certificate) can create a link or text to copy or share. Those contain the pet or glyph details shown on screen, so check them before sending.",
    ],
  },
  {
    heading: "Children",
    paragraphs: [
      "MetaPet is designed for children to use with a parent, carer or teacher nearby. We do not knowingly collect personal information from children: the app does not ask for it, and the things children type stay on the device. If you believe a child's personal information has reached us, contact us at [contact email to be confirmed] and we will help.",
    ],
  },
  {
    heading: "Your rights and complaints",
    paragraphs: [
      "You can ask us what personal information we hold about you or your child, and ask us to correct it. Because MetaPet data stays on your device, in most cases we will hold none. To ask a question or make a complaint, contact [contact email to be confirmed]. If you're not satisfied with our response, you can contact the Office of the Australian Information Commissioner (oaic.gov.au). [Legal review: confirm which privacy laws apply, including the Privacy Act 1988 (Cth), the Children's Online Privacy Code once registered, and any overseas laws such as COPPA or the UK Age Appropriate Design Code.]",
    ],
  },
  {
    heading: "Changes to this notice",
    paragraphs: [
      "If what MetaPet stores or sends ever changes, we will update this notice before the change goes live and change the date at the top. [Confirm how families will be told about material changes.]",
    ],
  },
];
