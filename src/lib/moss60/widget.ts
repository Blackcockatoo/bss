import type { Moss60VerifiablePayload } from '@/lib/moss60/share';
import { verifyMoss60Payload } from '@/lib/moss60/share';

export interface Moss60WidgetRenderResult {
  verified: boolean;
  mount: HTMLElement;
}

export function verifyMoss60WidgetPayload(payload: Moss60VerifiablePayload): boolean {
  return verifyMoss60Payload(payload);
}

export function renderMoss60Widget(mount: HTMLElement, payload: Moss60VerifiablePayload): Moss60WidgetRenderResult {
  const verified = verifyMoss60WidgetPayload(payload);
  const {
    id,
    seed,
    scheme,
    variant,
    projection,
    timestamp,
  } = payload.metadata;

  mount.innerHTML = '';

  const wrapper = document.createElement('section');
  wrapper.setAttribute('aria-label', 'MOSS60 share widget');
  wrapper.style.fontFamily = 'Inter, ui-sans-serif, system-ui';
  wrapper.style.background = '#09090b';
  wrapper.style.color = '#f4f4f5';
  wrapper.style.border = '1px solid #27272a';
  wrapper.style.borderRadius = '14px';
  wrapper.style.padding = '14px';

  wrapper.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <strong style="font-size:14px;">MOSS60 Studio Share</strong>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:${verified ? '#052e16' : '#3f1d1d'};color:${verified ? '#86efac' : '#fca5a5'};">
        ${verified ? 'Verified' : 'Unverified'}
      </span>
    </div>
    <dl style="margin-top:10px;display:grid;grid-template-columns:auto 1fr;gap:6px 10px;font-size:12px;">
      <dt style="color:#a1a1aa;">ID</dt><dd>${id}</dd>
      <dt style="color:#a1a1aa;">Seed</dt><dd>${seed || '—'}</dd>
      <dt style="color:#a1a1aa;">Scheme</dt><dd>${scheme}</dd>
      <dt style="color:#a1a1aa;">Variant</dt><dd>${variant}</dd>
      <dt style="color:#a1a1aa;">Projection</dt><dd>${projection}</dd>
      <dt style="color:#a1a1aa;">Shared</dt><dd>${new Date(timestamp).toLocaleString()}</dd>
    </dl>
    <p style="margin-top:10px;color:#a1a1aa;font-size:11px;">Read-only widget · renderer + verifier bundle</p>
  `;

  mount.appendChild(wrapper);
  return { verified, mount };
}
