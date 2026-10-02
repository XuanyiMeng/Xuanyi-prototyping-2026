"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

interface HotbarItem {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export default function StardewMiniGame() {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Game States
  const [energy, setEnergy] = useState(100);
  const [gold, setGold] = useState(1250);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [snackCount, setSnackCount] = useState(5);

  const [isNearDesk, setIsNearDesk] = useState(false);
  const [isNearBed, setIsNearBed] = useState(false);
  const [isDeskSmashed, setIsDeskSmashed] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);

  // Hotbar Items
  const hotbarItems: HotbarItem[] = [
    { id: "hammer", name: "大锤子", icon: "🔨" },
    { id: "snack", name: "甜甜圈零食", icon: "🍩", count: snackCount },
    { id: "axe", name: "木斧", icon: "🪓" },
    { id: "can", name: "浇水壶", icon: "🪴" },
  ];

  // Callbacks for React UI buttons / actions
  const triggerSmashRef = useRef<() => void>(() => {});
  const triggerSleepRef = useRef<() => void>(() => {});
  const triggerResetRef = useRef<() => void>(() => {});

  // Eat snack from hotbar
  const eatSnack = () => {
    if (snackCount > 0 && energy < 100) {
      setSnackCount((prev) => prev - 1);
      setEnergy((prev) => Math.min(100, prev + 35));
    }
  };

