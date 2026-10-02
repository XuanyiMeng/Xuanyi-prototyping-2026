"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import styles from "./styles.module.css";

// Sample phrases for quick inspiration
const PRESET_PHRASES = [
  "JOURNEY",
  "EVERYTHIN HAS A VOICE",
  "MAYBE TOMORROW",
  "HAUTE COUTURE 2026",
  "DREAMING IN ITALICS",
  "HAPPY BIRTHDAY",
];

// Preset Swatch Colors for Carved Text Background
const CARVED_COLOR_SWATCHES = [
  { name: "Dark Navy Denim", value: "#131a28" },
  { name: "Crimson Velvet", value: "#5c0919" },
  { name: "Emerald Forest", value: "#064e3b" },
  { name: "Midnight Amethyst", value: "#2e1065" },
  { name: "Obsidian Ink", value: "#09090b" },
  { name: "Rose Quartz", value: "#831843" },
];

// Candle item interface
interface CandleItem {
  id: string;
  xPercent: number;
  yPercent: number;
  waxColor1: string;
  waxColor2: string;
}

// Theme configurations
type ThemeKey = "foamdenim" | "skyfoam" | "3dchrome" | "velvet" | "noir";

// Preset Style Types
type StylePresetKey = "soapcarve" | "chrome3d" | "vogue" | "dadaist";

// Letter Configuration interface
interface LetterConfig {
  id: string;
  char: string;
  fontFamily: string;
  fontClassName: string;
  fontWeight: number;
  fontOpticalSize: number;
  fontStyle: "normal" | "italic";
  textTransform: "uppercase" | "lowercase" | "none";
  scaleX: number;
  scaleY: number;
  rotateDeg: number;
  skewDeg: number;
  translateYPx: number;
}

