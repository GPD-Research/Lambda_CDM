(() => {
  const C = Cosmos, $ = (id) => document.getElementById(id);
  const LOG_MIN = -36, LOG_MAX = Math.log10(C.AGE);
  const STATUS = {
    verified: ["Verified", "#4ade80"],
    lab: ["Recreated in the lab", "#38bdf8"],
    partial: ["Partly verified", "#fbbf24"],
    untested: ["Not yet verified", "#94a3b8"],
  };
  const OBSERVABLE_RADIUS_M = 4.4e26, LY_M = 9.4607e15;
  let logt = LOG_MIN, playing = false, selected = null, lastT = performance.now();

  // ---------- fixed random sky: one smooth field gives the CMB spots and seeds galaxies ----------
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const unit = () => { const z = 2 * rnd() - 1, p = 2 * Math.PI * rnd(), s = Math.sqrt(1 - z * z); return [s * Math.cos(p), s * Math.sin(p), z]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const lobes = Array.from({ length: 60 }, () => ({ n: unit(), c: 2 * rnd() - 1, w: 0.12 + 0.22 * rnd() }));
  const field = (p) => lobes.reduce((s, l) => s + l.c * Math.exp((dot(p, l.n) - 1) / (l.w * l.w)), 0);
  const SPOTS = Array.from({ length: 1100 }, () => { const p = unit(); return { p, v: field(p), ph: rnd() * 6.283, sp: 0.5 + rnd() }; });
  const vmax = Math.max(...SPOTS.map((s) => Math.abs(s.v)));
  SPOTS.forEach((s) => (s.v /= vmax));
  // Structure grows from the overdense spots, so stars and galaxies prefer them.
  const near = (s, j) => norm(s.p.map((x) => x + j * (rnd() - 0.5)));
  const pick = () => { for (;;) { const s = SPOTS[Math.floor(rnd() * SPOTS.length)]; if (rnd() < 0.08 + 0.92 * Math.max(0, s.v)) return s; } };
  const STARS = Array.from({ length: 260 }, () => ({ p: near(pick(), 0.08), born: 15.45 + 0.75 * rnd() }));
  const GALAXIES = Array.from({ length: 420 }, () => ({
    p: near(pick(), 0.1), born: 15.95 + 0.9 * rnd(), size: 0.6 + rnd(), spiral: rnd() < 0.6, ang: rnd() * Math.PI,
  }));

  // ---------- era visuals, keyed on log10(t / s) ----------
  const lerp = (a, b, f) => a + (b - a) * f;
  function track(stops, x) {
    if (x <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      const [x1, v1] = stops[i];
      if (x <= x1) {
        const [x0, v0] = stops[i - 1], f = (x - x0) / (x1 - x0);
        return Array.isArray(v0) ? v0.map((v, k) => lerp(v, v1[k], f)) : lerp(v0, v1, f);
      }
    }
    return stops[stops.length - 1][1];
  }
  const ramp = (x, a, b) => { const f = Math.min(1, Math.max(0, (x - a) / (b - a))); return f * f * (3 - 2 * f); };
  const BASE = [[-36, [255, 255, 255]], [-32, [225, 236, 255]], [-12, [255, 248, 222]], [-5, [255, 226, 150]],
    [2.5, [255, 178, 92]], [12.9, [255, 140, 62]], [13.1, [120, 40, 32]], [14, [45, 14, 22]], [15.3, [12, 10, 22]], [18, [10, 10, 24]]];
  const SPECKLE = [[-36, 0.15], [-32, 0.75], [-5, 0.75], [2.5, 0.35], [12.85, 0.15], [12.98, 0]];
  const GLOW = [[-36, 1], [-12, 0.9], [2.5, 0.55], [12.9, 0.4], [13.1, 0.05], [18, 0]];

  // Sphere radius on a compressed log scale of a, so every era stays visible.
  const SIZE = [[-52, 0.006], [-25.7, 0.16], [-10, 0.36], [-3, 0.6], [-1, 0.8], [0, 1]];

  // ---------- formatting ----------
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const sci = (x, d = 1) => {
    if (x === 0) return "0";
    const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
    return `${m.toFixed(d)} × 10${String(e).replace(/./g, (c) => SUP[c])}`;
  };
  const num = (x, d = 3) => (Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3 ? sci(x, d - 1) : Number(x.toPrecision(d)).toLocaleString());
  function fmtTime(t) {
    const yr = t / C.YEAR;
    if (t < 1e-3) return `${sci(t)} s`;
    if (t < 120) return `${num(t)} s`;
    if (t < 7200) return `${num(t / 60)} minutes`;
    if (t < 2 * 86400) return `${num(t / 3600)} hours`;
    if (yr < 1) return `${num(t / 86400)} days`;
    if (yr < 1e6) return `${Number(yr.toPrecision(3)).toLocaleString()} years`;
    if (yr < 1e9) return `${num(yr / 1e6)} million years`;
    return `${(yr / 1e9).toFixed(2)} billion years`;
  }
  function fmtEnergy(ev) {
    const u = [[1e12, "TeV"], [1e9, "GeV"], [1e6, "MeV"], [1e3, "keV"], [1, "eV"], [1e-3, "meV"]];
    for (const [s, n] of u) if (ev >= s) return ev / s >= 1e4 ? `${sci(ev / 1e9)} GeV` : `${num(ev / s)} ${n}`;
    return `${sci(ev)} eV`;
  }
  function fmtLength(m) {
    if (m < 1e-15) return `${sci(m)} m (smaller than a proton)`;
    if (m < 1e-3) return `${sci(m)} m`;
    if (m < 1e3) return `${num(m)} m`;
    if (m < 0.1 * LY_M) return `${sci(m)} m`;
    const ly = m / LY_M;
    if (ly < 1e6) return `${num(ly)} light-years`;
    if (ly < 1e9) return `${num(ly / 1e6)} million light-years`;
    return `${num(ly / 1e9)} billion light-years`;
  }

  // ---------- canvases ----------
  const sky = $("sky"), tl = $("timeline");
  let skyDims = [0, 0], tlDims = [0, 0];
  function fit(cv, dimsRef) {
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    dimsRef[0] = r.width; dimsRef[1] = r.height;
  }
  const resize = () => { fit(sky, skyDims); fit(tl, tlDims); };
  window.addEventListener("resize", resize);

  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function cmbColor(v) {
    return v < 0 ? [lerp(255, 40, -v), lerp(240, 90, -v), lerp(220, 230, -v)] : [255, lerp(240, 120, v), lerp(220, 40, v)];
  }

  function drawSky(now) {
    const [W, H] = skyDims, ctx = sky.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    const t = 10 ** logt, a = C.scaleFactor(t), la = Math.log10(a);
    const cx = W / 2, cy = H / 2 + 14, R = Math.max(1.5, track(SIZE, la) * Math.min(W, H) * 0.42);
    const base = track(BASE, logt), glow = track(GLOW, logt), speckle = track(SPECKLE, logt);
    const cmb = ramp(logt, 12.9, 13.05) * (1 - 0.97 * ramp(logt, 13.5, 15.6));
    const lambda = logt > 10 ? C.densityFractions(a).dark_energy : 0;

    if (glow > 0) {
      const g = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * (1.6 + glow));
      g.addColorStop(0, rgb(base, 0.55 * glow)); g.addColorStop(1, rgb(base, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * (1.6 + glow), 0, 6.283); ctx.fill();
    }
    if (lambda > 0.05) {
      const g = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.25);
      g.addColorStop(0, `rgba(150,120,255,${0.35 * lambda})`); g.addColorStop(1, "rgba(150,120,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, 6.283); ctx.fill();
    }
    const body = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.05, cx, cy, R);
    body.addColorStop(0, rgb(base.map((c) => Math.min(255, c * 1.15 + 20))));
    body.addColorStop(1, rgb(base.map((c) => c * 0.75)));
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();

    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip();
    const rot = now * 0.00006, cr = Math.cos(rot), sr = Math.sin(rot), tilt = 0.4, ct = Math.cos(tilt), st = Math.sin(tilt);
    const project = (p) => {
      const x = p[0] * cr + p[2] * sr, z0 = -p[0] * sr + p[2] * cr;
      const y = p[1] * ct - z0 * st, z = p[1] * st + z0 * ct;
      return [cx + R * x, cy + R * y, z];
    };
    if (R > 6 && (speckle > 0 || cmb > 0)) {
      for (const s of SPOTS) {
        const [x, y, z] = project(s.p);
        if (z <= 0) continue;
        if (speckle > 0) {
          const fl = 0.5 + 0.5 * Math.sin(now * 0.006 * s.sp + s.ph);
          ctx.fillStyle = `rgba(255,255,255,${speckle * 0.35 * fl * z})`;
          ctx.beginPath(); ctx.arc(x, y, R * 0.035 * (0.6 + z), 0, 6.283); ctx.fill();
        }
        if (cmb > 0) {
          ctx.fillStyle = rgb(cmbColor(s.v), cmb * 0.55 * z);
          ctx.beginPath(); ctx.arc(x, y, R * 0.085 * (0.4 + 0.6 * z), 0, 6.283); ctx.fill();
        }
      }
    }
    for (const s of STARS) {
      const on = ramp(logt, s.born, s.born + 0.15) * (1 - 0.6 * ramp(logt, 16.4, 17));
      if (on <= 0) continue;
      const [x, y, z] = project(s.p);
      if (z <= 0) continue;
      const r = Math.max(1, R * 0.006);
      ctx.fillStyle = `rgba(200,220,255,${on * z})`;
      ctx.shadowColor = "#9cc0ff"; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    ctx.shadowBlur = 0;
    for (const g of GALAXIES) {
      const on = ramp(logt, g.born, g.born + 0.25);
      if (on <= 0) continue;
      const [x, y, z] = project(g.p);
      if (z <= 0) continue;
      const r = Math.max(1.2, R * 0.028 * g.size);
      ctx.save(); ctx.translate(x, y); ctx.rotate(g.ang); ctx.scale(1, g.spiral ? 0.35 + 0.5 * z : 0.7);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      const col = g.spiral ? [190, 210, 255] : [255, 222, 175];
      gr.addColorStop(0, rgb([255, 250, 235], on * z)); gr.addColorStop(0.35, rgb(col, 0.8 * on * z)); gr.addColorStop(1, rgb(col, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    const limb = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
    limb.addColorStop(0, "rgba(0,0,0,0)"); limb.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = limb; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.restore();
  }

  // ---------- timeline ----------
  const PAD = 18;
  const xOf = (lt, W) => PAD + ((lt - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (W - 2 * PAD);
  const ltOf = (x, W) => LOG_MIN + ((x - PAD) / (W - 2 * PAD)) * (LOG_MAX - LOG_MIN);
  const TICKS = [[-30, "10⁻³⁰ s"], [-20, "10⁻²⁰ s"], [-10, "10⁻¹⁰ s"], [0, "1 s"], [Math.log10(3600), "1 hr"],
    [Math.log10(C.YEAR), "1 yr"], [Math.log10(1e3 * C.YEAR), "1 kyr"], [Math.log10(1e6 * C.YEAR), "1 Myr"], [Math.log10(1e9 * C.YEAR), "1 Gyr"]];
  const ERA_COLORS = ["#3b2f6b", "#5b3d7a", "#6b3f5e", "#7a4a3c", "#7a5a32", "#6e6630", "#7a4f24", "#8a3d2a", "#1f2645", "#2b3d6e", "#2f4f6e", "#3d3570"];
  const eventX = (e, W) => xOf(Math.log10(e.t), W);
  const BAND_Y = 30, BAND_H = 34, EV_Y = 92;

  function drawTimeline() {
    const [W, H] = tlDims, ctx = tl.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    C.ERAS.forEach((e, i) => {
      const x0 = xOf(Math.log10(e.start), W), x1 = i + 1 < C.ERAS.length ? xOf(Math.log10(C.ERAS[i + 1].start), W) : xOf(LOG_MAX, W);
      ctx.fillStyle = ERA_COLORS[i]; ctx.fillRect(x0, BAND_Y, x1 - x0, BAND_H);
    });
    ctx.font = "11px system-ui, sans-serif"; ctx.textBaseline = "middle";
    const SHORT = { inflation: "Inflation", radiation: "Radiation", quark_gluon_plasma: "Quark–gluon plasma", hadrons: "Hadrons", leptons: "ν", nuclei: "", opaque_plasma: "Opaque", transparent: "", dark_ages: "Dark ages", first_stars: "Stars", galaxies: "Galaxies", dark_energy: "" };
    C.ERAS.forEach((e, i) => {
      const x0 = xOf(Math.log10(e.start), W), x1 = i + 1 < C.ERAS.length ? xOf(Math.log10(C.ERAS[i + 1].start), W) : xOf(LOG_MAX, W);
      const label = SHORT[e.id];
      if (label && ctx.measureText(label).width < x1 - x0 - 6) { ctx.fillStyle = "#e8ecff"; ctx.fillText(label, x0 + 4, BAND_Y + BAND_H / 2); }
    });
    ctx.fillStyle = "#8590b8"; ctx.textBaseline = "alphabetic";
    for (const [lt, lab] of TICKS) {
      const x = xOf(lt, W);
      ctx.fillRect(x, BAND_Y - 6, 1, 6);
      ctx.fillText(lab, x - ctx.measureText(lab).width / 2, BAND_Y - 10);
    }
    ctx.strokeStyle = "#2a3563"; ctx.beginPath(); ctx.moveTo(PAD, EV_Y); ctx.lineTo(W - PAD, EV_Y); ctx.stroke();
    for (const e of C.EVENTS) {
      const x = eventX(e, W);
      ctx.fillStyle = STATUS[e.status][1];
      ctx.beginPath(); ctx.arc(x, EV_Y, e === selected ? 7 : 5, 0, 6.283); ctx.fill();
      if (e === selected) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1; }
    }
    const xc = xOf(logt, W);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(xc - 1, BAND_Y - 4, 2, EV_Y - BAND_Y + 18);
    ctx.beginPath(); ctx.moveTo(xc - 6, H - 22); ctx.lineTo(xc + 6, H - 22); ctx.lineTo(xc, H - 30); ctx.fill();
  }
  function eventAt(x, y) {
    if (Math.abs(y - EV_Y) > 12) return null;
    let best = null, bd = 10;
    for (const e of C.EVENTS) { const d = Math.abs(eventX(e, tlDims[0]) - x); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  tl.addEventListener("click", (ev) => {
    const r = tl.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, e = eventAt(x, y);
    if (e) jumpTo(e); else setLogt(ltOf(x, tlDims[0]));
  });
  tl.addEventListener("mousemove", (ev) => {
    const r = tl.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, e = eventAt(x, y), tip = $("tip");
    if (!e) { tip.style.display = "none"; return; }
    tip.textContent = `${e.name} · ${fmtTime(e.t)} · ${STATUS[e.status][0]}`;
    tip.style.display = "block";
    tip.style.left = `${Math.min(x + 12, tlDims[0] - tip.offsetWidth - 4)}px`; tip.style.top = `${y + 14}px`;
  });
  tl.addEventListener("mouseleave", () => ($("tip").style.display = "none"));
  $("keys").innerHTML = Object.values(STATUS).map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join("")
    + "<span>Click a dot for its prediction and evidence, or anywhere on the bar to jump in time.</span>";

  // ---------- panel ----------
  function updatePanel() {
    const t = 10 ** logt, a = C.scaleFactor(t), e = C.era(t), inflating = t < C.INF_END;
    $("ov-era").textContent = e.label; $("ov-time").textContent = fmtTime(t);
    $("state-label").textContent = e.label; $("state-detail").textContent = e.detail;
    $("r-time").textContent = fmtTime(t);
    const T = C.temperature(a);
    $("r-temp").textContent = inflating ? "≈ 0 K (energy is in the inflaton)" : `${num(T)} K`;
    $("r-kt").textContent = inflating ? "—" : fmtEnergy(8.617333e-5 * T);
    $("r-z").textContent = num(1 / a - 1);
    $("r-a").textContent = num(a);
    $("r-size").textContent = fmtLength(OBSERVABLE_RADIUS_M * a);
    const f = C.densityFractions(a);
    const rows = inflating ? [["Inflaton field", 1, "#c084fc"]]
      : [["Radiation", f.radiation, "#fbbf24"], ["Matter", f.matter, "#60a5fa"], ["Dark energy Λ", f.dark_energy, "#a78bfa"]];
    $("bars").innerHTML = rows.map(([n, v, c]) => `<div class="bar"><span>${n}</span><div class="track"><div class="fill" style="width:${(100 * v).toFixed(1)}%;background:${c}"></div></div><span class="pct">${v < 0.001 && v > 0 ? "<0.1" : (100 * v).toFixed(1)}%</span></div>`).join("");
    if (inflating) {
      $("eq-h").innerHTML = "H ≈ constant, a ∝ e<sup>Ht</sup>";
      $("eq-t").textContent = "During inflation the Friedmann equation is dominated by the inflaton's vacuum-like energy.";
    } else {
      const ai = 1 / a;
      $("eq-h").innerHTML = `H² = H₀²(Ω<sub>r</sub>a⁻⁴ + Ω<sub>m</sub>a⁻³ + Ω<sub>Λ</sub>)`;
      $("eq-t").innerHTML = `= H₀²(${num(C.Or * ai ** 4)} + ${num(C.Om * ai ** 3)} + ${C.Ol.toFixed(3)}) → H = ${num(C.hubble(a))} km/s/Mpc`;
    }
    const ev = selected || [...C.EVENTS].reverse().find((x) => x.t <= t * 1.0001) || C.EVENTS[0];
    $("event-name").textContent = `${ev.name} (${fmtTime(ev.t)})`;
    $("event-badge").textContent = STATUS[ev.status][0]; $("event-badge").style.background = STATUS[ev.status][1];
    $("event-pred").textContent = ev.predicted; $("event-evid").textContent = ev.evidence;
    $("t-slider").value = logt;
  }

  function setLogt(v, keepSelection = false) {
    logt = Math.min(LOG_MAX, Math.max(LOG_MIN, v));
    if (!keepSelection) selected = null;
    updatePanel();
  }
  function jumpTo(e) { selected = e; setLogt(Math.log10(e.t), true); }
  function step(dir) {
    const cur = 10 ** logt, list = dir > 0 ? C.EVENTS.filter((e) => e.t > cur * 1.001) : C.EVENTS.filter((e) => e.t < cur / 1.001).reverse();
    if (list.length) jumpTo(list[0]);
  }

  $("t-slider").max = LOG_MAX.toFixed(2);
  $("t-slider").addEventListener("input", (e) => setLogt(Number(e.target.value)));
  $("play").onclick = () => {
    if (!playing && logt >= LOG_MAX - 1e-6) setLogt(LOG_MIN);
    playing = !playing; $("play").textContent = playing ? "Pause" : "Play";
  };
  $("prev").onclick = () => step(-1);
  $("next").onclick = () => step(1);
  const syncSpeed = () => ($("speed-v").textContent = `${Number($("speed").value).toFixed(1)} decades/s`);
  $("speed").addEventListener("input", syncSpeed);

  function loop(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (playing) {
      setLogt(logt + dt * Number($("speed").value));
      if (logt >= LOG_MAX) { playing = false; $("play").textContent = "Play"; }
    }
    drawSky(now); drawTimeline();
    requestAnimationFrame(loop);
  }

  const fromHash = Number(new URLSearchParams(location.hash.slice(1)).get("t"));
  if (location.hash && Number.isFinite(fromHash)) logt = Math.min(LOG_MAX, Math.max(LOG_MIN, fromHash));
  resize(); syncSpeed(); updatePanel();
  requestAnimationFrame(loop);
})();
