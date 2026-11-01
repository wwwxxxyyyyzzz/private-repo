# RMS visual design

The user-supplied PDFs are the visual authority. The uploaded interactive brief governs information architecture and interactions. The user's choice of PDF colors overrides the brief's earlier TBD color instruction.

## Palette

All colors are CSS variables in `dist/css/style.css`:

| Token | Source RGB | Role |
| --- | --- | --- |
| `--accent` | 180, 224, 106 | Primary voice, particle field, key actions |
| `--violet` | 137, 103, 175 | Resonant Violet |
| `--teal` | 66, 109, 101 | Forest Teal |
| `--pink` | 217, 146, 162 | Secondary expression |
| `--sand` | 225, 202, 162 | Natural material / secondary expression |

Near-black surfaces, off-white type and muted olive-gray supporting text provide contrast. Photographic imagery retains natural colors.

## Visual language

Large editorial headlines, thin rules, numbered chapters, restrained bilingual captions, generous black space. Dense grains form organic node networks. Original RMS concentric letter mark, photography, rainforests and product renders come from the supplied PDFs. Avoid generic SaaS card layouts and heavy HUD/glass decoration.

## Structure

Home → Sound Archive → Resonance Lab → Products → About. My Sounds is always accessible from the header and relevant actions. The homepage keeps its established composition. Other pages extend the same identity with distinct, purpose-driven layouts.

## Responsive design

Desktop uses hover, a large particle field and a side control rail. Mobile uses tap/drag, stacked editorial chapters and a collapsible control panel. Product hotspot coordinates use an uncropped scene aspect ratio. Core controls and page navigation remain keyboard-accessible.

## Typography and texture polish

Latin display type is locally hosted Bricolage Grotesque, instantiated at optical size 96 and width 100 while retaining variable weight. Chinese display and interface type use locally subsetted Noto Sans SC. The active WOFF2 files total about 259 KB; OFL notices accompany them in `dist/assets/fonts/`. `resonant.css` defines the current type system after the earlier layout styles. Large, tightly tracked Latin letterforms and heavier Chinese headings keep the hierarchy coherent. Mobile headline sizes are fitted separately.

The homepage “HEAR THE WILD” headline is restored to its earlier Syne 800 font, a smaller responsive scale (about 25% smaller on desktop and 12–15% smaller on mobile) and solid treatment, with the original localized pointer dispersion on WILD. The newer solid/contour/mist lettering is no longer initialized. Other site typography and flowing lab patterns remain current.

The existing black, green, teal, violet, pink and sand identity remains authoritative. Taste's pinned-poster direction (seed 347014857) guides refinement of the existing held narrative; the dealt Latin-only font pairing was adapted for the Chinese copy. Existing PDF specimen labels, numbering and thin rules remain intentional brand conventions. No replacement photographs or footage were introduced.

Every live resonance field uses independent fine grains, approximately 0.65–1.25 CSS px at default detail, with small variations in size and opacity. Density comes from real point counts: up to 65,000 anchors in Canvas and 80,000 in WebGL. No clustered noise sprites, blur, enlarged raster grain or blended flow images are used. Coherent flow deforms the individual grain positions. The original PDF palette, photography and restored homepage headline remain unchanged.