  useEffect(() => {
    let app: any = null;
    let isDestroyed = false;

    async function initPixi() {
      const PIXI = await import("pixi.js");

      if (!canvasRef.current || isDestroyed) return;

      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      if (PIXI.TextureSource && PIXI.TextureSource.defaultOptions) {
        PIXI.TextureSource.defaultOptions.scaleMode = "nearest";
      }

      app = new PIXI.Application();
      await app.init({
        width: containerWidth,
        height: containerHeight,
        backgroundColor: 0x2b1810, // Deep warm ambient background
        resolution: 1,
        autoDensity: true,
        resizeTo: window,
      });

      if (isDestroyed || !canvasRef.current) return;
      canvasRef.current.appendChild(app.canvas);

      if (app.canvas) {
        app.canvas.style.imageRendering = "pixelated";
      }

      const stage = app.stage;

      // Helper to process white background of image and make it completely transparent
      async function loadTransparentSpriteTexture(url: string) {
        return new Promise<any>((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imgData.data;
              // Key out white & near-white background
              for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 225 && data[i + 1] > 225 && data[i + 2] > 225) {
                  data[i + 3] = 0; // Transparent
                }
              }
              ctx.putImageData(imgData, 0, 0);
            }
            const texture = PIXI.Texture.from(canvas);
            if (texture.source) texture.source.scaleMode = "nearest";
            resolve(texture);
          };
          img.onerror = () => {
            resolve(null);
          };
          img.src = url;
        });
      }

      // --- 3D PERSPECTIVE ROOM STRUCTURE (ISOMETRIC DEPTH & LAYERS) ---
      const roomContainer = new PIXI.Container();
      stage.addChild(roomContainer);

      // World Container with Y-sorting for dynamic depth (character in front/behind furniture)
      const worldContainer = new PIXI.Container();
      worldContainer.sortableChildren = true;
      stage.addChild(worldContainer);

      const wallHeight = containerHeight * 0.38;

      // 1. 3D PERSPECTIVE WALLS (LEFT WALL PERSPECTIVE & BACK WALL)
      const wallG = new PIXI.Graphics();
      // Back Wall
      wallG.rect(0, 0, containerWidth, wallHeight);
      wallG.fill({ color: 0xf8bbd0 }); // Pastel warm pink

      // Left Wall Perspective Panel (3D Depth Angle)
      wallG.poly([0, 0, 180, 0, 140, wallHeight, 0, wallHeight]);
      wallG.fill({ color: 0xf48fb1 });

      // Right Wall Shadowing
      wallG.poly([containerWidth - 140, 0, containerWidth, 0, containerWidth, wallHeight, containerWidth - 180, wallHeight]);
      wallG.fill({ color: 0xf06292, alpha: 0.3 });

      // Elegant Lace Damask Wallpaper Dots
      for (let x = 40; x < containerWidth - 40; x += 55) {
        for (let y = 30; y < wallHeight - 30; y += 45) {
          wallG.circle(x, y, 5);
          wallG.fill({ color: 0xffffff, alpha: 0.4 });
          wallG.circle(x, y, 2.5);
          wallG.fill({ color: 0xad1457, alpha: 0.3 });
        }
      }

      // 3D White Crown Molding & Skirting Line
      wallG.rect(0, 0, containerWidth, 14);
      wallG.fill({ color: 0xffffff });
      wallG.rect(0, wallHeight - 16, containerWidth, 16);
      wallG.fill({ color: 0xffffff });
      wallG.rect(0, wallHeight - 16, containerWidth, 4);
      wallG.fill({ color: 0x8d6e63, alpha: 0.3 });
      roomContainer.addChild(wallG);

      // 2. 3D PERSPECTIVE FLOOR TILES WITH BEVEL SHADOWS
      const floorG = new PIXI.Graphics();
      floorG.rect(0, wallHeight, containerWidth, containerHeight - wallHeight);
      floorG.fill({ color: 0xfce4ec });

      const tileSize = 64;
      for (let y = wallHeight; y < containerHeight; y += tileSize) {
        for (let x = 0; x < containerWidth; x += tileSize) {
          // Perspective grid fill
          floorG.rect(x, y, tileSize - 2, tileSize - 2);
          floorG.fill({ color: ((x + y) / tileSize) % 2 === 0 ? 0xfff0f5 : 0xf8bbd0, alpha: 0.5 });
          // Tile bevel highlights
          floorG.rect(x, y, tileSize - 2, 2);
          floorG.fill({ color: 0xffffff, alpha: 0.6 });
          floorG.rect(x, y + tileSize - 4, tileSize - 2, 2);
          floorG.fill({ color: 0xf48fb1, alpha: 0.4 });
        }
      }
      roomContainer.addChild(floorG);

      // 3. OVERHEAD WARM CEILING LAMP GLOW
      const lampG = new PIXI.Graphics();
      lampG.ellipse(containerWidth * 0.5, 0, 60, 20);
      lampG.fill({ color: 0xffeb3b });
      // Ambient warm lighting cone
      lampG.ellipse(containerWidth * 0.5, wallHeight + 120, 360, 200);
      lampG.fill({ color: 0xfff8e7, alpha: 0.28 });
      roomContainer.addChild(lampG);

      // Wall Hanging Shelves with Mini Plushies
      const wallShelves = new PIXI.Graphics();
      // Wooden Shelf 1
      wallShelves.roundRect(100, 80, 140, 12, 4);
      wallShelves.fill({ color: 0x8d6e63 });
      wallShelves.stroke({ color: 0x5d4037, width: 2 });
      // Mini Plushies on Shelf 1
      wallShelves.circle(130, 65, 12); // Mini Bear
      wallShelves.fill({ color: 0xffb74d });
      wallShelves.circle(170, 65, 10); // Mini Bunny
      wallShelves.fill({ color: 0xff80ab });
      wallShelves.circle(200, 65, 11); // Mini Kitty
      wallShelves.fill({ color: 0xffffff });
      roomContainer.addChild(wallShelves);

      // --- 3D FURNITURE & PLUSHIES (ADDED TO WORLD CONTAINER WITH Y-SORTING) ---

      // 1. ELEGANT LACE DINING RUG & TABLE WITH RILAKKUMA PLUSHIE
      const diningArea = new PIXI.Container();
      diningArea.x = containerWidth * 0.5;
      diningArea.y = containerHeight * 0.65;
      diningArea.zIndex = diningArea.y;
      worldContainer.addChild(diningArea);

      // 3D Rug Shadow & Lace Rug
      const diningRugG = new PIXI.Graphics();
      diningRugG.ellipse(0, 40, 210, 110);
      diningRugG.fill({ color: 0x3e2723, alpha: 0.15 }); // 3D Shadow
      diningRugG.ellipse(0, 30, 200, 100);
      diningRugG.fill({ color: 0xfff0f5 });
      diningRugG.stroke({ color: 0xf8bbd0, width: 6 });
      diningRugG.ellipse(0, 30, 180, 88);
      diningRugG.stroke({ color: 0xf06292, width: 2 });
      diningArea.addChild(diningRugG);

      // 3D Dining Table with Lace Runner & Food
      const diningTableG = new PIXI.Graphics();
      // Table 3D Legs & Base Shadow
      diningTableG.rect(-120, 20, 16, 40);
      diningTableG.fill({ color: 0x5d4037 });
      diningTableG.rect(104, 20, 16, 40);
      diningTableG.fill({ color: 0x5d4037 });
      // Table Top (3D Perspective bevel)
      diningTableG.roundRect(-140, -30, 280, 70, 10);
      diningTableG.fill({ color: 0xfff8e7 });
      diningTableG.stroke({ color: 0x8d6e63, width: 4 });
      diningTableG.roundRect(-140, 30, 280, 12, 6); // Front bevel edge
      diningTableG.fill({ color: 0xd7ccc8 });

      // Lace Runner
      diningTableG.rect(-100, -35, 200, 80);
      diningTableG.fill({ color: 0xffffff });
      diningTableG.stroke({ color: 0xf8bbd0, width: 2 });

      // Food & Dishes (Soup, Pink Cake, Straw Drink, Cereal Box)
      diningTableG.circle(-50, -5, 14); // Plate
      diningTableG.fill({ color: 0xffffff });
      diningTableG.circle(-50, -5, 9);
      diningTableG.fill({ color: 0xffb74d });

      diningTableG.circle(20, 10, 16); // Cake Plate
      diningTableG.fill({ color: 0xf06292 });
      diningTableG.circle(20, 10, 10);
      diningTableG.fill({ color: 0xffffff });

      diningTableG.rect(70, -15, 14, 20); // Straw Drink
      diningTableG.fill({ color: 0xff80ab });
      diningTableG.rect(74, -22, 3, 10);
      diningTableG.fill({ color: 0x9c27b0 });
      diningArea.addChild(diningTableG);

      // 🧸 PLUSHIE 1: RILAKKUMA TEDDY BEAR SITTING ON DINING CHAIR (MATCHING IMAGE 2)
      const chairPlushieContainer = new PIXI.Container();
      chairPlushieContainer.x = -160;
      chairPlushieContainer.y = 10;
      diningArea.addChild(chairPlushieContainer);

      const chairG = new PIXI.Graphics();
      chairG.roundRect(-20, -10, 40, 50, 6);
      chairG.fill({ color: 0x6d4c41 });
      chairG.stroke({ color: 0x4e342e, width: 3 });
      chairG.rect(-15, -25, 30, 18); // Backrest Bow
      chairG.fill({ color: 0xffffff });
      chairPlushieContainer.addChild(chairG);

      // Rilakkuma Bear Plushie
      const bearPlushieG = new PIXI.Graphics();
      // Bear Head & Ears
      bearPlushieG.circle(0, -30, 22);
      bearPlushieG.fill({ color: 0xd7ccc8 }); // Cute light brown bear
      bearPlushieG.circle(-18, -44, 9); // Left ear
      bearPlushieG.fill({ color: 0xd7ccc8 });
      bearPlushieG.circle(-18, -44, 5);
      bearPlushieG.fill({ color: 0xffb74d }); // Inner ear
      bearPlushieG.circle(18, -44, 9); // Right ear
      bearPlushieG.fill({ color: 0xd7ccc8 });
      bearPlushieG.circle(18, -44, 5);
      bearPlushieG.fill({ color: 0xffb74d });
      // Snout & Eyes
      bearPlushieG.ellipse(0, -26, 9, 7);
      bearPlushieG.fill({ color: 0xffffff });
      bearPlushieG.circle(-8, -34, 3); // Left eye
      bearPlushieG.fill({ color: 0x3e2723 });
      bearPlushieG.circle(8, -34, 3); // Right eye
      bearPlushieG.fill({ color: 0x3e2723 });
      bearPlushieG.circle(0, -27, 2); // Nose
      bearPlushieG.fill({ color: 0x3e2723 });
      // Pink Apron / Bowtie
      bearPlushieG.ellipse(0, -5, 16, 14);
      bearPlushieG.fill({ color: 0xf48fb1 });
      chairPlushieContainer.addChild(bearPlushieG);

      // 2. PLUSH PINK SOFA WITH MY MELODY BUNNY PLUSHIE (LEFT SIDE)
      const sofaContainer = new PIXI.Container();
      sofaContainer.x = 160;
      sofaContainer.y = wallHeight + 90;
      sofaContainer.zIndex = sofaContainer.y;
      worldContainer.addChild(sofaContainer);

      const sofaG = new PIXI.Graphics();
      // 3D Sofa Base Shadow
      sofaG.ellipse(0, 45, 95, 25);
      sofaG.fill({ color: 0x3e2723, alpha: 0.15 });
      // Sofa Body
      sofaG.roundRect(-90, -10, 180, 85, 16);
      sofaG.fill({ color: 0xf48fb1 });
      sofaG.stroke({ color: 0xffffff, width: 3 });
      sofaG.roundRect(-80, -40, 160, 42, 12); // Backrest
      sofaG.fill({ color: 0xf06292 });
      sofaContainer.addChild(sofaG);

      // 🐰 PLUSHIE 2: MY MELODY PINK BUNNY PLUSHIE ON SOFA
      const bunnyPlushieG = new PIXI.Graphics();
      bunnyPlushieG.x = -35;
      bunnyPlushieG.y = 10;
      // Head & Long Bunny Ears
      bunnyPlushieG.circle(0, -25, 20);
      bunnyPlushieG.fill({ color: 0xffffff });
      bunnyPlushieG.ellipse(-10, -50, 7, 18); // Left ear
      bunnyPlushieG.fill({ color: 0xf48fb1 });
      bunnyPlushieG.ellipse(10, -50, 7, 18); // Right ear
      bunnyPlushieG.fill({ color: 0xf48fb1 });
      // Eyes & Bow
      bunnyPlushieG.circle(-6, -27, 2.5);
      bunnyPlushieG.fill({ color: 0x3e2723 });
      bunnyPlushieG.circle(6, -27, 2.5);
      bunnyPlushieG.fill({ color: 0x3e2723 });
      bunnyPlushieG.circle(0, -10, 6); // Pink Bow
      bunnyPlushieG.fill({ color: 0xff4081 });
      sofaContainer.addChild(bunnyPlushieG);

      // 3. 🧸 PLUSHIE 3: GIANT HELLO KITTY / CAT PLUSHIE SITTING ON FLOOR (RIGHT SIDE)
      const giantPlushieContainer = new PIXI.Container();
      giantPlushieContainer.x = containerWidth - 110;
      giantPlushieContainer.y = containerHeight * 0.72;
      giantPlushieContainer.zIndex = giantPlushieContainer.y;
      worldContainer.addChild(giantPlushieContainer);

      const giantPlushieG = new PIXI.Graphics();
      // Drop Shadow
      giantPlushieG.ellipse(0, 30, 45, 16);
      giantPlushieG.fill({ color: 0x3e2723, alpha: 0.2 });
      // Plushie Head & Cat Ears
      giantPlushieG.ellipse(0, -35, 38, 30);
      giantPlushieG.fill({ color: 0xffffff });
      giantPlushieG.stroke({ color: 0xf8bbd0, width: 3 });
      giantPlushieG.poly([-26, -55, -12, -75, -2, -58]); // Left ear
      giantPlushieG.fill({ color: 0xffffff });
      giantPlushieG.poly([26, -55, 12, -75, 2, -58]); // Right ear
      giantPlushieG.fill({ color: 0xffffff });
      // Pink Ribbon Bow
      giantPlushieG.circle(22, -62, 10);
      giantPlushieG.fill({ color: 0xff4081 });
      // Eyes & Yellow Nose
      giantPlushieG.ellipse(-14, -35, 4, 6);
      giantPlushieG.fill({ color: 0x3e2723 });
      giantPlushieG.ellipse(14, -35, 4, 6);
      giantPlushieG.fill({ color: 0x3e2723 });
      giantPlushieG.ellipse(0, -28, 5, 3.5);
      giantPlushieG.fill({ color: 0xffb300 });
      // Plush Body
      giantPlushieG.ellipse(0, 10, 26, 22);
      giantPlushieG.fill({ color: 0xf48fb1 });
      giantPlushieContainer.addChild(giantPlushieG);

      // 4. PINK BED (RIGHT BACKGROUND)
      const bedContainer = new PIXI.Container();
      bedContainer.x = containerWidth - 230;
      bedContainer.y = wallHeight + 40;
      bedContainer.zIndex = bedContainer.y;
      bedContainer.eventMode = "static";
      bedContainer.cursor = "pointer";
      worldContainer.addChild(bedContainer);

      const bedG = new PIXI.Graphics();
      // Bed Shadow
      bedG.ellipse(90, 140, 100, 25);
      bedG.fill({ color: 0x3e2723, alpha: 0.15 });

      bedG.rect(-10, -25, 210, 35);
      bedG.fill({ color: 0x4e342e });
      bedG.stroke({ color: 0x3e2723, width: 4 });

      bedG.rect(0, 0, 190, 150);
      bedG.fill({ color: 0xffffff });
      bedG.stroke({ color: 0x4e342e, width: 4 });

      bedG.rect(10, 15, 170, 125);
      bedG.fill({ color: 0xec407a });

      for (let qx = 20; qx < 170; qx += 30) {
        for (let qy = 25; qy < 130; qy += 30) {
          bedG.rect(qx, qy, 25, 25);
          bedG.stroke({ color: 0xf48fb1, width: 2 });
        }
      }

      bedG.rect(20, -10, 65, 36);
      bedG.fill({ color: 0xffffff });
      bedG.stroke({ color: 0x4e342e, width: 3 });

      bedG.rect(105, -10, 65, 36);
      bedG.fill({ color: 0xffffff });
      bedG.stroke({ color: 0x4e342e, width: 3 });
      bedContainer.addChild(bedG);

      const bedLabel = new PIXI.Text({
        text: "🛏️ 点击睡觉",
        style: new PIXI.TextStyle({
          fontSize: 13,
          fill: 0xffebc6,
          fontWeight: "900",
          fontFamily: "Courier New, monospace",
          stroke: { color: 0x3e2723, width: 4 },
        }),
      });
      bedLabel.x = 45;
      bedLabel.y = -50;
      bedContainer.addChild(bedLabel);

      // 5. 3D STUDY DESK (INTERACTIVE SMASH TARGET)
      const deskContainer = new PIXI.Container();
      deskContainer.x = 180;
      deskContainer.y = containerHeight * 0.52;
      deskContainer.zIndex = deskContainer.y;
      deskContainer.eventMode = "static";
      deskContainer.cursor = "pointer";
      worldContainer.addChild(deskContainer);

      const deskIntact = new PIXI.Container();
      const deskG = new PIXI.Graphics();
      // Desk Base Shadow
      deskG.ellipse(0, 60, 90, 22);
      deskG.fill({ color: 0x3e2723, alpha: 0.15 });

      // Desk Table Top (3D Depth Bevel)
      deskG.rect(-80, -35, 160, 70);
      deskG.fill({ color: 0x6d4c41 });
      deskG.stroke({ color: 0x3e2723, width: 4 });
      deskG.rect(-80, 35, 160, 10); // Front Bevel
      deskG.fill({ color: 0x4e342e });

      // Table Legs
      deskG.rect(-72, 45, 18, 35);
      deskG.fill({ color: 0x3e2723 });
      deskG.rect(54, 45, 18, 35);
      deskG.fill({ color: 0x3e2723 });

      // Homework Papers & Books
      deskG.rect(-60, -25, 45, 30);
      deskG.fill({ color: 0xffffff });
      deskG.stroke({ color: 0x3e2723, width: 2 });
      deskG.rect(-54, -18, 33, 3);
      deskG.fill({ color: 0xd50000 });

      deskG.rect(-10, -28, 42, 36);
      deskG.fill({ color: 0xd50000 });
      deskG.stroke({ color: 0x3e2723, width: 2 });

      deskG.rect(46, -18, 12, 28);
      deskG.fill({ color: 0xffb300 });
      deskG.circle(52, -22, 14);
      deskG.fill({ color: 0xffeb3b });

      deskIntact.addChild(deskG);
      deskContainer.addChild(deskIntact);

      const deskSmashedDebris = new PIXI.Container();
      deskSmashedDebris.visible = false;
      deskContainer.addChild(deskSmashedDebris);

      const deskLabel = new PIXI.Text({
        text: "📚 点击锤碎作业",
        style: new PIXI.TextStyle({
          fontSize: 13,
          fill: 0xffebc6,
          fontWeight: "900",
          fontFamily: "Courier New, monospace",
          stroke: { color: 0x3e2723, width: 4 },
        }),
      });
      deskLabel.x = -55;
      deskLabel.y = -68;
      deskContainer.addChild(deskLabel);

      // --- 3D CHARACTER SPRITE WITH NATURAL BOUNCY WALKING ANIMATION ---
      const playerContainer = new PIXI.Container();
      playerContainer.x = containerWidth * 0.5;
      playerContainer.y = containerHeight * 0.72;
      playerContainer.zIndex = playerContainer.y; // Dynamic Y-sorting
      worldContainer.addChild(playerContainer);

      // Feet Shadow
      const shadowG = new PIXI.Graphics();
      shadowG.ellipse(0, 0, 32, 12);
      shadowG.fill({ color: 0x2b1810, alpha: 0.3 });
      playerContainer.addChild(shadowG);

      let playerSprite: any = null;
      let hammerSprite: any = null;

      try {
        const charTexture = await loadTransparentSpriteTexture("/prototypes/stardew-mini-game/character.jpg");
        if (charTexture) {
          playerSprite = new PIXI.Sprite(charTexture);
          playerSprite.anchor.set(0.5, 0.95);
          playerSprite.width = 110;
          playerSprite.height = 110;
          playerContainer.addChild(playerSprite);
        }
      } catch (e) {
        console.warn("Fallback character sprite", e);
      }

      // Hammer Sprite
      try {
        const hammerTexture = await loadTransparentSpriteTexture("/prototypes/stardew-mini-game/hammer.jpg");
        if (hammerTexture) {
          hammerSprite = new PIXI.Sprite(hammerTexture);
          hammerSprite.anchor.set(0.5, 0.9);
          hammerSprite.width = 85;
          hammerSprite.height = 85;
          hammerSprite.x = 35;
          hammerSprite.y = -55;
          hammerSprite.visible = false;
          playerContainer.addChild(hammerSprite);
        }
      } catch (e) {
        console.warn("Fallback hammer sprite", e);
      }

      // Emotion / Anger Icon
      const emotionText = new PIXI.Text({
        text: "💢🔥",
        style: new PIXI.TextStyle({ fontSize: 32 }),
      });
      emotionText.anchor.set(0.5);
      emotionText.y = -130;
      emotionText.visible = false;
      playerContainer.addChild(emotionText);

      // Zzz Container
      const zzzText = new PIXI.Text({
        text: "💤 Zzz...",
        style: new PIXI.TextStyle({
          fontSize: 28,
          fill: 0xffebc6,
          fontWeight: "900",
          fontFamily: "Courier New, monospace",
          stroke: { color: 0x3e2723, width: 5 },
        }),
      });
      zzzText.anchor.set(0.5);
      zzzText.y = -135;
      zzzText.visible = false;
      playerContainer.addChild(zzzText);

      // Particle Container
      const particleContainer = new PIXI.Container();
      stage.addChild(particleContainer);

      const activeParticles: Array<{
        sprite: any;
        vx: number;
        vy: number;
        rotSpeed: number;
        alphaSpeed: number;
      }> = [];

      function spawnPaperSmashDebris(x: number, y: number) {
        for (let i = 0; i < 35; i++) {
          const paper = new PIXI.Graphics();
          paper.rect(-8, -12, 16, 24);
          paper.fill({ color: 0xffffff });
          paper.stroke({ color: Math.random() > 0.5 ? 0xd50000 : 0x1976d2, width: 2 });

          paper.x = x + (Math.random() * 60 - 30);
          paper.y = y + (Math.random() * 40 - 20);

          particleContainer.addChild(paper);
          activeParticles.push({
            sprite: paper,
            vx: (Math.random() - 0.5) * 16,
            vy: -8 - Math.random() * 10,
            rotSpeed: (Math.random() - 0.5) * 0.4,
            alphaSpeed: 0.02,
          });
        }
      }

      // Movement & Target
      const keysPressed: Record<string, boolean> = {};
      let targetPos: { x: number; y: number } | null = null;
      const speed = 5.5;

      window.addEventListener("keydown", (e) => {
        keysPressed[e.key.toLowerCase()] = true;
      });
      window.addEventListener("keyup", (e) => {
        keysPressed[e.key.toLowerCase()] = false;
      });

      // Canvas Floor Click
      app.canvas.addEventListener("pointerdown", (e: PointerEvent) => {
        const rect = app.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        if (clickY > wallHeight + 30) {
          targetPos = { x: clickX, y: clickY };
        }
      });

      // --- OBJECT CLICK EVENT HANDLERS ---
      let isBusy = false;

      // Click Desk directly to walk & smash
      deskContainer.on("pointerdown", (e) => {
        e.stopPropagation();
        targetPos = { x: deskContainer.x + 90, y: deskContainer.y + 40 };
        setTimeout(() => triggerSmash(), 300);
      });

      // Click Bed directly to walk & sleep
      bedContainer.on("pointerdown", (e) => {
        e.stopPropagation();
        targetPos = { x: bedContainer.x + 40, y: bedContainer.y + 60 };
        setTimeout(() => triggerSleep(), 300);
      });

      function triggerSmash() {
        if (isBusy) return;
        isBusy = true;

        emotionText.visible = true;
        if (hammerSprite) {
          hammerSprite.visible = true;
          hammerSprite.rotation = -Math.PI / 3;
        }

        let swingProgress = 0;
        const swingTimer = setInterval(() => {
          swingProgress += 0.18;
          if (hammerSprite) {
            hammerSprite.rotation = -Math.PI / 3 + swingProgress * (Math.PI * 0.85);
          }

          if (swingProgress >= 1) {
            clearInterval(swingTimer);

            deskIntact.visible = false;
            deskSmashedDebris.visible = true;

            deskSmashedDebris.removeChildren();
            const debrisG = new PIXI.Graphics();
            debrisG.rect(-70, 20, 50, 16);
            debrisG.fill({ color: 0x4e342e });
            debrisG.stroke({ color: 0x3e2723, width: 2 });

            debrisG.rect(20, 25, 40, 16);
            debrisG.fill({ color: 0x6d4c41 });
            debrisG.stroke({ color: 0x3e2723, width: 2 });

            for (let i = 0; i < 8; i++) {
              debrisG.rect(-50 + i * 14, 30 + (i % 3) * 5, 12, 16);
              debrisG.fill({ color: 0xffffff });
              debrisG.stroke({ color: 0xd50000, width: 1 });
            }
            deskSmashedDebris.addChild(debrisG);

            spawnPaperSmashDebris(deskContainer.x, deskContainer.y);

            // Screen Shake
            let shake = 0;
            const shakeTimer = setInterval(() => {
              shake++;
              stage.x = (Math.random() - 0.5) * 18;
              stage.y = (Math.random() - 0.5) * 18;
              if (shake > 8) {
                clearInterval(shakeTimer);
                stage.x = 0;
                stage.y = 0;
              }
            }, 30);

            setIsDeskSmashed(true);
            setEnergy((prev) => Math.max(0, prev - 20));
            setGold((prev) => prev + 50);

            setTimeout(() => {
              if (hammerSprite) hammerSprite.visible = false;
              emotionText.visible = false;
              isBusy = false;

              // AUTOMATIC DESK REPAIR AFTER 2 SECONDS
              setTimeout(() => {
                triggerResetDesk();
              }, 2000);
            }, 500);
          }
        }, 30);
      }

      function triggerSleep() {
        if (isBusy) return;
        isBusy = true;

        setIsSleeping(true);
        zzzText.visible = true;

        playerContainer.x = bedContainer.x + 80;
        playerContainer.y = bedContainer.y + 40;

        setTimeout(() => {
          setEnergy(100);
          setIsSleeping(false);
          zzzText.visible = false;
          isBusy = false;
        }, 2200);
      }

      function triggerResetDesk() {
        deskIntact.visible = true;
        deskSmashedDebris.visible = false;
        setIsDeskSmashed(false);

        // Pixel Magic Reconstruction Sparkles
        for (let i = 0; i < 20; i++) {
          const star = new PIXI.Graphics();
          star.rect(-4, -4, 8, 8);
          star.fill({ color: 0x76ff03 });
          star.stroke({ color: 0x33691e, width: 1 });

          star.x = deskContainer.x + (Math.random() * 100 - 50);
          star.y = deskContainer.y + (Math.random() * 60 - 30);
          particleContainer.addChild(star);
          activeParticles.push({
            sprite: star,
            vx: (Math.random() - 0.5) * 2,
            vy: -3 - Math.random() * 3,
            rotSpeed: 0.2,
            alphaSpeed: 0.04,
          });
        }
      }

      triggerSmashRef.current = triggerSmash;
      triggerSleepRef.current = triggerSleep;
      triggerResetRef.current = triggerResetDesk;

      // --- NATURAL CHARACTER WALKING ANIMATION & TICKER LOOP ---
      let walkAnimTime = 0;

      app.ticker.add((ticker: any) => {
        const delta = ticker.deltaTime;
        if (isSleeping) return;

        let moveX = 0;
        let moveY = 0;

        if (keysPressed["w"] || keysPressed["arrowup"]) moveY -= speed * delta;
        if (keysPressed["s"] || keysPressed["arrowdown"]) moveY += speed * delta;
        if (keysPressed["a"] || keysPressed["arrowleft"]) moveX -= speed * delta;
        if (keysPressed["d"] || keysPressed["arrowright"]) moveX += speed * delta;

        if (moveX !== 0 || moveY !== 0) {
          targetPos = null;
        } else if (targetPos) {
          const dx = targetPos.x - playerContainer.x;
          const dy = targetPos.y - playerContainer.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 6) {
            moveX = (dx / dist) * speed * delta;
            moveY = (dy / dist) * speed * delta;
          } else {
            targetPos = null;
          }
        }

        const nextX = playerContainer.x + moveX;
        const nextY = playerContainer.y + moveY;

        const minX = 60;
        const maxX = containerWidth - 60;
        const minY = wallHeight + 40;
        const maxY = containerHeight - 40;

        playerContainer.x = Math.max(minX, Math.min(maxX, nextX));
        playerContainer.y = Math.max(minY, Math.min(maxY, nextY));

        // DYNAMIC Y-SORTING FOR 3D DEPTH (CHARACTER WALKS BEHIND / IN FRONT OF FURNITURE)
        playerContainer.zIndex = playerContainer.y;

        // NATURAL CHARACTER BOUNCY WALKING CYCLE
        const isMoving = moveX !== 0 || moveY !== 0;

        if (isMoving && playerSprite) {
          walkAnimTime += delta * 0.25;

          // Directional Facing (Flip scale.x when moving left vs right)
          if (moveX < -0.1) {
            playerSprite.scale.x = -1; // Face left
          } else if (moveX > 0.1) {
            playerSprite.scale.x = 1; // Face right
          }

          // Natural vertical bouncing curve (bobbing up and down)
          const bounceY = Math.abs(Math.sin(walkAnimTime)) * 10;
          playerSprite.y = -bounceY;

          // Natural squish and stretch (elastic body deformation)
          const squish = Math.sin(walkAnimTime * 2) * 0.06;
          playerSprite.scale.y = 1 + squish;

          // Shadow pulse with bounce height
          shadowG.scale.set(1 - bounceY * 0.02, 1 - bounceY * 0.02);
          shadowG.alpha = 0.3 - bounceY * 0.01;
        } else if (playerSprite) {
          // Idle Breathing State
          playerSprite.y = 0;
          playerSprite.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.02;
          shadowG.scale.set(1, 1);
          shadowG.alpha = 0.3;
        }

        // Check Proximity
        const distDesk = Math.hypot(playerContainer.x - deskContainer.x, playerContainer.y - deskContainer.y);
        const distBed = Math.hypot(playerContainer.x - (bedContainer.x + 80), playerContainer.y - (bedContainer.y + 40));

        setIsNearDesk(distDesk < 150);
        setIsNearBed(distBed < 150);

        // Update Particles
        for (let i = activeParticles.length - 1; i >= 0; i--) {
          const p = activeParticles[i];
          p.sprite.x += p.vx;
          p.sprite.y += p.vy;
          p.sprite.rotation += p.rotSpeed;
          p.sprite.alpha -= p.alphaSpeed;

          if (p.sprite.alpha <= 0) {
            particleContainer.removeChild(p.sprite);
            p.sprite.destroy();
            activeParticles.splice(i, 1);
          }
        }
      });
    }

    initPixi();

    return () => {
      isDestroyed = true;
      if (app) {
        app.destroy(true, { children: true });
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      {/* PixiJS Canvas Host */}
      <div className={styles.canvasContainer} ref={canvasRef} />

      <Link href="/" className={styles.homeLink}>
        ← 返回原型列表
      </Link>

      {/* Stardew Valley Top-Right Pixel HUD */}
      <div className={styles.stardewHud}>
        <div className={styles.hudHeader}>
          <span>📅 第 1 天 (09:00 AM)</span>
          <div className={styles.goldBadge}>
            💰 <span>{gold}g</span>
          </div>
        </div>

        <div className={styles.staminaContainer}>
          <div className={styles.staminaLabel}>
            <span>⚡ 体力值 (STAMINA)</span>
            <span>{energy}/100</span>
          </div>
          <div className={styles.staminaBarBg}>
            <div
              className={styles.staminaBarFill}
              style={{ width: `${energy}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sleeping Night Overlay */}
      {isSleeping && (
        <div className={styles.sleepingOverlay}>
          💤 正在舒服地睡觉... 体力恢复中... ⚡
        </div>
      )}

      {/* Stardew Valley Pixel Inventory Hotbar */}
      <div className={styles.hotbarContainer}>
        {hotbarItems.map((item, idx) => (
          <div
            key={item.id}
            className={`${styles.hotbarSlot} ${
              selectedSlot === idx ? styles.hotbarSlotActive : ""
            }`}
            onClick={() => {
              setSelectedSlot(idx);
              if (item.id === "snack") eatSnack();
            }}
          >
            <span className={styles.slotNumber}>{idx + 1}</span>
            <span className={styles.slotIcon}>{item.icon}</span>
            {item.count !== undefined && (
              <span className={styles.slotCount}>x{item.count}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
