"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

export default function PinkRoomSmash() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isNearDesk, setIsNearDesk] = useState(false);
  const [isSmashed, setIsSmashed] = useState(false);
  const [smashCount, setSmashCount] = useState(0);

  // References to trigger actions from React buttons
  const triggerSmashRef = useRef<() => void>(() => {});
  const triggerResetRef = useRef<() => void>(() => {});

  useEffect(() => {
    let app: any = null;
    let isDestroyed = false;

    async function initPixi() {
      const PIXI = await import("pixi.js");

      if (!canvasRef.current || isDestroyed) return;

      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      // 1. Initialize PixiJS Application (v8 API)
      app = new PIXI.Application();
      await app.init({
        width: containerWidth,
        height: containerHeight,
        backgroundColor: 0xfce4ec, // Soft pastel pink room background
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: window,
      });

      if (isDestroyed || !canvasRef.current) return;
      canvasRef.current.appendChild(app.canvas);

      // --- SCENE SETUP ---
      const stage = app.stage;

      // 2. Room Background Container
      const roomContainer = new PIXI.Container();
      stage.addChild(roomContainer);

      // 2a. Draw Pink Wallpaper & Floor
      const wallHeight = containerHeight * 0.35;

      // Wall
      const wallGraphics = new PIXI.Graphics();
      wallGraphics.rect(0, 0, containerWidth, wallHeight);
      wallGraphics.fill({ color: 0xf8bbd0 });

      // Wall stripes
      for (let x = 0; x < containerWidth; x += 60) {
        wallGraphics.rect(x, 0, 30, wallHeight);
        wallGraphics.fill({ color: 0xf48fb1, alpha: 0.3 });
      }
      // Wall molding line
      wallGraphics.rect(0, wallHeight - 8, containerWidth, 8);
      wallGraphics.fill({ color: 0xffffff, alpha: 0.8 });
      roomContainer.addChild(wallGraphics);

      // Floor
      const floorGraphics = new PIXI.Graphics();
      floorGraphics.rect(0, wallHeight, containerWidth, containerHeight - wallHeight);
      floorGraphics.fill({ color: 0xfce4ec });

      // Soft parquet tile grid
      for (let y = wallHeight; y < containerHeight; y += 80) {
        for (let x = 0; x < containerWidth; x += 80) {
          floorGraphics.rect(x, y, 78, 78);
          floorGraphics.stroke({ color: 0xf8bbd0, width: 1.5, alpha: 0.4 });
        }
      }
      roomContainer.addChild(floorGraphics);

      // 2b. Cute Room Furniture Decor (Pink Bed, Sofa, Rug)
      // Pink Rug under room center
      const rug = new PIXI.Graphics();
      rug.ellipse(containerWidth * 0.5, containerHeight * 0.65, 260, 150);
      rug.fill({ color: 0xfff0f5 });
      rug.stroke({ color: 0xf8bbd0, width: 4 });
      roomContainer.addChild(rug);

      // Cozy Sofa (Left side)
      const sofa = new PIXI.Container();
      sofa.x = 120;
      sofa.y = wallHeight + 40;
      const sofaG = new PIXI.Graphics();
      sofaG.roundRect(0, 0, 180, 90, 20);
      sofaG.fill({ color: 0xf48fb1 });
      sofaG.roundRect(15, -25, 150, 45, 15); // Backrest
      sofaG.fill({ color: 0xf06292 });
      sofaG.ellipse(40, 45, 25, 20); // Pillows
      sofaG.fill({ color: 0xffffff });
      sofaG.ellipse(140, 45, 25, 20);
      sofaG.fill({ color: 0xff4081 });
      sofa.addChild(sofaG);
      roomContainer.addChild(sofa);

      // Cute Pink Bed (Right top side)
      const bed = new PIXI.Container();
      bed.x = containerWidth - 240;
      bed.y = wallHeight + 10;
      const bedG = new PIXI.Graphics();
      bedG.roundRect(0, 0, 190, 140, 16);
      bedG.fill({ color: 0xffffff }); // Blanket
      bedG.roundRect(10, 10, 170, 120, 12);
      bedG.fill({ color: 0xff80ab });
      bedG.roundRect(-10, -20, 210, 30, 8); // Headboard
      bedG.fill({ color: 0xd81b60 });
      bedG.roundRect(20, -10, 60, 35, 10); // Pillows
      bedG.fill({ color: 0xffffff });
      bedG.roundRect(100, -10, 60, 35, 10);
      bedG.fill({ color: 0xffffff });
      bed.addChild(bedG);
      roomContainer.addChild(bed);

      // --- STUDY DESK (TARGET TO SMASH) ---
      const deskContainer = new PIXI.Container();
      deskContainer.x = containerWidth * 0.5 - 60;
      deskContainer.y = containerHeight * 0.5;
      stage.addChild(deskContainer);

      // Intact Desk Graphics
      const deskIntact = new PIXI.Container();
      const deskG = new PIXI.Graphics();
      // Desk Top
      deskG.roundRect(-80, -35, 160, 70, 12);
      deskG.fill({ color: 0x8d6e63 }); // Brown wooden desk
      deskG.stroke({ color: 0x5d4037, width: 3 });
      // Desk Legs
      deskG.rect(-70, 35, 16, 45);
      deskG.fill({ color: 0x5d4037 });
      deskG.rect(54, 35, 16, 45);
      deskG.fill({ color: 0x5d4037 });

      // Homework Stacks & Laptop / Lamp on Desk
      // Stacks of Homework Papers
      deskG.rect(-60, -25, 45, 30);
      deskG.fill({ color: 0xffffff });
      deskG.stroke({ color: 0xe0e0e0, width: 1 });
      deskG.rect(-55, -20, 35, 2); // Text lines on paper
      deskG.fill({ color: 0xe91e63 });
      deskG.rect(-55, -15, 25, 2);
      deskG.fill({ color: 0x3f51b5 });

      // Big "HOT HOMEWORK" Book
      deskG.roundRect(-10, -28, 40, 35, 4);
      deskG.fill({ color: 0xff1744 });
      deskG.rect(-5, -22, 30, 20);
      deskG.fill({ color: 0xffffff });

      // Desk Lamp
      deskG.circle(50, -15, 14);
      deskG.fill({ color: 0xffeb3b });
      deskG.rect(48, -15, 4, 25);
      deskG.fill({ color: 0xffc107 });

      deskIntact.addChild(deskG);
      deskContainer.addChild(deskIntact);

      // Smashed Desk Debris Container (Hidden until smashed)
      const deskSmashedDebris = new PIXI.Container();
      deskSmashedDebris.visible = false;
      deskContainer.addChild(deskSmashedDebris);

      // --- LOAD CHARACTER SPRITE ---
      const playerContainer = new PIXI.Container();
      playerContainer.x = containerWidth * 0.3;
      playerContainer.y = containerHeight * 0.65;
      stage.addChild(playerContainer);

      let playerSprite: any = null;
      let hammerSprite: any = null;

      try {
        // Load textures dynamically
        const charTexture = await PIXI.Assets.load("/prototypes/pink-room-smash/character.jpg");
        playerSprite = new PIXI.Sprite(charTexture);
        playerSprite.anchor.set(0.5, 0.9);
        playerSprite.width = 130;
        playerSprite.height = 130;

        // Circular masking or soft border for chibi avatar
        const maskG = new PIXI.Graphics();
        maskG.circle(0, -65, 60);
        maskG.fill({ color: 0xffffff });
        playerSprite.mask = maskG;
        playerContainer.addChild(maskG);
        playerContainer.addChild(playerSprite);

        // Pink border around character
        const avatarBorder = new PIXI.Graphics();
        avatarBorder.circle(0, -65, 61);
        avatarBorder.stroke({ color: 0xff80ab, width: 4 });
        playerContainer.addChild(avatarBorder);
      } catch (err) {
        console.warn("Falling back to vector character graphics", err);
        // Fallback Vector Chibi Girl matching Image 1
        const charG = new PIXI.Graphics();
        charG.circle(0, -70, 45); // Head
        charG.fill({ color: 0x212121 }); // Black hair
        charG.circle(0, -65, 38); // Face
        charG.fill({ color: 0xffe0bd });
        // Glasses
        charG.circle(-16, -65, 14);
        charG.stroke({ color: 0xff4081, width: 4 });
        charG.circle(16, -65, 14);
        charG.stroke({ color: 0xff4081, width: 4 });
        // Dress
        charG.ellipse(0, -15, 25, 30);
        charG.fill({ color: 0x212121 });
        playerContainer.addChild(charG);
      }

      // Load Hammer Sprite
      try {
        const hammerTexture = await PIXI.Assets.load("/prototypes/pink-room-smash/hammer.jpg");
        hammerSprite = new PIXI.Sprite(hammerTexture);
        hammerSprite.anchor.set(0.5, 0.9);
        hammerSprite.width = 90;
        hammerSprite.height = 90;
        hammerSprite.x = 40;
        hammerSprite.y = -60;
        hammerSprite.visible = false;
        playerContainer.addChild(hammerSprite);
      } catch (err) {
        console.warn("Falling back to vector hammer graphics", err);
      }

      // --- EMOTION / FLAME EFFECT CONTAINER ---
      const emotionContainer = new PIXI.Container();
      emotionContainer.y = -140;
      playerContainer.addChild(emotionContainer);

      // Anger Symbol 💢
      const angerText = new PIXI.Text({
        text: "💢🔥",
        style: new PIXI.TextStyle({
          fontSize: 36,
        }),
      });
      angerText.anchor.set(0.5);
      angerText.visible = false;
      emotionContainer.addChild(angerText);

      // Particle container for flame / smash debris
      const particleContainer = new PIXI.Container();
      stage.addChild(particleContainer);

      const activeParticles: Array<{
        sprite: any;
        vx: number;
        vy: number;
        rotSpeed: number;
        alphaSpeed: number;
      }> = [];

      // Function to spawn flame particles above head
      function spawnFlameBurst(x: number, y: number) {
        for (let i = 0; i < 25; i++) {
          const flameP = new PIXI.Graphics();
          const colors = [0xff1744, 0xff9100, 0xffea00];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const radius = 6 + Math.random() * 10;
          flameP.circle(0, 0, radius);
          flameP.fill({ color });

          flameP.x = x + (Math.random() * 40 - 20);
          flameP.y = y + (Math.random() * 30 - 15);

          particleContainer.addChild(flameP);
          activeParticles.push({
            sprite: flameP,
            vx: (Math.random() - 0.5) * 4,
            vy: -4 - Math.random() * 6,
            rotSpeed: 0.1,
            alphaSpeed: 0.03,
          });
        }
      }

      // Function to spawn paper homework smash particles
      function spawnPaperSmashDebris(x: number, y: number) {
        for (let i = 0; i < 40; i++) {
          const paper = new PIXI.Graphics();
          const isFailingGrade = Math.random() > 0.5;

          // Flying Homework Sheets with "F-" grade or red marks
          paper.rect(-10, -14, 20, 28);
          paper.fill({ color: 0xffffff });
          paper.stroke({ color: isFailingGrade ? 0xff1744 : 0x29b6f6, width: 1.5 });

          if (isFailingGrade) {
            paper.rect(-5, -8, 10, 2);
            paper.fill({ color: 0xff1744 });
          }

          paper.x = x + (Math.random() * 60 - 30);
          paper.y = y + (Math.random() * 40 - 20);

          particleContainer.addChild(paper);
          activeParticles.push({
            sprite: paper,
            vx: (Math.random() - 0.5) * 16,
            vy: -8 - Math.random() * 12,
            rotSpeed: (Math.random() - 0.5) * 0.4,
            alphaSpeed: 0.015,
          });
        }

        // Broken Wood Splinters
        for (let i = 0; i < 20; i++) {
          const wood = new PIXI.Graphics();
          wood.rect(-6, -3, 12, 6);
          wood.fill({ color: 0x5d4037 });

          wood.x = x;
          wood.y = y;
          particleContainer.addChild(wood);
          activeParticles.push({
            sprite: wood,
            vx: (Math.random() - 0.5) * 20,
            vy: -6 - Math.random() * 10,
            rotSpeed: 0.3,
            alphaSpeed: 0.02,
          });
        }
      }

      // --- PLAYER CONTROLS & MOVEMENT ---
      const keysPressed: Record<string, boolean> = {};
      let targetPos: { x: number; y: number } | null = null;
      const speed = 5;

      window.addEventListener("keydown", (e) => {
        keysPressed[e.key.toLowerCase()] = true;
        if (e.code === "Space") {
          e.preventDefault();
          triggerSmash();
        }
      });

      window.addEventListener("keyup", (e) => {
        keysPressed[e.key.toLowerCase()] = false;
      });

      // Mouse click on floor to move
      app.canvas.addEventListener("pointerdown", (e: PointerEvent) => {
        const rect = app.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Ensure target is on walkable floor
        if (clickY > wallHeight + 30) {
          targetPos = { x: clickX, y: clickY };
        }
      });

      // --- SMASH ACTION SEQUENCE ---
      let isAnimatingSmash = false;

      function triggerSmash() {
        if (isAnimatingSmash) return;
        isAnimatingSmash = true;

        // 1. Walk / Turn toward desk
        targetPos = { x: deskContainer.x - 70, y: deskContainer.y + 30 };

        // Show Anger & Flame Burst
        angerText.visible = true;
        spawnFlameBurst(playerContainer.x, playerContainer.y - 120);

        if (hammerSprite) {
          hammerSprite.visible = true;
          hammerSprite.rotation = -Math.PI / 3;
        }

        // 2. Perform Hammer Swing Animation
        let swingProgress = 0;
        const swingTimer = setInterval(() => {
          swingProgress += 0.15;
          if (hammerSprite) {
            hammerSprite.rotation = -Math.PI / 3 + swingProgress * (Math.PI * 0.8);
          }

          if (swingProgress >= 1) {
            clearInterval(swingTimer);

            // IMPACT! Smash the desk!
            deskIntact.visible = false;
            deskSmashedDebris.visible = true;

            // Generate smashed wood remnants
            deskSmashedDebris.removeChildren();
            const debrisG = new PIXI.Graphics();
            debrisG.roundRect(-70, 20, 50, 15, 4); // Broken plank left
            debrisG.fill({ color: 0x5d4037 });
            debrisG.roundRect(20, 25, 40, 15, 4); // Broken plank right
            debrisG.fill({ color: 0x8d6e63 });
            // Scattered shredded papers on floor
            for (let i = 0; i < 8; i++) {
              debrisG.rect(-50 + i * 15, 30 + (i % 3) * 5, 12, 16);
              debrisG.fill({ color: 0xffffff });
              debrisG.stroke({ color: 0xff1744, width: 1 });
            }
            deskSmashedDebris.addChild(debrisG);

            // Spawn explosive flying paper & wood debris
            spawnPaperSmashDebris(deskContainer.x, deskContainer.y);

            // Screen Shake Effect
            let shakeCount = 0;
            const shakeInterval = setInterval(() => {
              shakeCount++;
              stage.x = (Math.random() - 0.5) * 20;
              stage.y = (Math.random() - 0.5) * 20;
              if (shakeCount > 10) {
                clearInterval(shakeInterval);
                stage.x = 0;
                stage.y = 0;
              }
            }, 30);

            setIsSmashed(true);
            setSmashCount((prev) => prev + 1);

            // Hide Hammer after swing
            setTimeout(() => {
              if (hammerSprite) hammerSprite.visible = false;
              angerText.visible = false;
              isAnimatingSmash = false;
            }, 600);
          }
        }, 30);
      }

      function triggerReset() {
        deskIntact.visible = true;
        deskSmashedDebris.visible = false;
        setIsSmashed(false);

        // Sparkle rebuild effect
        for (let i = 0; i < 15; i++) {
          const star = new PIXI.Graphics();
          star.circle(0, 0, 5 + Math.random() * 5);
          star.fill({ color: 0x69f0ae });
          star.x = deskContainer.x + (Math.random() * 100 - 50);
          star.y = deskContainer.y + (Math.random() * 60 - 30);
          particleContainer.addChild(star);
          activeParticles.push({
            sprite: star,
            vx: 0,
            vy: -3,
            rotSpeed: 0.1,
            alphaSpeed: 0.04,
          });
        }
      }

      // Attach functions to React refs
      triggerSmashRef.current = triggerSmash;
      triggerResetRef.current = triggerReset;

      // --- MAIN GAME LOOP (TICKER) ---
      app.ticker.add((ticker: any) => {
        const delta = ticker.deltaTime;

        let moveX = 0;
        let moveY = 0;

        // Keyboard Movement
        if (keysPressed["w"] || keysPressed["arrowup"]) moveY -= speed * delta;
        if (keysPressed["s"] || keysPressed["arrowdown"]) moveY += speed * delta;
        if (keysPressed["a"] || keysPressed["arrowleft"]) moveX -= speed * delta;
        if (keysPressed["d"] || keysPressed["arrowright"]) moveX += speed * delta;

        if (moveX !== 0 || moveY !== 0) {
          targetPos = null; // Keyboard overrides mouse path
        } else if (targetPos) {
          // Mouse Click Movement Pathing
          const dx = targetPos.x - playerContainer.x;
          const dy = targetPos.y - playerContainer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 5) {
            moveX = (dx / dist) * speed * delta;
            moveY = (dy / dist) * speed * delta;
          } else {
            targetPos = null;
          }
        }

        // Apply Position & Room Boundaries
        const nextX = playerContainer.x + moveX;
        const nextY = playerContainer.y + moveY;

        const minX = 60;
        const maxX = containerWidth - 60;
        const minY = wallHeight + 40;
        const maxY = containerHeight - 40;

        playerContainer.x = Math.max(minX, Math.min(maxX, nextX));
        playerContainer.y = Math.max(minY, Math.min(maxY, nextY));

        // Walking Bobbing Animation
        if (moveX !== 0 || moveY !== 0) {
          playerContainer.rotation = Math.sin(Date.now() * 0.015) * 0.08;
        } else {
          playerContainer.rotation = 0;
        }

        // Proximity Check to Desk
        const distToDesk = Math.hypot(
          playerContainer.x - deskContainer.x,
          playerContainer.y - deskContainer.y
        );
        setIsNearDesk(distToDesk < 140);

        // Update Particle System
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

      {/* Floating Header UI */}
      <div className={styles.overlayHeader}>
        <h1 className={styles.title}>
          <span>🔨🌸</span> 粉色房间作业大轰炸
        </h1>
        <p className={styles.description}>
          控制粉色眼镜小人走近书桌，点燃怒火，拿出一个超级大锤子把讨厌的作业和书桌通通砸碎吧！
        </p>
        <div className={styles.controlHints}>
          <span>
            移动：<span className={styles.keyBadge}>WASD</span> 或 点击地面
          </span>
          <span>
            砸碎：<span className={styles.keyBadge}>SPACE</span>
          </span>
        </div>
      </div>

      <Link href="/" className={styles.homeLink}>
        ← 返回原型列表
      </Link>

      {/* Interactive Action Control Panel */}
      <div className={styles.actionPanel}>
        {isNearDesk && !isSmashed && (
          <div className={styles.proximityBadge}>🔥 已靠近书桌！按空格键或点击砸碎！</div>
        )}

        <button
          className={styles.smashButton}
          onClick={() => triggerSmashRef.current()}
        >
          💥 砸碎作业！ ({smashCount} 次)
        </button>

        {isSmashed && (
          <button
            className={styles.resetButton}
            onClick={() => triggerResetRef.current()}
          >
            ✨ 重置书桌
          </button>
        )}
      </div>
    </div>
  );
}
