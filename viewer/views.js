// View-menu insets: local structure, the Milky Way and the solar system, each following the
// timeline. All three are cartoons: schematic shapes, not survey data, and not to scale.
(function (root) {
  const C = root.Cosmos, YR = C.YEAR, LOG_NOW = Math.log10(C.AGE);
  const la = (gyr) => Math.log10(gyr * 1e9 * YR); // log10(t / s) at an age in billions of years
  const lf = (yr) => Math.log10(C.fromNow(yr)); // log10(t / s) at a time from now in years
  const ramp = (x, a, b) => { const f = Math.min(1, Math.max(0, (x - a) / (b - a))); return f * f * (3 - 2 * f); };
  const lerp = (a, b, f) => a + (b - a) * f;
  const mix = (c0, c1, f) => c0.map((v, i) => lerp(v, c1[i], f));
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function rng(seed) {
    return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * Math.cos(6.2832 * r());
  function glow(ctx, x, y, r, c, a) {
    if (a <= 0.005 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }
  function label(ctx, text, x, y, s, col = "#dfe6ff", align = "left") {
    ctx.font = `${10 * s}px system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillText(text, x + 1, y + 1);
    ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.textAlign = "start";
  }

  // ---------------- Milky Way ----------------
  const MW = (() => {
    const r = rng(7), stars = [];
    const clumps = Array.from({ length: 8 }, () => { const a = 6.283 * r(), d = 0.15 + 0.6 * r(); return [d * Math.cos(a), d * Math.sin(a)]; });
    for (let i = 0; i < 900; i++) {
      const bar = r() < 0.16, rad = Math.min(1, -Math.log(1 - 0.96 * r()) / 3.1);
      stars.push({ rad, arm: (r() * 4) | 0, j: gauss(r), rr: 6.283 * r(), bar, bu: 2 * r() - 1, bv: gauss(r),
        gx: gauss(r), gy: gauss(r), cl: clumps[(r() * 8) | 0], cx: gauss(r), cy: gauss(r), hue: r(), tail: r() });
    }
    return { stars };
  })();
  function stageMW(lt) {
    if (lt < la(0.1)) return ["Nothing yet", "Dark matter and gas are still almost smooth. Nothing that will become the Milky Way has collapsed."];
    if (lt < la(0.8)) return ["Clumps gather in a dark-matter halo", "The first stars light up in small clumps of gas falling into the dark-matter halo that will host the Milky Way."];
    if (lt < la(2.8)) return ["The young Milky Way", "By ~800 million years after the Big Bang the oldest parts are in place: a puffy, turbulent disc full of bright star-forming clumps."];
    if (lt < la(4.3)) return ["Gaia–Enceladus falls in", "About 10 billion years ago a dwarf galaxy, perhaps a quarter of the Milky Way's mass, fell in and was torn apart. Its stars now fill much of the halo (found with Gaia in 2018)."];
    if (lt < la(5.8)) return ["A thin disc and spiral arms", "Gas settles into a thin rotating disc, where most stars form from now on."];
    if (lt < la(9.2)) return ["The bar forms", "Around 8 billion years ago the inner disc buckles into a bar of old stars (the date is still debated)."];
    if (lt < la(9.9)) return ["The Sun is born", "4.6 billion years ago the Sun forms in the disc, about 26,000 light-years from the centre (the yellow dot)."];
    if (lt < LOG_NOW - 0.006) return ["Satellites pass through", "The Sagittarius dwarf galaxy plunges through the disc again and again, rippling it; the Magellanic Clouds arrive."];
    if (lt <= lf(2e8)) return ["Today: a barred spiral", "About 100,000 light-years across, with 100–400 billion stars. The yellow dot is the Sun; the two blobs are the Magellanic Clouds."];
    if (lt < lf(2.5e9)) return ["The Large Magellanic Cloud falls in", "Our biggest satellite spirals in and merges in about 2.5 billion years."];
    if (lt < lf(4.5e9)) return ["Andromeda approaches", "Andromeda closes in at 110 km/s. The model shows the classic collision in ~4.5 billion years; newer Gaia and Hubble data give only even odds of a merger within 10 billion years (Sawala et al. 2025)."];
    if (lt < lf(7e9)) return ["Collision", "The two discs pass through each other and fling out tails of stars. Stars almost never hit each other: the gaps between them are huge."];
    if (lt < lf(1e12)) return ["Milkomeda: one elliptical galaxy", "The merger leaves one smooth elliptical galaxy. With its gas used up, no new stars form and it slowly reddens."];
    if (lt < lf(1e14)) return ["Only red dwarfs still shine", "The long-lived red dwarfs are the last stars burning."];
    if (lt < lf(1e19)) return ["The last stars have died", "White dwarfs, neutron stars and black holes orbit in the dark around the central black hole."];
    if (lt < lf(1e20)) return ["The galaxy evaporates", "Close encounters fling most dead stars into intergalactic space; a few fall into the central black hole."];
    if (lt < lf(1e93)) return ["Only the central black hole is left", "The merged black hole, a few hundred million Suns, slowly evaporates by Hawking radiation over ~10⁹³ years."];
    return ["Nothing left", "The black hole has evaporated. Only faint Hawking radiation spreads through empty space."];
  }
  function drawMW(ctx, w, h, lt, now) {
    const s = Math.max(0.7, Math.min(1.3, Math.min(w, h) / 220)), cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
    const exist = ramp(lt, la(0.1), la(0.3));
    if (exist <= 0) return;
    const clumpK = 1 - ramp(lt, la(1.2), la(5));
    const infall = 1 - ramp(lt, la(0.15), la(0.9));
    const size = lerp(0.5, 1, ramp(lt, la(0.8), la(9)));
    const armK = ramp(lt, la(3.8), la(5.8)), barK = ramp(lt, la(5.3), la(6.6));
    const lmc = ramp(lt, lf(3e8), lf(2.5e9));
    const andOn = ramp(lt, lf(1.5e9), lf(2.6e9)), andP = ramp(lt, lf(2.5e9), lf(4.5e9));
    const coll = ramp(lt, lf(4.5e9), lf(7e9)), ellK = ramp(lt, lf(5.5e9), lf(8e9));
    const red = ramp(lt, lf(1e10), lf(1e14)), dead = ramp(lt, lf(3e13), lf(1e14));
    const evap = ramp(lt, lf(1e19), lf(1e20)), bhOn = ramp(lt, lf(1e14), lf(1e15));
    const bhGone = ramp(lt, lf(9e92), lf(1e93)), flash = ramp(lt, lf(7e92), lf(1e93)) * (1 - ramp(lt, lf(1e93), lf(2e93)));
    const young = 1 - 0.7 * ramp(lt, la(3), la(13));
    const rot = now * 4e-5 * (1 - ellK);
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const bright = exist * (1 - 0.55 * red) * (1 - 0.6 * dead) * (1 - evap);
    // Diffuse light under the stars.
    const core = mix([255, 236, 200], [255, 140, 90], red);
    if (bright > 0.01) {
      glow(ctx, cx, cy, R * size * (0.5 + 0.5 * (1 - clumpK)), core, 0.35 * bright * (1 - dead));
      glow(ctx, cx, cy, R * size * 0.22, [255, 245, 220], 0.6 * bright * (1 - clumpK * 0.7) * (1 - dead));
    }
    const pos = (st) => {
      const angA = st.arm * 1.5708 + 3 * Math.log(st.rad + 0.08) + st.j * 0.28;
      let x = st.rad * Math.cos(lerp(st.rr, angA, armK)), y = st.rad * Math.sin(lerp(st.rr, angA, armK));
      if (st.bar) { x = lerp(x, st.bu * 0.33, barK); y = lerp(y, st.bv * 0.05, barK); }
      const cs = 1 + 0.8 * infall;
      x = lerp(x, (st.cl[0] + st.cx * 0.07) * cs, clumpK); y = lerp(y, (st.cl[1] + st.cy * 0.07) * cs, clumpK);
      return [x, y];
    };
    const draw = (ox, oy, sc, tilt, ang, alpha, tailSide) => {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (const st of MW.stars) {
        const [x0, y0] = pos(st);
        let x = x0 * cr - y0 * sr, y = x0 * sr + y0 * cr;
        y *= tilt; [x, y] = [x * ca - y * sa, x * sa + y * ca];
        // Tidal tails: outer stars stream away during the collision.
        if (coll > 0 && st.rad > 0.55) { const k = coll * (1 - ellK) * st.tail; x += tailSide * k * 0.9; y += k * 0.5 * (st.rad - 0.4) * tailSide; }
        x = lerp(x * sc + ox, st.gx * 0.42, ellK); y = lerp(y * sc + oy, st.gy * 0.3, ellK);
        const e = 1 + 3.5 * evap * (0.5 + st.tail);
        const px = cx + R * size * x * e, py = cy + R * size * y * e;
        const blue = (st.rad > 0.3 && !st.bar ? young : young * 0.3) * (1 - ellK);
        let c = mix([255, 226, 175], [170, 200, 255], blue * (0.5 + 0.5 * st.hue));
        c = mix(mix(c, [255, 120, 70], red), [130, 130, 150], dead);
        ctx.fillStyle = rgba(c, alpha * (0.35 + 0.65 * st.hue) * (1 - 0.5 * dead));
        ctx.fillRect(px, py, 1.3 * s, 1.3 * s);
      }
    };
    if (bright > 0.005) draw(0, 0, 1, 1, 0, bright, -1);
    // Andromeda: a tilted spiral coming in from the upper right.
    if (andOn > 0 && bright > 0.005) {
      const d = lerp(2.1, 0.35, andP) * (1 - coll);
      draw(d * 0.75, -d * 0.6, 1.15, 0.38, 0.7, bright * andOn, 1);
    }
    if (bright > 0.01 && ellK > 0) glow(ctx, cx, cy, R * 0.55, core, 0.35 * ellK * bright);
    // Gaia–Enceladus: a dwarf spirals in and is shredded.
    const geP = ramp(lt, la(2.8), la(4.3)), geOn = ramp(lt, la(2.6), la(2.9)) * (1 - ramp(lt, la(4.3), la(5.4)));
    if (geOn > 0) {
      ctx.fillStyle = rgba([255, 210, 160], 0.7 * geOn);
      for (let k = 0; k < 60; k++) {
        const p = geP - k * 0.012 * ramp(geP, 0.3, 0.8); if (p < 0) break;
        const rr = 1.5 * (1 - 0.85 * p), a = 1.2 + 9 * p;
        ctx.fillRect(cx + R * rr * Math.cos(a), cy + R * rr * Math.sin(a), 1.4 * s, 1.4 * s);
      }
      const rr = 1.5 * (1 - 0.85 * geP), a = 1.2 + 9 * geP;
      glow(ctx, cx + R * rr * Math.cos(a), cy + R * rr * Math.sin(a), 9 * s, [255, 220, 170], geOn * (1 - ramp(geP, 0.55, 0.95)));
    }
    // Sagittarius dwarf and the Magellanic Clouds.
    const sgr = ramp(lt, la(7), la(8)) * (1 - ramp(lt, lf(2e8), lf(1e9)));
    if (sgr > 0) { const a = now * 3e-4; glow(ctx, cx + R * 0.95 * Math.cos(a), cy + R * 0.3 * Math.sin(a), 5 * s, [255, 225, 190], 0.8 * sgr); }
    const mc = ramp(lt, la(12), LOG_NOW - 0.004) * (1 - ramp(lt, lf(2.2e9), lf(2.6e9)));
    if (mc > 0) {
      const k = 1 - lmc;
      glow(ctx, cx + R * 1.05 * k, cy + R * 0.72 * k, 8 * s, [200, 215, 255], 0.9 * mc);
      glow(ctx, cx + R * 0.8, cy + R * 0.95, 5 * s, [200, 215, 255], 0.8 * mc * (1 - ramp(lt, lf(1e9), lf(2e9))));
    }
    // The Sun, riding the disc.
    const sun = ramp(lt, la(9.15), la(9.35)) * (1 - ramp(lt, lf(4.5e9), lf(5.5e9)));
    if (sun > 0) {
      const a = 0.9 + rot, x = cx + R * size * 0.52 * Math.cos(a), y = cy + R * size * 0.52 * Math.sin(a);
      ctx.fillStyle = rgba([255, 220, 60], sun); ctx.beginPath(); ctx.arc(x, y, 2.6 * s, 0, 6.283); ctx.fill();
      ctx.strokeStyle = rgba([255, 220, 60], sun); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 6 * s, 0, 6.283); ctx.stroke();
      label(ctx, "Sun", x + 8 * s, y, s, rgba([255, 230, 120], sun));
    }
    // The central black hole, once the stars have gone.
    if (bhOn > 0 && bhGone < 1) {
      ctx.fillStyle = "#000"; ctx.strokeStyle = rgba([190, 150, 255], 0.9 * bhOn * (1 - bhGone)); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, 5 * s, 0, 6.283); ctx.fill(); ctx.stroke();
    }
    if (flash > 0) glow(ctx, cx, cy, 30 * s, [255, 255, 255], flash);
  }

  // ---------------- Solar system ----------------
  const PLANETS = [ // name, orbit (fraction of inset radius, not to scale), size, colour
    ["Mercury", 0.1, 1.4, [180, 170, 160]], ["Venus", 0.15, 2, [235, 205, 150]], ["Earth", 0.2, 2.1, [90, 150, 255]],
    ["Mars", 0.26, 1.7, [230, 110, 70]], ["Jupiter", 0.4, 4, [225, 190, 150]], ["Saturn", 0.52, 3.4, [235, 215, 160]],
    ["Uranus", 0.63, 2.6, [160, 225, 235]], ["Neptune", 0.72, 2.5, [100, 140, 255]],
  ].map(([n, a, sz, c], i) => ({ n, a, sz, c, ph: i * 2.1 }));
  const SS = (() => {
    const r = rng(23);
    return {
      blobs: Array.from({ length: 46 }, () => ({ x: gauss(r) * 0.55, y: gauss(r) * 0.45, r: 0.12 + 0.25 * r(), a: 0.2 + 0.5 * r() })),
      field: Array.from({ length: 70 }, () => [2 * r() - 1, 2 * r() - 1, r()]),
      sn: Array.from({ length: 6 }, (_, i) => ({ x: 0.3 * gauss(r), y: 0.3 * gauss(r), at: (i + 0.5) / 6 })),
    };
  })();
  const STRETCH = " (Stretched in time: the real collapse to planets took ~100 million years.)";
  function stageSun(lt) {
    if (lt < la(8.0)) return ["Nothing yet", "Nothing that will become the solar system exists yet."];
    if (lt < la(8.6)) return ["A cold gas cloud", "Gas and dust in the Milky Way's disc, enriched by earlier stars' supernovae." + STRETCH];
    if (lt < la(9.2)) return ["The cloud collapses", "A clump of the cloud falls in on itself and starts to spin." + STRETCH];
    if (lt < la(9.4)) return ["The Sun is born, hidden in its disc", "4.6 billion years ago the new Sun lights up, buried in a spinning disc of gas and dust." + STRETCH];
    if (lt < la(9.8)) return ["Planets clear lanes in the dust", "Growing planets sweep up their paths, opening dark gaps that widen." + STRETCH];
    if (lt < la(10.4)) return ["The planets settle into orbits", "The leftover dust is blown away, leaving the eight planets." + STRETCH];
    if (lt < LOG_NOW - 0.03) return ["Circling the galaxy", "Every ~230 million years the Sun orbits the Milky Way, passing gas clouds and spiral arms."];
    if (lt < LOG_NOW - 0.012) return ["Supernovae blow the Local Bubble", "From ~14 million years ago, a string of nearby supernovae carved a hot, thin cavity about 1,000 light-years across. Squeezed into the last steps before today."];
    if (lt < LOG_NOW - 0.0005) return ["The Sun drifts into the bubble", "About 5 million years ago the Sun entered the Local Bubble."];
    if (lt <= lf(1e7)) return ["Today: inside the Local Bubble", "The Sun and eight planets, top down, inside the Local Bubble. Not to scale."];
    if (lt < lf(6e8)) return ["The Sun slowly brightens", "It grows about 10% brighter every billion years."];
    if (lt < lf(5e9)) return ["Earth is scorched", "In about a billion years the brighter Sun boils away Earth's oceans."];
    if (lt < lf(7.6e9)) return ["Red giant", "The Sun swells to about the size of Earth's orbit. Mercury and Venus are swallowed; most models say Earth is too (Schröder & Smith 2008), and if not it is scorched bare."];
    if (lt < lf(1e10)) return ["Planetary nebula", "The giant's outer layers drift off as a glowing shell, leaving a white dwarf about the size of Earth. (Really ~10,000 years, stretched here.)"];
    if (lt < lf(1e15)) return ["A cooling white dwarf", "The white dwarf slowly fades. With the Sun lighter, Mars and the giant planets orbit farther out than today."];
    if (lt < lf(1e17)) return ["A cold black dwarf", "After ~10¹⁵ years it has cooled to a dark black dwarf. Passing stars strip away the planets."];
    if (lt < lf(1e19)) return ["Alone", "A black dwarf drifting through the dead galaxy."];
    return ["Flung out of the galaxy", "Around 10¹⁹ years a close encounter throws it out of the galaxy (or into the central black hole). ΛCDM predicts nothing more for it."];
  }
  function drawSun(ctx, w, h, lt, now) {
    const s = Math.max(0.7, Math.min(1.3, Math.min(w, h) / 220)), cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.48;
    if (lt < la(8.0)) return;
    // Background stars of the galaxy, gone once it has evaporated.
    const field = ramp(lt, la(8), la(8.3)) * (1 - ramp(lt, lf(1e19), lf(1e20))) * (1 - 0.6 * ramp(lt, lf(1e13), lf(1e14)));
    ctx.fillStyle = rgba([200, 210, 255], 0.5 * field);
    for (const [x, y, b] of SS.field) ctx.fillRect(cx + x * w * 0.5, cy + y * h * 0.5, b > 0.8 ? 1.6 : 1, b > 0.8 ? 1.6 : 1);
    // Local Bubble: supernovae blow it, then the Sun drifts in.
    const bF = ramp(lt, LOG_NOW - 0.03, LOG_NOW - 0.012), bE = ramp(lt, LOG_NOW - 0.012, LOG_NOW - 0.0005);
    const bOn = (lt > LOG_NOW - 0.03 ? 1 : 0) * (1 - ramp(lt, lf(2e7), lf(3e8)));
    if (bOn > 0 && bF > 0) {
      const bx = cx + R * lerp(1.6, 0.25, bE), by = cy + R * lerp(-0.4, 0.1, bE), br = R * lerp(0.2, 1.5, bF);
      const g = ctx.createRadialGradient(bx, by, br * 0.6, bx, by, br);
      g.addColorStop(0, rgba([120, 40, 90], 0.25 * bOn)); g.addColorStop(0.92, rgba([255, 120, 170], 0.35 * bOn)); g.addColorStop(1, rgba([255, 120, 170], 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.283); ctx.fill();
      for (const sn of SS.sn) {
        const f = Math.max(0, 1 - Math.abs(bF - sn.at) * 12);
        if (f > 0 && bF < 1) glow(ctx, bx + sn.x * br, by + sn.y * br, 16 * s, [255, 255, 230], f);
      }
      if (bE < 1) label(ctx, "Local Bubble", bx, by - br * 0.75, s, rgba([255, 170, 200], bOn), "center");
    }
    // Gas cloud and its collapse.
    const cloud = ramp(lt, la(8.0), la(8.4)) * (1 - ramp(lt, la(9.0), la(9.3)));
    const col = ramp(lt, la(8.6), la(9.2)), spin = col * now * 3e-4;
    for (const b of SS.blobs) {
      if (cloud <= 0) break;
      const k = 1 - 0.8 * col, a = Math.atan2(b.y, b.x) + spin * (1.2 - Math.hypot(b.x, b.y)), d = Math.hypot(b.x, b.y) * k;
      glow(ctx, cx + R * d * Math.cos(a), cy + R * d * Math.sin(a), R * b.r * (1 - 0.4 * col), [150, 70, 60], 0.35 * b.a * cloud);
    }
    // Sun: brightness, radius and colour through its life.
    const born = ramp(lt, la(9.0), la(9.25)), hidden = 1 - ramp(lt, la(9.3), la(9.7));
    const giant = ramp(lt, lf(5e9), lf(7.6e9)), neb = ramp(lt, lf(7.6e9), lf(1e10));
    const cool = ramp(lt, lf(1e10), lf(1e15)), swell = 1 + 0.3 * ramp(lt, lf(7.6e9), lf(8.5e9));
    const strip = ramp(lt, lf(1e15), lf(1e17));
    const r0 = 5 * s, rGiant = R * 0.22;
    const giantR = lerp(r0, rGiant, giant ** 2.5), sunR = lerp(giantR, 2 * s, ramp(neb, 0, 0.25));
    let sunC = mix([255, 240, 170], [255, 110, 50], giant);
    sunC = mix(sunC, [235, 240, 255], ramp(neb, 0, 0.3));
    sunC = mix(mix(sunC, [255, 150, 90], ramp(cool, 0, 0.6)), [60, 20, 20], ramp(cool, 0.5, 1));
    // Protoplanetary disc, with lanes opening at the planets' orbits.
    const disc = ramp(lt, la(9.0), la(9.3)) * (1 - ramp(lt, la(9.8), la(10.4))), lanes = ramp(lt, la(9.35), la(9.9));
    const planets = ramp(lt, la(9.45), la(9.9));
    if (born > 0) glow(ctx, cx, cy, sunR * (3 + 2 * (1 - giant)), sunC, 0.5 * born * (1 - 0.7 * hidden * disc) * (1 - ramp(cool, 0.4, 1)));
    if (disc > 0) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.85);
      g.addColorStop(0, rgba([200, 130, 80], 0.95 * disc)); g.addColorStop(0.5, rgba([170, 100, 60], 0.75 * disc)); g.addColorStop(1, rgba([120, 70, 50], 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.85, 0, 6.283); ctx.fill();
      ctx.strokeStyle = rgba([12, 8, 20], 0.85 * disc);
      for (const p of PLANETS) {
        if (lanes <= 0) break;
        ctx.lineWidth = R * 0.035 * lanes * (0.6 + p.sz / 5); ctx.beginPath(); ctx.arc(cx, cy, R * p.a, 0, 6.283); ctx.stroke();
      }
    }
    if (born > 0) {
      ctx.fillStyle = rgba(sunC, born * (1 - 0.85 * hidden) * (1 - ramp(cool, 0.75, 1) * 0.7));
      ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, 6.283); ctx.fill();
      if (cool > 0.7) { ctx.strokeStyle = "rgba(120,110,140,0.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, 2.5 * s, 0, 6.283); ctx.stroke(); }
    }
    // Planetary nebula shell.
    const shell = ramp(neb, 0.05, 0.3) * (1 - ramp(neb, 0.6, 1));
    if (shell > 0) {
      const rr = R * lerp(0.25, 0.9, neb), g = ctx.createRadialGradient(cx, cy, rr * 0.7, cx, cy, rr);
      g.addColorStop(0, rgba([90, 220, 200], 0)); g.addColorStop(0.8, rgba([90, 220, 200], 0.4 * shell)); g.addColorStop(1, rgba([255, 90, 120], 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.283); ctx.fill();
    }
    // Planets.
    if (planets > 0) {
      const boil = ramp(lt, lf(6e8), lf(1.5e9));
      for (const p of PLANETS) {
        // Swallowed at the giant's peak size, so they stay gone once it shrinks to a white dwarf.
        const gone = p.a * R < giantR * 1.05 || (p.n === "Earth" && giant > 0.97);
        if (gone) continue;
        const orbit = R * p.a * swell * (1 + 2 * strip), a = p.ph + now * 2e-4 / p.a ** 1.5;
        const al = planets * (1 - strip);
        if (al <= 0.01) continue;
        ctx.strokeStyle = `rgba(150,160,200,${0.18 * al})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, orbit, 0, 6.283); ctx.stroke();
        const c = p.n === "Earth" ? mix(p.c, [150, 95, 60], boil) : p.c;
        ctx.fillStyle = rgba(c, al); ctx.beginPath(); ctx.arc(cx + orbit * Math.cos(a), cy + orbit * Math.sin(a), p.sz * s, 0, 6.283); ctx.fill();
        if (p.n === "Saturn") { ctx.strokeStyle = rgba(c, 0.7 * al); ctx.beginPath(); ctx.ellipse(cx + orbit * Math.cos(a), cy + orbit * Math.sin(a), p.sz * s * 1.9, p.sz * s * 0.7, 0.4, 0, 6.283); ctx.stroke(); }
        if (p.n === "Earth" && lt > LOG_NOW - 0.02 && lt < lf(7.6e9)) label(ctx, "Earth", cx + orbit * Math.cos(a) + 5 * s, cy + orbit * Math.sin(a) - 6 * s, s, rgba([170, 200, 255], al));
      }
    }
  }

  // ---------------- Local structure ----------------
  // Rough supergalactic positions in Mpc, schematic. The Local Group sits at the origin.
  const NODES = [
    ["Local Group", 0, 0, 0, 0.6], ["Virgo Cluster", -3, 14, -1, 1.4], ["Centaurus", -35, 15, -8, 1.3], ["Hydra", -25, 24, -14, 1],
    ["Great Attractor", -50, -2, 6, 1.8], ["Pavo–Indus", -35, -25, 5, 0.9], ["Perseus–Pisces", 50, -15, -15, 1.5],
    ["Coma Cluster", 0, 72, 10, 1.5], ["Shapley", -125, 75, -5, 2.2],
  ];
  const LINKS = [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 0], [4, 8], [3, 8], [1, 7], [7, 6], [0, 6], [7, 8]];
  const ATTRACT = [[4, 1.0], [8, 0.9], [6, 0.6], [7, 0.4]];
  const LANIAKEA = (th) => 70 + 10 * Math.sin(3 * th + 1) + 6 * Math.cos(5 * th);
  const LC = [-45, 5];
  const WEB = (() => {
    const r = rng(41), pts = [], extra = [];
    for (let i = 0; i < 14; i++) extra.push([-140 + 220 * r(), -60 + 150 * r(), -40 + 80 * r()]);
    const all = NODES.map((n) => [n[1], n[2], n[3]]).concat(extra);
    const links = LINKS.slice();
    extra.forEach((p, i) => {
      const d = all.map((q, j) => [Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]), j]).filter(([, j]) => j !== NODES.length + i).sort((a, b) => a[0] - b[0]);
      links.push([NODES.length + i, d[0][1]], [NODES.length + i, d[1][1]]);
    });
    for (const [a, b] of links) {
      const A = all[a], B = all[b], n = Math.round(Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) * 0.9);
      for (let k = 0; k < n; k++) { const f = r(); pts.push([lerp(A[0], B[0], f) + 2.5 * gauss(r), lerp(A[1], B[1], f) + 2.5 * gauss(r), lerp(A[2], B[2], f) + 2.5 * gauss(r), r(), 1]); }
    }
    all.forEach((p, i) => { const m = i < NODES.length ? NODES[i][4] : 0.5; for (let k = 0; k < 60 * m; k++) pts.push([p[0] + 3.5 * m * gauss(r), p[1] + 3.5 * m * gauss(r), p[2] + 3.5 * m * gauss(r), r(), i === 0 ? 0 : 1]); });
    for (let k = 0; k < 120; k++) pts.push([-140 + 220 * r(), -60 + 150 * r(), -40 + 80 * r(), r(), 1]);
    return { pts, all, links };
  })();
  const density = (x, y, grow, sp, far) => {
    let d = 0;
    WEB.all.forEach((p, i) => {
      const m = i < NODES.length ? NODES[i][4] : 0.5, k = i === 0 ? 1 : sp, dx = x - p[0] * k, dy = y - p[1] * k, s2 = 2 * (5 * m) ** 2;
      d += (i === 0 ? 1 : far) * 1.6 * m * Math.exp(-(dx * dx + dy * dy) / s2);
    });
    for (const [a, b] of WEB.links) {
      const A = WEB.all[a], B = WEB.all[b], ka = a === 0 ? 1 : sp, kb = b === 0 ? 1 : sp;
      const ax = A[0] * ka, ay = A[1] * ka, bx = B[0] * kb, by = B[1] * kb, vx = bx - ax, vy = by - ay;
      const f = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
      const dx = x - ax - f * vx, dy = y - ay - f * vy;
      d += far * 0.35 * Math.exp(-(dx * dx + dy * dy) / 40);
    }
    return grow * d;
  };
  const DENS_C = [[0, [10, 20, 70]], [0.15, [30, 70, 170]], [0.35, [60, 170, 220]], [0.55, [240, 240, 230]], [0.8, [255, 190, 70]], [1, [220, 60, 40]]];
  const dcol = (v) => { for (let i = 1; i < DENS_C.length; i++) if (v <= DENS_C[i][0]) { const [a, c0] = DENS_C[i - 1], [b, c1] = DENS_C[i]; return mix(c0, c1, (v - a) / (b - a)); } return DENS_C[DENS_C.length - 1][1]; };
  let densCache = null;
  function densityImage(w, h, grow, sp, far, box) {
    const key = `${w}|${h}|${grow.toFixed(2)}|${sp.toFixed(2)}|${far.toFixed(2)}`;
    if (densCache && densCache.key === key) return densCache.cv;
    const gw = Math.max(40, Math.round(w / 3)), gh = Math.max(30, Math.round(h / 3));
    const cv = densCache ? densCache.cv : document.createElement("canvas"); cv.width = gw; cv.height = gh;
    const g = cv.getContext("2d"), img = g.createImageData(gw, gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const [x, y] = box.inv((i + 0.5) / gw * w, (j + 0.5) / gh * h);
      const c = dcol(Math.min(1, Math.log1p(4 * density(x, y, grow, sp, far)) / Math.log1p(8)));
      const o = 4 * (j * gw + i); img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    densCache = { key, cv };
    return cv;
  }
  function viewBox(w, h) {
    const x0 = -140, x1 = 85, y0 = -62, y1 = 95, k = Math.min(w / (x1 - x0), h / (y1 - y0));
    const ox = (w - k * (x1 - x0)) / 2, oy = (h - k * (y1 - y0)) / 2;
    return { k, fwd: (x, y) => [ox + (x - x0) * k, oy + (y1 - y) * k], inv: (px, py) => [x0 + (px - ox) / k, y1 - (py - oy) / k] };
  }
  const flows = Array.from({ length: 260 }, (_, i) => ({ x: 0, y: 0, age: 1e9, seed: i }));
  const flowRng = rng(99);
  function velocity(x, y) {
    let vx = 0, vy = 0;
    const inside = Math.hypot(x - LC[0], y - LC[1]) < LANIAKEA(Math.atan2(y - LC[1], x - LC[0]));
    for (const [i, m] of ATTRACT) {
      // Inside Laniakea everything drains to the Great Attractor; outside, to the other basins.
      if (inside !== (i === 4)) continue;
      const dx = NODES[i][1] - x, dy = NODES[i][2] - y, d = Math.hypot(dx, dy) + 6;
      vx += (m * dx) / d ** 1.1; vy += (m * dy) / d ** 1.1;
    }
    return [vx, vy, inside];
  }
  const LOCAL_CAP = {
    web: "Galaxies lie along filaments around empty voids, out to ~500 million light-years. In the style of the SDSS and 2MASS maps; schematic, not survey data.",
    density: "A density map in the style of the Cosmicflows reconstructions: red is dense, blue is empty. Schematic, not survey data.",
    laniakea: "Laniakea, \"immeasurable heaven\": our supercluster, ~520 million light-years across and ~10¹⁷ Suns. Inside its orange edge, galaxies drift toward the Great Attractor (Tully et al. 2014). Schematic.",
  };
  function stageLocal(lt, tab) {
    const name = { web: "The cosmic web nearby", density: "Density of matter nearby", laniakea: "Laniakea supercluster" }[tab];
    if (lt < la(0.4)) return ["Not formed yet", "The matter that will become our neighbourhood is spread in faint ripples."];
    if (lt < la(4)) return [name + " (forming)", "Matter drains out of voids into filaments and clusters. " + LOCAL_CAP[tab]];
    if (lt <= lf(2e8)) return [name, LOCAL_CAP[tab]];
    if (lt < lf(1.5e11)) return [name + ": pulled apart", "Laniakea was never bound: dark energy pulls its clusters apart. Only our Local Group stays together, merging into one galaxy."];
    return ["Alone", "Everything beyond the merged Local Group has passed out of view."];
  }
  function drawLocal(ctx, w, h, lt, now, tab) {
    const s = Math.max(0.7, Math.min(1.3, Math.min(w, h) / 260));
    const grow = ramp(lt, la(0.3), la(8)), sp = 1 + 3 * ramp(lt, lf(5e9), lf(1.5e11));
    const far = 1 - ramp(lt, lf(5e10), lf(1.5e11));
    if (grow <= 0) return;
    const box = viewBox(w, h);
    const lgName = lt > lf(7e9) ? "Milkomeda" : "Milky Way";
    if (tab === "web") {
      const yaw = now * 1.2e-4, tilt = 0.45, cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
      const k = Math.min(w / 190, h / 95), cx0 = w / 2, cy0 = h / 2;
      const P = (p, own) => {
        // Expand about the Local Group, then centre the scene with one shared shift.
        const m = own ? 1 : sp, x = p[0] * m + 30, y = p[1] * m - 15, z = p[2] * m;
        const X = x * cy - y * sy, Y = x * sy + y * cy;
        return [cx0 + k * X, cy0 - k * (z * ct - Y * st), Y];
      };
      for (const p of WEB.pts) {
        const own = p[4] === 0, [x, y, d] = P(p, own), a = (own ? 1 : far) * grow * (0.35 + 0.5 * p[3]) * (0.7 + 0.3 * Math.tanh(-d / 80));
        if (a < 0.02) continue;
        ctx.fillStyle = rgba(p[3] > 0.85 ? [255, 220, 170] : [150, 185, 255], a);
        ctx.fillRect(x, y, 1.4 * s, 1.4 * s);
      }
      if (grow > 0.5) NODES.forEach((n, i) => {
        const own = i === 0, [x, y] = P([n[1], n[2], n[3]], own), a = own ? 1 : far;
        if (a < 0.05) return;
        if (own) { ctx.strokeStyle = "#ffd36b"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 4 * s, 0, 6.283); ctx.stroke(); }
        label(ctx, own ? `${lgName} (you are here)` : n[0], x + 6 * s, y, s, own ? "#ffd36b" : rgba([220, 228, 255], a));
      });
      return;
    }
    ctx.drawImage(densityImage(w, h, grow, sp, far, box), 0, 0, w, h);
    if (tab === "laniakea") {
      ctx.fillStyle = "rgba(5,6,13,0.45)"; ctx.fillRect(0, 0, w, h);
      const edge = far * grow;
      if (edge > 0.05) {
        ctx.strokeStyle = rgba([255, 160, 60], 0.9 * edge); ctx.fillStyle = rgba([255, 160, 60], 0.08 * edge); ctx.lineWidth = 1.6; ctx.beginPath();
        for (let i = 0; i <= 96; i++) { const th = (i / 96) * 6.2832, rr = LANIAKEA(th) * sp, [x, y] = box.fwd(LC[0] * sp + rr * Math.cos(th), LC[1] * sp + rr * Math.sin(th)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.fill(); ctx.stroke();
        // Peculiar-velocity flow: tracers drain toward each basin's attractor.
        for (const f of flows) {
          if (f.age > 160 || f.x < -140 || f.x > 85 || f.y < -62 || f.y > 95) { f.x = -140 + 225 * flowRng(); f.y = -62 + 157 * flowRng(); f.age = 0; }
          const [vx, vy, inside] = velocity(f.x / sp, f.y / sp), [x0, y0] = box.fwd(f.x, f.y);
          f.x += vx * 1.6; f.y += vy * 1.6; f.age++;
          for (const [i] of ATTRACT) if (Math.hypot(f.x - NODES[i][1] * sp, f.y - NODES[i][2] * sp) < 3) f.age = 1e9;
          const [x1, y1] = box.fwd(f.x, f.y), a = Math.sin(Math.PI * Math.min(1, f.age / 160)) * edge;
          ctx.strokeStyle = inside ? rgba([255, 235, 200], 0.8 * a) : rgba([140, 190, 255], 0.7 * a);
          ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        const [lx, ly] = box.fwd(LC[0] * sp - 10, LC[1] * sp - 52);
        label(ctx, "Laniakea", lx, ly, s * 1.2, rgba([255, 180, 90], edge), "center");
      }
    }
    if (grow > 0.5) NODES.forEach((n, i) => {
      const own = i === 0, m = own ? 1 : sp, [x, y] = box.fwd(n[1] * m, n[2] * m), a = own ? 1 : far;
      if (a < 0.05 || i === 3 || (tab === "laniakea" && i === 5)) return;
      ctx.fillStyle = own ? "#ffd36b" : rgba([255, 255, 255], a); ctx.beginPath(); ctx.arc(x, y, (own ? 2.6 : 1.8) * s, 0, 6.283); ctx.fill();
      label(ctx, own ? lgName : n[0], x + 5 * s, y + (own ? 8 : -7) * s, s, own ? "#ffd36b" : rgba([235, 240, 255], a));
    });
    if (tab === "density" && grow > 0.5 && far > 0.05) { const [x, y] = box.fwd(22, 32); label(ctx, "Local Void", x, y, s, rgba([170, 200, 255], far), "center"); }
  }

  // ---------------- panels ----------------
  const panels = {};
  function panel(id, draw, stage) {
    const el = document.getElementById(id);
    if (!el) return;
    const cv = el.querySelector("canvas");
    panels[id] = { el, cv, ctx: cv.getContext("2d"), draw, stage, w: 0, h: 0, title: el.querySelector(".vi-t"), cap: el.querySelector(".vi-c"), last: "" };
  }
  let localTab = "web";
  function init() {
    panel("vi-local", (c, w, h, lt, now) => drawLocal(c, w, h, lt, now, localTab), (lt) => stageLocal(lt, localTab));
    panel("vi-mw", drawMW, stageMW);
    panel("vi-sun", drawSun, stageSun);
    for (const b of document.querySelectorAll("#vi-local [data-tab]")) b.addEventListener("click", () => {
      localTab = b.dataset.tab;
      for (const o of document.querySelectorAll("#vi-local [data-tab]")) o.classList.toggle("on", o === b);
    });
  }
  function draw(lt, now, shown) {
    for (const [id, p] of Object.entries(panels)) {
      p.el.hidden = !shown[id];
      if (!shown[id]) continue;
      const r = p.cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      if (r.width !== p.w || r.height !== p.h) {
        p.w = r.width; p.h = r.height; p.cv.width = Math.round(p.w * d); p.cv.height = Math.round(p.h * d);
      }
      p.ctx.setTransform(d, 0, 0, d, 0, 0); p.ctx.clearRect(0, 0, p.w, p.h);
      p.ctx.save(); p.draw(p.ctx, p.w, p.h, lt, now); p.ctx.restore();
      const [t, c] = p.stage(lt);
      if (t + c !== p.last) { p.title.textContent = t; p.cap.textContent = c; p.last = t + c; }
    }
  }
  root.Views = { init, draw, setTab: (t) => { const b = document.querySelector(`#vi-local [data-tab="${t}"]`); if (b) b.click(); } };
})(this);
