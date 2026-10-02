# Prototype: Maybe Tomorrow

An expressive, fashion-editorial custom typography generator that explores the creative capabilities of pure CSS and variable fonts.

## Features

- **Dynamic Typographic Composition**: Transforms any user-typed sentence into a high-fashion graphical poster layout.
- **Variable Font Integration**: Uses Google Variable Fonts (`Fraunces`, `Playfair Display`, `Bodoni Moda`, `Syne`) with live `font-variation-settings` controls for weight, optical size, and slant.
- **Editorial Contrast**: Blends bold geometric sans-serifs with fluid italic script and high-contrast serifs within single words and sentences.
- **CSS Letter Distortions**: Procedurally applies extreme letter transforms including scale (`scaleX`, `scaleY`), rotation, skew, baseline shifts (`translateY`), overlapping letter-spacing, swashes, and text clipping.
- **Interactive Controls & Presets**: Select from presets (*Vogue Editorial*, *Dadaist Chaos*, *Soft Feminine Dream*, *Cyber Avant-Garde*), adjust chaos intensity sliders, fine-tune individual letter styling, and toggle fullscreen poster view.
- **Pure CSS**: Implemented without external heavy graphic libraries.

## Setup & Running

This prototype runs as part of the Next.js app workspace:

```bash
npm run dev
```

Navigate to `http://localhost:3000/prototypes/maybe-tomorrow` in your browser.
