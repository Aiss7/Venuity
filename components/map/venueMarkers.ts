/**
 * venueMarkers.ts
 *
 * All DOM construction and CSS for Arenarium marker elements.
 * Kept separate from VenueMap.tsx so the map component only owns
 * effect orchestration and JSX.
 *
 * Anchor contract with Arenarium
 * ─────────────────────────────
 * Arenarium positions each marker so the BOTTOM of `dimensions.height`
 * lands exactly on the lat/lng coordinate. Our elements are:
 *
 *   [  card body  ]   ← cardH px tall
 *   [▼ arrow tip  ]   ← ARROW_H px tall
 *
 * Total height passed to Arenarium = cardH + ARROW_H, which means the
 * tip of the triangle is pinned to the Supabase coordinate at every zoom.
 *
 * We also set `style: { background: 'transparent', radius: 0 }` on every
 * tooltip/popup so Arenarium does NOT render its own backing card or the
 * default white diamond pin — our custom DOM is the sole visual.
 */

import type { Venue } from '@/types';

// ---------------------------------------------------------------------------
// Layout constants (px)
// ---------------------------------------------------------------------------

export const TOOLTIP_W = 180;  // card width
export const TOOLTIP_CARD_H = 26;  // measured: 6px pad-top + ~15px text + 6px pad-bottom + 2px border
export const ARROW_H = 10;  // shared arrow height
export const TOOLTIP_PADDING = 4;  // Arenarium layout padding

export const POPUP_W = 230;  // card width
export const POPUP_CARD_H = 184;  // measured: 110px image + body (10+14+23+20+8) + 2px border
export const POPUP_PADDING = 6;  // Arenarium layout padding

// ---------------------------------------------------------------------------
// CSS — injected once into <head>.
// Tailwind utilities cannot be used inside imperative DOM builders, so we
// scope every marker style here and reference CSS custom properties so the
// design automatically follows the app's Shadcn/dark-mode theme.
// ---------------------------------------------------------------------------

const MARKER_CSS = `
/* ── Shared flex column wrapper ──────────────────────────────────────────── */
.vm-tooltip-root,
.vm-popup-root {
  display:         flex;
  flex-direction:  column;
  align-items:     center;
  background:      transparent;
  border:          none;
  box-shadow:      none;
  overflow:        visible;
  pointer-events:  none;
}
.vm-popup-root { pointer-events: auto; }

/* ── Card body — shared between tooltip and popup ────────────────────────── */
.vm-card {
  background:    var(--popover, oklch(0.2686 0 0));
  color:         var(--popover-foreground, oklch(0.9219 0 0));
  border:        1px solid var(--border, oklch(0.3715 0 0));
  border-radius: 0.5rem;
  box-shadow:    0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3);
  overflow:      hidden;
}

/* ── Seamless pointer arrow ───────────────────────────────────────────────
   border-top color is injected inline so it matches --popover exactly.
   margin-top: -1px closes the 1px gap left by the card border.          */
.vm-arrow {
  width:        0;
  height:       0;
  border-left:  10px solid transparent;
  border-right: 10px solid transparent;
  flex-shrink:  0;
  margin-top:   -1px;
}

/* ── Tooltip card ──────────────────────────────────────────────────────── */
.vm-tooltip-card {
  display:     flex;
  align-items: center;
  gap:         8px;
  padding:     6px 10px;
  width:       ${TOOLTIP_W}px;
  box-sizing:  border-box;
  white-space: nowrap;
}
.vm-tooltip-name {
  font-size:     12px;
  font-weight:   600;
  overflow:      hidden;
  text-overflow: ellipsis;
  flex:          1;
  line-height:   1.2;
}
.vm-tooltip-badge {
  font-size:    11px;
  font-weight:  700;
  padding:      2px 6px;
  border-radius: 4px;
  background:   color-mix(in oklch, var(--color-primary, oklch(0.837 0.128 66.29)) 20%, transparent);
  color:        var(--color-primary, oklch(0.837 0.128 66.29));
  flex-shrink:  0;
}

/* ── Popup card ────────────────────────────────────────────────────────── */
.vm-popup-card {
  width:      ${POPUP_W}px;
  cursor:     pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.vm-popup-card:hover {
  box-shadow: 0 12px 40px rgba(0,0,0,0.6),
              0 0 0 1.5px var(--color-primary, oklch(0.837 0.128 66.29));
  transform:  translateY(-1px);
}
.vm-popup-img {
  width:      100%;
  height:     110px;
  object-fit: cover;
  display:    block;
}
.vm-popup-body     { padding: 10px 12px 8px; }  /* reduced bottom: 12→8px */
.vm-popup-category {
  font-size:      10px;
  font-weight:    700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color:          var(--color-primary, oklch(0.837 0.128 66.29));
  margin-bottom:  2px;
}
.vm-popup-title    { font-size: 13px; font-weight: 700; line-height: 1.3; margin-bottom: 6px; }
.vm-popup-meta     { display: flex; align-items: center; gap: 8px; }
.vm-popup-price    { font-size: 12px; color: var(--muted-foreground, oklch(0.7155 0 0)); flex: 1; }
.vm-popup-rating   {
  display:     flex;
  align-items: center;
  gap:         3px;
  font-size:   12px;
  font-weight: 700;
  color:       var(--color-primary, oklch(0.837 0.128 66.29));
}

/* ── MapLibre NavigationControl ─────────────────────────────────────────── */
.maplibregl-ctrl-top-left { top: 12px; left: 12px; }
.maplibregl-ctrl-group {
  background:    var(--popover, oklch(0.2686 0 0)) !important;
  border:        1px solid var(--border, oklch(0.3715 0 0)) !important;
  border-radius: 8px !important;
  overflow:      hidden !important;
  box-shadow:    0 4px 16px rgba(0,0,0,0.4) !important;
}
.maplibregl-ctrl-group button {
  width:           36px !important;
  height:          36px !important;
  background:      transparent !important;
  border:          none !important;
  color:           var(--popover-foreground, oklch(0.9219 0 0)) !important;
  font-size:       18px !important;
  cursor:          pointer;
  display:         flex !important;
  align-items:     center !important;
  justify-content: center !important;
  transition:      background 0.15s ease;
}
.maplibregl-ctrl-group button:hover {
  background: var(--muted, oklch(0.2686 0 0)) !important;
}
.maplibregl-ctrl-group button + button {
  border-top: 1px solid var(--border, oklch(0.3715 0 0)) !important;
}
/* Hide compass — zoom only */
.maplibregl-ctrl-compass { display: none !important; }
`;