export default function MaybeTomorrowPrototype() {
  const [sentence, setSentence] = useState("JOURNEY");
  const [seed, setSeed] = useState(42);
  const [theme, setTheme] = useState<ThemeKey>("foamdenim");
  const [preset, setPreset] = useState<StylePresetKey>("soapcarve");
  const [chaosLevel, setChaosLevel] = useState(40);
  const [weightBias, setWeightBias] = useState(800);
  const [showControls, setShowControls] = useState(true);

  // Free Custom Carved Background Color State
  const [carvedColor, setCarvedColor] = useState("#131a28");

  // Spawns Birthday Candles State
  const [candles, setCandles] = useState<CandleItem[]>([]);

  // Interactive Soap Foam Eraser States
  const [brushSize, setBrushSize] = useState(45);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const isMouseDownRef = useRef(false);

  // Simple pseudo-random generator seeded by number + index
  const seededRandom = (s: number) => {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };

  // Generate Letter styling configuration per character
  const letterConfigs = useMemo(() => {
    let seedCount = seed;

    const fontsList = [
      { name: "Pinyon Script", cssFont: "'Pinyon Script', cursive" },
      { name: "Bodoni Moda", cssFont: "'Bodoni Moda', serif" },
      { name: "Fraunces", cssFont: "'Fraunces', serif" },
      { name: "Syne", cssFont: "'Syne', sans-serif" },
      { name: "Silkscreen", cssFont: "'Silkscreen', monospace" },
    ];

    const chars = sentence.split("");
    const chaosRatio = chaosLevel / 100;

    return chars.map((char, index) => {
      seedCount += index + 1;
      const r1 = seededRandom(seedCount++);
      const r2 = seededRandom(seedCount++);
      const r3 = seededRandom(seedCount++);
      const r4 = seededRandom(seedCount++);
      const r5 = seededRandom(seedCount++);
      const r6 = seededRandom(seedCount++);
      const r7 = seededRandom(seedCount++);

      let selectedFont = fontsList[Math.floor(r1 * fontsList.length)];
      if (preset === "soapcarve") {
        if (r1 < 0.35) selectedFont = fontsList[0]; // Pinyon Script Swash
        else if (r1 < 0.65) selectedFont = fontsList[1]; // Bodoni Bold
        else if (r1 < 0.85) selectedFont = fontsList[2]; // Fraunces Soft
        else selectedFont = fontsList[3]; // Syne Fluid
      }

      const maxRotate = preset === "dadaist" ? 30 : 16;
      const maxTranslate = preset === "dadaist" ? 35 : 18;
      const maxSkew = preset === "dadaist" ? 20 : 10;

      const rotateDeg = (r2 * 2 - 1) * maxRotate * chaosRatio;
      const translateYPx = (r3 * 2 - 1) * maxTranslate * chaosRatio;
      const skewDeg = (r4 * 2 - 1) * maxSkew * chaosRatio;

      const scaleX = 1 + (r5 * 0.7 - 0.25) * chaosRatio;
      const scaleY = 1 + (r6 * 0.7 - 0.2) * chaosRatio;

      const calculatedWeight = Math.min(
        900,
        Math.max(400, Math.round(weightBias + (r7 * 300 - 150) * chaosRatio))
      );
      const fontOpticalSize = Math.round(18 + r1 * 100);
      const fontStyle: "normal" | "italic" = r2 > 0.55 ? "italic" : "normal";

      let textTransform: "uppercase" | "lowercase" | "none" = "none";
      if (preset === "dadaist") {
        textTransform = r3 > 0.5 ? "uppercase" : "lowercase";
      }

      return {
        id: `char-${index}-${char}`,
        char,
        fontFamily: selectedFont.cssFont,
        fontClassName: "",
        fontWeight: calculatedWeight,
        fontOpticalSize,
        fontStyle,
        textTransform,
        scaleX: Number(scaleX.toFixed(2)),
        scaleY: Number(scaleY.toFixed(2)),
        rotateDeg: Number(rotateDeg.toFixed(1)),
        skewDeg: Number(skewDeg.toFixed(1)),
        translateYPx: Number(translateYPx.toFixed(1)),
        isVariableFont: true,
      } as LetterConfig;
    });
  }, [sentence, seed, preset, chaosLevel, weightBias]);

  // Procedural 3D Soap Foam Carving Engine (Hollow Cutout)
  const render3DFoamCarving = useCallback(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    const width = frame.clientWidth;
    const height = frame.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    let randSeed = seed * 17;

    // STEP 1: Render 3D Volumetric Fluffy Soap Foam Mound Body
    const centerX = width / 2;
    const centerY = height / 2;
    const moundWidth = Math.min(width * 0.84, 860);
    const moundHeight = Math.min(height * 0.68, 380);

    // Draw irregular organic foam cloud clusters
    const numPuffs = 160;
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12;

    for (let i = 0; i < numPuffs; i++) {
      const angle = (i / numPuffs) * Math.PI * 2;
      const noiseR = 1 + (seededRandom(randSeed++) * 0.4 - 0.2);
      const rx = (moundWidth / 2.3) * Math.cos(angle) * noiseR;
      const ry = (moundHeight / 2.3) * Math.sin(angle) * noiseR;

      const puffX = centerX + rx;
      const puffY = centerY + ry;
      const puffR = 35 + seededRandom(randSeed++) * 55;

      const puffGrad = ctx.createRadialGradient(
        puffX - puffR * 0.3,
        puffY - puffR * 0.3,
        puffR * 0.1,
        puffX,
        puffY,
        puffR
      );
      puffGrad.addColorStop(0, "#ffffff");
      puffGrad.addColorStop(0.65, "#f1f5f9");
      puffGrad.addColorStop(0.9, "#cbd5e1");
      puffGrad.addColorStop(1, "rgba(148, 163, 184, 0.8)");

      ctx.fillStyle = puffGrad;
      ctx.beginPath();
      ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Fill inner foam core
    const coreGrad = ctx.createRadialGradient(
      centerX - 50,
      centerY - 40,
      20,
      centerX,
      centerY,
      moundWidth / 2
    );
    coreGrad.addColorStop(0, "#ffffff");
    coreGrad.addColorStop(0.7, "#f8fafc");
    coreGrad.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, moundWidth / 2.2, moundHeight / 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // STEP 2: Render 650+ Natural Soap Bubbles
    const numBubbles = 650;
    for (let i = 0; i < numBubbles; i++) {
      const bx = centerX + (seededRandom(randSeed++) - 0.5) * moundWidth * 1.05;
      const by = centerY + (seededRandom(randSeed++) - 0.5) * moundHeight * 1.05;

      const dx = (bx - centerX) / (moundWidth / 2.1);
      const dy = (by - centerY) / (moundHeight / 2.1);
      if (dx * dx + dy * dy > 1.05) continue;

      const br = 1.5 + Math.pow(seededRandom(randSeed++), 2.2) * 32;

      ctx.save();

      // Dark depth ring underneath bubble
      ctx.beginPath();
      ctx.arc(bx + 1, by + 1.5, br, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(51, 65, 85, 0.35)";
      ctx.fill();

      // Bubble translucency fill
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fill();

      // Translucent bubble rim
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
      ctx.stroke();

      // Top-left white specular highlight
      ctx.beginPath();
      ctx.arc(bx - br * 0.32, by - br * 0.32, br * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
      ctx.fill();

      ctx.restore();
    }

    // STEP 3: Carve Out / Hollow Out (泡沫中央镂空形成)
    // Stencil cut through foam, exposing the user-chosen carved color surface underneath!
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const charCount = letterConfigs.length;
    const approxLetterWidth = Math.min(75, (moundWidth * 0.75) / Math.max(1, charCount));
    const startX = centerX - (charCount * approxLetterWidth) / 2 + approxLetterWidth / 2;

    letterConfigs.forEach((config, idx) => {
      const lx = startX + idx * approxLetterWidth;
      const ly = centerY + config.translateYPx;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate((config.rotateDeg * Math.PI) / 180);
      ctx.scale(config.scaleX, config.scaleY);

      let fontSizePx = 76;
      if (config.fontFamily.includes("Pinyon")) fontSizePx = 95;
      if (config.fontFamily.includes("Silkscreen")) fontSizePx = 62;

      ctx.font = `${config.fontStyle} ${config.fontWeight} ${fontSizePx}px ${config.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.strokeText(config.char, 0, 0);
      ctx.fillText(config.char, 0, 0);

      ctx.restore();
    });

    // Carve Star Accents (★, ✦, ✧)
    const starAccents = [
      { x: centerX - moundWidth * 0.28, y: centerY - 45, size: 22, symbol: "★" },
      { x: centerX - moundWidth * 0.12, y: centerY + 55, size: 20, symbol: "✦" },
      { x: centerX + moundWidth * 0.14, y: centerY - 50, size: 22, symbol: "★" },
      { x: centerX + moundWidth * 0.28, y: centerY + 45, size: 18, symbol: "✦" },
      { x: centerX, y: centerY + 65, size: 16, symbol: "✧" },
    ];

    starAccents.forEach((star) => {
      ctx.font = `${star.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(star.symbol, star.x, star.y);
    });

    ctx.restore();

    // STEP 4: Add Inner Occlusion Rim to Carved Letter Edges
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;

    letterConfigs.forEach((config, idx) => {
      const lx = startX + idx * approxLetterWidth;
      const ly = centerY + config.translateYPx;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate((config.rotateDeg * Math.PI) / 180);
      ctx.scale(config.scaleX, config.scaleY);

      let fontSizePx = 76;
      if (config.fontFamily.includes("Pinyon")) fontSizePx = 95;
      if (config.fontFamily.includes("Silkscreen")) fontSizePx = 62;

      ctx.font = `${config.fontStyle} ${config.fontWeight} ${fontSizePx}px ${config.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
      ctx.strokeText(config.char, 0, 0);

      ctx.restore();
    });

    ctx.restore();
  }, [sentence, seed, preset, chaosLevel, weightBias, letterConfigs]);

  // Re-render 3D foam carving when phrase or parameters change
  useEffect(() => {
    render3DFoamCarving();
  }, [render3DFoamCarving]);

  // Spawns Lit Birthday Candles & Festive Candy Confetti Burst
  const spawnCandlesAndConfetti = useCallback((count: number) => {
    const waxColors = [
      ["#ff71ce", "#ffffff"],
      ["#01cdfe", "#ffffff"],
      ["#05ffa1", "#ffffff"],
      ["#ff9f43", "#ffffff"],
      ["#b967ff", "#ffffff"],
      ["#fde047", "#01cdfe"],
    ];

    const newCandles: CandleItem[] = [];
    const step = 70 / Math.max(1, count);
    const startX = 15 + step / 2;

    for (let i = 0; i < count; i++) {
      const colorPair = waxColors[i % waxColors.length];
      newCandles.push({
        id: `candle-${Date.now()}-${i}-${Math.random()}`,
        xPercent: startX + i * step + (Math.random() * 4 - 2),
        yPercent: 28 + (Math.random() * 6 - 3),
        waxColor1: colorPair[0],
        waxColor2: colorPair[1],
      });
    }

    setCandles(newCandles);

    // Burst Festive Colorful Candy Confetti Sprinkles across the screen
    confetti({
      particleCount: count * 18,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff", "#fffb96", "#ff9f43"],
    });
  }, []);

  // Listen to Number Keypresses (1-9 and 0 for 10) to spawn candles + confetti
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in input field
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key >= "1" && e.key <= "9") {
        const count = parseInt(e.key, 10);
        spawnCandlesAndConfetti(count);
      } else if (e.key === "0") {
        spawnCandlesAndConfetti(10);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [spawnCandlesAndConfetti]);

  // Erase foam under cursor/touch using globalCompositeOperation = 'destination-out'
  const eraseAtPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const radialGrad = ctx.createRadialGradient(x, y, 0, x, y, brushSize);
    radialGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
    radialGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.85)");
    radialGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = radialGrad;
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isMouseDownRef.current = true;
    eraseAtPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isMouseDownRef.current) return;
    eraseAtPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
  };

  const handlePresetSelect = (key: StylePresetKey) => {
    setPreset(key);
    if (key === "soapcarve") {
      setChaosLevel(40);
      setWeightBias(800);
      setTheme("foamdenim");
    } else if (key === "chrome3d") {
      setChaosLevel(45);
      setWeightBias(800);
      setTheme("3dchrome");
    } else if (key === "vogue") {
      setChaosLevel(40);
      setWeightBias(700);
    } else if (key === "dadaist") {
      setChaosLevel(85);
      setWeightBias(850);
    }
  };

  const getThemeClassName = () => {
    switch (theme) {
      case "foamdenim":
        return styles.themeFoamDenim;
      case "skyfoam":
        return styles.themeSkyFoam;
      case "3dchrome":
        return styles.theme3DChrome;
      case "velvet":
        return styles.themeVelvet;
      case "noir":
        return styles.themeNoir;
      default:
        return styles.themeFoamDenim;
    }
  };

  return (
    <div className={`${styles.prototypeWrapper} ${getThemeClassName()}`}>
      {/* Top Header Navigation */}
      <header className={styles.topNav}>
        <Link href="/" className={styles.backLink}>
          ← Home
        </Link>
        <div className={styles.brandTitle}>
          Maybe Tomorrow <span className={styles.brandBadge}>Foam &amp; Candle Lab</span>
        </div>
        <div className={styles.navActions}>
          <button
            className={`${styles.iconBtn} ${!showControls ? styles.iconBtnActive : ""}`}
            onClick={() => setShowControls(!showControls)}
            title="Toggle Control Panel"
          >
            {showControls ? "Hide Controls" : "Show Controls"}
          </button>
        </div>
      </header>

      {/* Interactive Control Panel */}
      <section className={`${styles.controlPanel} ${!showControls ? styles.controlPanelHidden : ""}`}>
        {/* Main Input Row */}
        <div className={styles.mainInputRow}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.sentenceInput}
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="Type your phrase or sentence here..."
              maxLength={40}
            />
          </div>
          <button
            className={styles.randomizeBtn}
            onClick={() => setSeed(Math.floor(Math.random() * 100000))}
          >
            ✦ Shuffle Foam Carving
          </button>
        </div>

        {/* Quick Phrase Chips */}
        <div className={styles.phraseChips}>
          {PRESET_PHRASES.map((phrase) => (
            <button
              key={phrase}
              className={styles.chip}
              onClick={() => setSentence(phrase)}
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Soap Foam Interactive Eraser & Candle Trigger Bar */}
        <div className={styles.foamControlBar}>
          <div className={styles.foamHint}>
            🧼 <span>Press &amp; Hold Left Mouse to Erase Foam</span>
            <span className={styles.candleHotkeyBadge}>🎂 Press Keys 1-9 to Light Candles &amp; Confetti!</span>
          </div>

          <div className={styles.candleQuickBtns}>
            <button className={styles.candleQuickBtn} onClick={() => spawnCandlesAndConfetti(1)}>
              🕯️ 1 Candle
            </button>
            <button className={styles.candleQuickBtn} onClick={() => spawnCandlesAndConfetti(3)}>
              🕯️ 3 Candles
            </button>
            <button className={styles.candleQuickBtn} onClick={() => spawnCandlesAndConfetti(5)}>
              🕯️ 5 Candles
            </button>
            <button className={styles.candleQuickBtn} onClick={() => spawnCandlesAndConfetti(9)}>
              🕯️ 9 Candles
            </button>
          </div>

          <button className={styles.resetFoamBtn} onClick={render3DFoamCarving}>
            🔄 Re-carve Foam
          </button>
        </div>

        {/* Controls Grid */}
        <div className={styles.controlsGrid}>
          {/* Custom Carved Text / Hollow Surface Color Picker */}
          <div className={styles.controlGroup}>
            <span className={styles.groupLabel}>Carved Text Background Color</span>
            <div className={styles.colorPickerRow}>
              {CARVED_COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.value}
                  className={`${styles.colorSwatch} ${
                    carvedColor === swatch.value ? styles.colorSwatchActive : ""
                  }`}
                  style={{ background: swatch.value }}
                  onClick={() => setCarvedColor(swatch.value)}
                  title={swatch.name}
                />
              ))}
              <input
                type="color"
                className={styles.customColorPickerInput}
                value={carvedColor}
                onChange={(e) => setCarvedColor(e.target.value)}
                title="Choose custom carved text background color"
              />
            </div>
          </div>

          {/* Presets */}
          <div className={styles.controlGroup}>
            <span className={styles.groupLabel}>Editorial Preset</span>
            <div className={styles.presetPills}>
              <button
                className={`${styles.presetBtn} ${preset === "soapcarve" ? styles.presetBtnActive : ""}`}
                onClick={() => handlePresetSelect("soapcarve")}
              >
                3D Foam Carved Hollow
              </button>
              <button
                className={`${styles.presetBtn} ${preset === "chrome3d" ? styles.presetBtnActive : ""}`}
                onClick={() => handlePresetSelect("chrome3d")}
              >
                3D Liquid Silver Metallic
              </button>
              <button
                className={`${styles.presetBtn} ${preset === "vogue" ? styles.presetBtnActive : ""}`}
                onClick={() => handlePresetSelect("vogue")}
              >
                Vogue Script &amp; Pixel
              </button>
              <button
                className={`${styles.presetBtn} ${preset === "dadaist" ? styles.presetBtnActive : ""}`}
                onClick={() => handlePresetSelect("dadaist")}
              >
                Dadaist Chaos
              </button>
            </div>
          </div>

          {/* Eraser Size Slider */}
          <div className={styles.controlGroup}>
            <span className={styles.groupLabel}>Foam Eraser Size</span>
            <div className={styles.sliderRow}>
              <input
                type="range"
                className={styles.sliderInput}
                min="15"
                max="90"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
              <span className={styles.sliderValue}>{brushSize}px</span>
            </div>
          </div>

          {/* Chaos Slider */}
          <div className={styles.controlGroup}>
            <span className={styles.groupLabel}>Distortion / Chaos</span>
            <div className={styles.sliderRow}>
              <input
                type="range"
                className={styles.sliderInput}
                min="0"
                max="100"
                value={chaosLevel}
                onChange={(e) => setChaosLevel(Number(e.target.value))}
              />
              <span className={styles.sliderValue}>{chaosLevel}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Poster Stage */}
      <main className={styles.posterStage}>
        <div
          className={styles.posterFrame}
          ref={frameRef}
          style={{ background: carvedColor }}
        >
          {/* Interactive Procedural 3D Soap Foam Canvas Layer */}
          <canvas
            ref={canvasRef}
            className={styles.foamCanvas}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />

          {/* Lit Birthday Candles Layer */}
          {candles.length > 0 && (
            <div className={styles.candleLayer}>
              {candles.map((candle) => (
                <div
                  key={candle.id}
                  className={styles.candleWrapper}
                  style={{
                    left: `${candle.xPercent}%`,
                    top: `${candle.yPercent}%`,
                  }}
                >
                  <div className={styles.candleFlame} />
                  <div className={styles.candleWick} />
                  <div
                    className={styles.candleBody}
                    style={
                      {
                        "--wax-color1": candle.waxColor1,
                        "--wax-color2": candle.waxColor2,
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Header Metadata */}
          <div className={styles.posterHeaderMeta}>
            <span>Vol. 05 / Foam &amp; Candles</span>
            <span className={styles.editorialNumber}>№ 2026</span>
            <span>Press 1-9 for Birthday Candles</span>
          </div>

          {/* Footer Metadata */}
          <div className={styles.posterFooterMeta}>
            <span>Hollow Carved Foam Surface</span>
            <span>Hold &amp; Drag Left Mouse Button to Wipe Foam</span>
            <span>Confetti &amp; Birthday Candle Engine</span>
          </div>
        </div>
      </main>
    </div>
  );
}
