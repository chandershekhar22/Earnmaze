# Design assets

Source files for design assets that are not served at runtime. Each file here is a source; the rendered output lives under [`../static/`](../static/) and is what the app ships.

## OG image

- **Source:** [`og-image.svg`](og-image.svg)
- **Output:** [`../static/og-image.png`](../static/og-image.png) (1200×630, used in Open Graph / Twitter card meta on the public landing page)

### Regenerate

Requires Inkscape, ImageMagick (`convert`), and the Inter font installed locally.

```bash
inkscape assets/og-image.svg \
  --export-type=png \
  --export-filename=/tmp/og-raw.png \
  --export-width=1200 \
  --export-height=630

convert /tmp/og-raw.png -strip -dither FloydSteinberg -colors 128 \
  PNG8:static/og-image.png
```

Inkscape rasterises the SVG (text uses the system Inter font); ImageMagick then quantises to a 128-colour palette with Floyd-Steinberg dithering, which keeps the gradient smooth while shrinking the file to ~170 KB.

### Installing Inter

If `fc-match Inter` returns something other than Inter, install it locally:

```bash
curl -sL https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip -o /tmp/inter.zip
unzip -j /tmp/inter.zip "*Inter-Bold.ttf" "*Inter-Black.ttf" "*Inter-SemiBold.ttf" \
  -d ~/.local/share/fonts/
fc-cache -f ~/.local/share/fonts/
```

### Verifying the result

After deploying, paste the production URL into:

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — forces a recrawl
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- X / Twitter — paste in any DM to preview the card
