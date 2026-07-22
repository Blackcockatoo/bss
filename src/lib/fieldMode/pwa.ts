export const FIELD_MODE_APP_ID = "/schools/field";

export const FIELD_MODE_ICON_SVG_PATH = "/icon-field.svg";
export const FIELD_MODE_ICON_192_PATH =
  "/icons/metapet-school-192.png";
export const FIELD_MODE_ICON_512_PATH =
  "/icons/metapet-school-512.png";
export const FIELD_MODE_MASKABLE_ICON_512_PATH =
  "/icons/metapet-school-maskable-512.png";
export const FIELD_MODE_APPLE_TOUCH_ICON_PATH =
  "/icons/metapet-school-apple-touch-icon.png";

/** Static assets needed for a distinct MetaPet.school installation identity. */
export const FIELD_MODE_INSTALL_ICON_PATHS = [
  FIELD_MODE_ICON_SVG_PATH,
  FIELD_MODE_ICON_192_PATH,
  FIELD_MODE_ICON_512_PATH,
  FIELD_MODE_MASKABLE_ICON_512_PATH,
  FIELD_MODE_APPLE_TOUCH_ICON_PATH,
] as const;
