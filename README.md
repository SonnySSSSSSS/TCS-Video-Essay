# TCS Video Essay

Mobile-first scrollytelling video essay inspired by the visual world of Trinh Cong Son.

## Project Structure

- `scene-1/` - Eyes to rivers transformation sequence
- `assets/` - Future visual/audio references and exported media

## Run Locally

Open `scene-1/index.html` in a browser, or serve the project with a local static server.

Example (PowerShell):

```powershell
cd "D:\Unity Apps\TCS Video Essay"
python -m http.server 5500
```

Then open `http://localhost:5500/scene-1/`.

## Scene 1 Focus

Scene 1 transitions from seeing through TCS eyes to following rivers born from tears.

Key technical goals implemented:

1. Smooth scrubbed scroll progression with no jump cuts.
2. Pool centering through separated position and scale groups.
3. Rivers fade and draw in during second-half scroll.