let cssInjected = false;

export function injectMarkerCSS(): void {
  if (cssInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = MARKER_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

// ---------------------------------------------------------------------------
// Arrow colour — must match --popover exactly for the seamless look.
// We set it as a CSS custom property reference in `border-top` so it
// automatically tracks dark/light mode switches without JS polling.
// ---------------------------------------------------------------------------

const ARROW_STYLE = `${ARROW_H}px solid var(--popover, oklch(0.2686 0 0))`;

// ---------------------------------------------------------------------------
// buildTooltipElement
// ---------------------------------------------------------------------------

export function buildTooltipElement(venue: Venue): HTMLElement {
  const root = document.createElement('div');
  root.className = 'vm-tooltip-root';

  const card = document.createElement('div');
  card.className = 'vm-card vm-tooltip-card';
  card.innerHTML = `
    <span class="vm-tooltip-name">${venue.name}</span>
    ${venue.rating != null
      ? `<span class="vm-tooltip-badge">★ ${venue.rating.toFixed(1)}</span>`
      : ''}
  `;

  const arrow = document.createElement('div');
  arrow.className = 'vm-arrow';
  arrow.style.borderTop = ARROW_STYLE;

  root.appendChild(card);
  root.appendChild(arrow);
  return root;
}

// ---------------------------------------------------------------------------
// buildPopupElement
// ---------------------------------------------------------------------------

export function buildPopupElement(
  venue: Venue,
  onVenueClick: (id: string) => void,
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'vm-popup-root';

  const card = document.createElement('div');
  card.className = 'vm-card vm-popup-card';
  card.innerHTML = `
    ${venue.image_url
      ? `<img class="vm-popup-img" src="${venue.image_url}" alt="${venue.name}"
             onerror="this.style.display='none'" />`
      : ''}
    <div class="vm-popup-body">
      <div class="vm-popup-category">${venue.category ?? ''}</div>
      <div class="vm-popup-title">${venue.name}</div>
      <div class="vm-popup-meta">
        <span class="vm-popup-price">${venue.price_range ?? ''}</span>
        ${venue.rating != null
      ? `<span class="vm-popup-rating">★ ${venue.rating.toFixed(1)}</span>`
      : ''}
      </div>
    </div>
  `;
  card.addEventListener('click', () => onVenueClick(venue.id));

  const arrow = document.createElement('div');
  arrow.className = 'vm-arrow';
  arrow.style.borderTop = ARROW_STYLE;

  root.appendChild(card);
  root.appendChild(arrow);
  return root;
}

// ---------------------------------------------------------------------------
// buildMarkerPayload
//
// Style contract:
//   background: '#00000000' — 8-digit hex (fully transparent). Arenarium's
//     Valibot schema rejects the CSS keyword 'transparent'.
//   radius: 0 — must be 0; any other value triggers Arenarium's backdrop
//     clipping rect which bleeds through the custom card corners.
//
// Pin contract:
//   We supply a 1×1 invisible div as the pin element. Without this,
//   Arenarium renders its own diamond pin at the lat/lng coordinate which
//   becomes visible whenever its layout engine shifts our tooltip aside to
//   prevent marker overlap.
// ---------------------------------------------------------------------------

/** Returns a 1×1 invisible div — suppresses Arenarium's default diamond pin. */
function buildInvisiblePin(): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:1px;height:1px;opacity:0;pointer-events:none;';
  return el;
}

export function buildMarkerPayload(
  venues: Venue[],
  onVenueClick: (id: string) => void,
) {
  return venues.map((venue, index) => ({
    id: venue.id,
    rank: index,
    lat: venue.lat,
    lng: venue.lng,
    tooltip: {
      element: buildTooltipElement(venue),
      style: { background: '#00000000', radius: 8 },
      dimensions: { width: TOOLTIP_W, height: TOOLTIP_CARD_H + ARROW_H, padding: TOOLTIP_PADDING },
    },
    pin: {
      element: buildInvisiblePin(),
      // Make Arenarium's own canvas-rendered pin shape invisible.
      // The pin graphic is drawn by Arenarium's renderer ABOVE pin.element;
      // setting all colour channels to fully-transparent hex hides it.
      style: { background: '#00000000', stroke: '#00000000', shadow: '#00000000' },
      dimensions: { radius: 1, stroke: 0 },
    },
    popup: {
      element: buildPopupElement(venue, onVenueClick),
      style: { background: '#00000000', radius: 8 },
      dimensions: { width: POPUP_W, height: POPUP_CARD_H + ARROW_H, padding: POPUP_PADDING },
    },
  }));
}
