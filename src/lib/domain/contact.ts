/**
 * Central contact configuration.
 *
 * Contact details are defined once here so a single change swaps them
 * everywhere instead of editing individual pages. Dedicated school addresses
 * (hello@ / schools@metapet.school) are declared but marked inactive: until
 * they are live and approved, the surface falls back to the currently active
 * studio inbox, so we never publish an address that does not receive mail.
 */

import type { ProductSurface } from "./surface";

/** The one inbox that is currently live and approved. */
export const ACTIVE_STUDIO_EMAIL = "bluesssnakestudio@gmail.com";

/**
 * Planned dedicated school addresses. Flip `active` to true (and remove the
 * fallback) once these mailboxes are provisioned and approved.
 */
export const SCHOOL_CONTACT_EMAILS = {
  general: { address: "hello@metapet.school", active: false },
  schools: { address: "schools@metapet.school", active: false },
} as const;

export interface SurfaceContact {
  /** The email address shown / linked for this surface. */
  email: string;
  /** True when the address is a dedicated, live surface address. */
  dedicated: boolean;
  subject: string;
}

const PILOT_SUBJECT = "MetaPet School Pilot Enquiry";
const STUDIO_SUBJECT = "MetaPet Enquiry";

export function getSurfaceContact(surface: ProductSurface): SurfaceContact {
  if (surface === "school") {
    const preferred = SCHOOL_CONTACT_EMAILS.schools;
    return {
      email: preferred.active ? preferred.address : ACTIVE_STUDIO_EMAIL,
      dedicated: preferred.active,
      subject: PILOT_SUBJECT,
    };
  }

  return {
    email: ACTIVE_STUDIO_EMAIL,
    dedicated: false,
    subject: STUDIO_SUBJECT,
  };
}

export function buildMailto(contact: SurfaceContact): string {
  const subject = encodeURIComponent(contact.subject);
  return `mailto:${contact.email}?subject=${subject}`;
}
