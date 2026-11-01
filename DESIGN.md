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

Latin display type is now locally hosted Syne (400–800); Chinese display type is a locally subsetted Noto Serif SC variable font. The two WOFF2 files total about 320 KB and carry their SIL OFL notices in `dist/assets/fonts/`. Long Chinese interface copy retains readable system sans fallbacks. Main reading copy is 16 px; specimen metadata and bilingual captions preserve the supplied PDF's hierarchy. Homepage Latin lettering uses a separate fitted mobile size so the wide display face never clips.

The existing black, green, teal, violet, pink and sand identity remains authoritative. Taste's pinned-poster direction (seed 347014857) guides refinement of the existing held narrative; the dealt Latin-only font pairing was adapted for the Chinese copy. Existing PDF specimen labels, numbering and thin rules remain intentional brand conventions. No replacement photographs or footage were introduced.

The particle surface uses seeded micrograin textures rather than large square grains or constantly regenerated full-frame noise. Texture detail is visible at rest and during pointer interaction; density is preserved through textured clusters rather than unbounded particle counts.
