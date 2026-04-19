# Hyperframes upstream issue

Filed: [heygen-com/hyperframes#334](https://github.com/heygen-com/hyperframes/issues/334)

---

## Title

`producer@0.4.4`: auto-worker mode times out on trivial image-only compositions

## Body

### Summary

With `workers` unset (auto), `executeRenderJob` times out after ~45s on a **2-clip, 6-second, image-only** composition. Setting `workers: 1` makes the identical render succeed in ~9s. The warning message says *"Video-heavy compositions often need sequential capture"*, but this composition has `videoCount: 0` and `audioCount: 0`.

This suggests auto-worker detection is misconfiguring the capture pipeline for simple static compositions (or the threshold is wrong), not that the composition is genuinely heavy.

### Environment

| | |
|---|---|
| `@hyperframes/producer` | `0.4.4` |
| OS | macOS 26.3.1 (arm64) |
| Node | v24.14.0 (reproduced locally); package `engines.node: ">=20"` |
| Chrome | 147.0.7727.101 (system Chrome, not puppeteer headless shell) |

### Reproduction

```ts
import { createRenderJob, executeRenderJob, type RenderConfig } from "@hyperframes/producer";

const config: RenderConfig = {
  fps: 30,
  quality: "draft",
  format: "mp4",
  entryFile: "index.html",
  crf: 28,
  // workers: 1,  // <-- uncomment to make it work
};
const job = createRenderJob(config);
await executeRenderJob(job, projectDir, outputPath);
```

Where `projectDir` contains an `index.html` with:

- `window.__hf.duration = 6`
- `window.__hf.media = []`
- `window.__hf.seek(t)` that swaps visibility between two `<img>` elements

Full reproducer HTML (auto-generated from our timeline compiler): see [this gist placeholder] or minimal version below.

<details>
<summary>Minimal index.html</summary>

```html
<!DOCTYPE html>
<html><head>
<style>
  html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #000; }
  .clip { position: absolute; inset: 0; display: none; }
</style>
</head><body>
  <div id="clip-1" class="clip"><img src="assets/frame-a.jpg" style="width:100%;height:100%;object-fit:cover;"></div>
  <div id="clip-2" class="clip"><img src="assets/frame-b.jpg" style="width:100%;height:100%;object-fit:cover;"></div>
<script>
  var CLIPS = [
    { id: "clip-1", startTime: 0, duration: 3 },
    { id: "clip-2", startTime: 3, duration: 3 },
  ];
  window.__hf = {
    duration: 6,
    media: [],
    seek: function (t) {
      for (var i = 0; i < CLIPS.length; i++) {
        var c = CLIPS[i];
        var el = document.getElementById(c.id);
        el.style.display = (t >= c.startTime && t < c.startTime + c.duration) ? "block" : "none";
      }
    }
  };
</script>
</body></html>
```

</details>

### Observed

```
[INFO] Compiled composition metadata {"entryFile":"index.html","staticDuration":0,"width":1080,"height":1920,"videoCount":0,"audioCount":0}
[INFO] Probed composition duration from browser {"discoveredDuration":6,"staticDuration":0}
[WARN] Parallel capture timed out with auto workers. Video-heavy compositions often need sequential capture. Retry with --workers 1
[hyperframes] render failed.
```

Duration: ~45s before the error surfaces. Error bubbles up as *"Waiting failed"* / *"Navigation timeout"* from Puppeteer.

### Expected

A 2-clip, 6s, image-only render completing within seconds (matches `workers: 1` behavior at 9.4s).

### Workaround

```ts
const config: RenderConfig = {
  fps: 30,
  quality: "draft",
  entryFile: "index.html",
  workers: 1,  // <-- force sequential
};
```

### Suggested fixes (any of)

1. **Auto-worker should detect `videoCount === 0` and fall back to `workers: 1`.** The warning already knows this is the escape hatch — the logic just isn't being applied proactively.
2. **Tune the auto-worker parallel timeout** so small comps aren't judged by the same threshold as video-heavy ones.
3. **Document that `workers: 1` is the safe default for static / image-only comps**, and consider making it the library default until auto-mode heuristics are solid.

### Downstream

We shipped `workers: 1` as our adapter default today ([vericontext/vibeframe@634ef1d](https://github.com/vericontext/vibeframe/commit/634ef1d)). Happy to provide logs, flame graphs, or the full compiled HTML if useful.
