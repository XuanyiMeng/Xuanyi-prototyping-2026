import styles from "./styles/home.module.css";
import Link from "next/link";

interface PrototypeInfo {
  slug: string;
  title: string;
  description: string;
  date: string;
  tag: string;
}

const prototypes: PrototypeInfo[] = [
  {
    slug: "weather-dashboard",
    title: "Weather Near Me 🌤️",
    description: "Real-time weather dashboard for your current location using the OpenWeatherMap API. Shows current conditions, feels-like temp, humidity, wind speed, and a 5-day forecast with a dynamic sky theme.",
    date: "2026-10-09",
    tag: "API Integration · Weather",
  },
  {
    slug: "stardew-mini-game",
    title: "星露谷风粉色小屋 🌾🌸",
    description: "《星露谷物语》/《模拟人生》风格 2D 小游戏！WASD 或点击移动小人，点击书桌锤爆作业，点击大床睡觉恢复体力，附带金币数、体力条与底部物品栏！",
    date: "2026-10-02",
    tag: "PixiJS 模拟经营小游戏",
  },
  {
    slug: "pink-room-smash",
    title: "粉色房间作业大轰炸 🔨🌸",
    description: "控制带着粉色黑框眼镜的卡通小人在温馨粉色房间里走动。走进书桌，头上冒出火焰并掏出超级大锤子把讨厌的作业和书桌通通砸碎！",
    date: "2026-10-02",
    tag: "PixiJS 2D 互动游戏",
  },
  {
    slug: "maybe-tomorrow",
    title: "Maybe tomorrow",
    description: "An expressive fashion-editorial custom typography generator exploring variable fonts, extreme CSS distortions, and contrast.",
    date: "2026-09-25",
    tag: "CSS Typography Lab",
  },
];

export default function Home() {
  return (
    <main className={styles.page} id="top">
      <nav className={styles.nav} aria-label="Main navigation">
        <a className={styles.logo} href="#top">sia <span>♡</span> world</a>
        <div className={styles.navLinks}>
          <a href="#prototypes">prototypes</a>
          <a href="#story">story</a>
          <a href="#diary">diary</a>
          <a href="#hello">hello</a>
        </div>
      </nav>

      <section className={styles.hero} aria-labelledby="main-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>a tiny office party, all day long</p>
          <h1 className={styles.title} id="main-title">Sia&apos;s<br /><span>Soft</span> World</h1>
          <p className={styles.intro}>A pastel little corner for daydreams, glitter messes, and songs that play after everyone has gone home.</p>
          <a className={styles.cta} href="#prototypes">explore prototypes <span>↓</span></a>
        </div>

        <div className={styles.officeScene} aria-label="A pastel office after a party">
          <span className={`${styles.balloon} ${styles.blueBalloon}`} />
          <span className={`${styles.balloon} ${styles.pinkBalloon}`} />
          <span className={`${styles.balloon} ${styles.yellowBalloon}`} />
          <span className={styles.confetti}>✦ · ♡ · ✦ · ☆ · ♡ · ✦</span>
          <div className={styles.wallArt}>SIA<br />FM</div>
          <div className={styles.desk}><div className={styles.monitor}><span>♡</span></div><div className={styles.keyboard} /></div>
          <div className={styles.chair} />
          <p className={styles.sceneNote}>9:05 pm<br />still dancing</p>
        </div>
      </section>

      {/* Prototypes Section */}
      <section className={styles.prototypesSection} id="prototypes">
        <div className={styles.prototypesHeader}>
          <p className={styles.eyebrow}>✦ / workshop prototypes</p>
          <h2>experimental<br /><span>prototypes</span></h2>
        </div>
        <div className={styles.prototypesGrid}>
          {prototypes.map((p) => (
            <article key={p.slug} className={styles.prototypeCard}>
              <div className={styles.cardTag}>{p.tag}</div>
              <h3 className={styles.cardTitle}>{p.title}</h3>
              <p className={styles.cardDesc}>{p.description}</p>
              <Link href={`/prototypes/${p.slug}`} className={styles.cardLink}>
                Launch Prototype →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.story} id="story">
        <div className={styles.storyTitle}><p>01</p><h2>a soft place<br />to <span>land</span></h2></div>
        <div className={styles.storyText}><p className={styles.bigLine}>The party is over, but the magic stays.</p><p>Think old office computers, shiny ribbons under the desk, sleepy lavender walls, and a handful of balloons that never made it home.</p><div className={styles.tags}><span>pastel pop</span><span>after party</span><span>little wishes</span></div></div>
      </section>

      <section className={styles.diary} id="diary">
        <p className={styles.eyebrow}>02 / little notes</p>
        <h2>today feels like<br /><span>a good song.</span></h2>
        <div className={styles.notes}>
          <article className={styles.note}><span>♡</span><h3>sweet mess</h3><p>glitter on the floor, ideas in the air.</p></article>
          <article className={styles.note}><span>✦</span><h3>soft shine</h3><p>a white glow for every small dream.</p></article>
          <article className={styles.note}><span>☁</span><h3>see you soon</h3><p>the best stories start after five.</p></article>
        </div>
      </section>

      <footer className={styles.footer} id="hello"><p>made with love, balloons &amp; a little glitter</p><a href="#top">back to the beginning ↑</a></footer>
    </main>
  );
}
