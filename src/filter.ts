import type { FilterRefs, FilterSVGConfig, FilterSVGResult, FilterMode } from './types.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
let _uid = 0;

export function nextFilterId(prefix = 'lg'): string {
  return `${prefix}-${++_uid}`;
}

// ─── Feature detection ───────────────────────────────────────────────────────

let _supported: boolean | null = null;

export function supportsBackdropFilter(): boolean {
  if (_supported !== null) return _supported;
  const t = document.createElement('div');
  t.style.backdropFilter = 'url(#test)';
  _supported =
    !!(window as Window & { chrome?: unknown }).chrome && t.style.backdropFilter.includes('url');
  return _supported;
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function svgEl<T extends SVGElement>(tag: string, attrs: Record<string, string | number> = {}): T {
  const node = document.createElementNS(SVG_NS, tag) as T;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function feImg(id: string, w: number, h: number, result: string): SVGFEImageElement {
  const node = svgEl<SVGFEImageElement>('feImage', {
    id,
    x: 0,
    y: 0,
    width: w,
    height: h,
    result,
    preserveAspectRatio: 'none',
  });
  node.setAttribute('href', '');
  return node;
}

function setHref(node: SVGFEImageElement, url: string): void {
  node.setAttributeNS(XLINK_NS, 'xlink:href', url);
  node.setAttribute('href', url);
}

// ─── Filter builder ───────────────────────────────────────────────────────────

export function createFilterSVG(cfg: FilterSVGConfig): FilterSVGResult {
  const {
    filterId,
    width,
    height,
    blur = 0.5,
    scale = 25,
    saturation = 1.3,
    specularSlope = 0.8,
    filterMode = 'screen' as FilterMode,
  } = cfg;

  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.style.cssText = 'width:0;height:0;position:absolute;overflow:hidden;';
  svg.setAttribute('aria-hidden', 'true');

  const defs = document.createElementNS(SVG_NS, 'defs');
  const filter = svgEl<SVGFilterElement>('filter', {
    id: filterId,
    x: '-50%',
    y: '-50%',
    width: '200%',
    height: '200%',
    'color-interpolation-filters': 'sRGB',
  });

  // 1 — pre-displacement blur
  const blurEl = svgEl<SVGFEGaussianBlurElement>('feGaussianBlur', {
    in: 'SourceGraphic',
    stdDeviation: blur,
    result: 'blurred',
  });
  filter.appendChild(blurEl);

  // 2 — displacement map image
  const dispImgEl = feImg(`${filterId}-di`, width, height, 'displacement_map');
  filter.appendChild(dispImgEl);

  // 3 — displacement
  const dispMapEl = svgEl<SVGFEDisplacementMapElement>('feDisplacementMap', {
    in: 'blurred',
    in2: 'displacement_map',
    scale,
    xChannelSelector: 'R',
    yChannelSelector: 'G',
    result: 'displaced',
  });
  filter.appendChild(dispMapEl);

  // 4 — saturation
  const satEl = svgEl<SVGFEColorMatrixElement>('feColorMatrix', {
    in: 'displaced',
    type: 'saturate',
    values: saturation,
    result: 'displaced_saturated',
  });
  filter.appendChild(satEl);

  // 5 — specular image
  const specImgEl = feImg(`${filterId}-si`, width, height, 'specular_layer');
  filter.appendChild(specImgEl);

  if (filterMode === 'composite') {
    filter.appendChild(
      svgEl('feComposite', {
        in: 'displaced_saturated',
        in2: 'specular_layer',
        operator: 'in',
        result: 'specular_saturated',
      }),
    );
    const tr = svgEl('feComponentTransfer', { in: 'specular_layer', result: 'specular_faded' });
    const fa = svgEl('feFuncA', { type: 'linear', slope: specularSlope });
    tr.appendChild(fa);
    filter.appendChild(tr);
    filter.appendChild(
      svgEl('feBlend', {
        in: 'specular_saturated',
        in2: 'displaced',
        mode: 'normal',
        result: 'withSaturation',
      }),
    );
    filter.appendChild(
      svgEl('feBlend', {
        in: 'specular_faded',
        in2: 'withSaturation',
        mode: 'normal',
      }),
    );
  } else {
    const tr = svgEl('feComponentTransfer', { in: 'specular_layer', result: 'specular_faded' });
    tr.appendChild(svgEl('feFuncA', { type: 'linear', slope: specularSlope }));
    filter.appendChild(tr);
    filter.appendChild(
      svgEl('feBlend', {
        in: 'specular_faded',
        in2: 'displaced_saturated',
        mode: 'screen',
      }),
    );
  }

  defs.appendChild(filter);
  svg.appendChild(defs);

  const refs: FilterRefs = { dispImgEl, specImgEl, dispMapEl, blurEl, satEl };
  return { svg, refs };
}

export function injectImages(refs: FilterRefs, dispUrl: string, specUrl: string): void {
  setHref(refs.dispImgEl, dispUrl);
  setHref(refs.specImgEl, specUrl);
}

export function setScale(refs: FilterRefs, scale: number): void {
  refs.dispMapEl.setAttribute('scale', String(scale));
}
