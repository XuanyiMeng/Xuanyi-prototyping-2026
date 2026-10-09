import styles from "./styles.module.css";

/** Match outfits to local temperature, including places in the other hemisphere. */
export default function SeasonalBuddy({ tempKelvin }: { tempKelvin?: number }) {
  const celsius = tempKelvin === undefined ? null : tempKelvin - 273.15;
  const winter = celsius !== null && celsius < 10;
  const autumn = celsius !== null && celsius >= 10 && celsius < 18;
  const summer = celsius !== null && celsius >= 24;
  const label = winter ? "Snowman in a woolly scarf" : summer
    ? "Summer buddy in beach shorts" : autumn ? "Autumn buddy in a scarf" : "Spring buddy in a mint shirt";

  return (
    <aside className={styles.seasonalBuddy} aria-label={label}>
      <svg className={styles.buddyDrawing} viewBox="0 0 140 180" role="img" aria-label={label}>
        <ellipse cx="70" cy="168" rx="38" ry="6" fill="#63718c" opacity=".12" />
        <g className={styles.buddyBody} stroke="#596176" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {winter ? (
            <>
              <path d="M40 104 17 86m7 6-2-13m3 14-13 1M101 104l22-18m-7 6 2-13m-3 14 13 1" fill="none" stroke="#92745f" />
              <ellipse cx="70" cy="132" rx="36" ry="32" fill="#f6fbff" />
              <circle cx="70" cy="93" r="28" fill="#f6fbff" />
              <circle cx="70" cy="58" r="23" fill="#f6fbff" />
              <path d="M47 48q0-30 23-30t23 30" fill="#b7c9e7" />
              <rect x="44" y="42" width="52" height="10" rx="5" fill="#d7e3f4" />
              <circle cx="70" cy="17" r="7" fill="#f4e7ed" />
              <path d="M48 79q22 9 44 0v12q-22 8-44 0z" fill="#e7a9b8" />
              <path d="m80 90 12 1-2 29-12-3z" fill="#e7a9b8" />
              <path d="m70 62 15 4-15 4z" fill="#edb17a" stroke="#c48c5b" />
              <circle cx="61" cy="59" r="2" fill="#596176" stroke="none" />
              <circle cx="79" cy="59" r="2" fill="#596176" stroke="none" />
              <path d="M63 73q7 5 14 0" fill="none" />
              {[104, 126, 143].map(y => <circle key={y} cx="68" cy={y} r="3" fill="#8998b1" stroke="none" />)}
            </>
          ) : (
            <>
              <path d="M55 132v25m30-25v25" stroke="#dbb79e" strokeWidth="12" />
              <path d="M47 161h14m19 0h14" stroke={summer ? "#ad8294" : "#8b9cb7"} strokeWidth="8" />
              <path d="m45 92-14 28m64-28 14 17 9-14" stroke="#dbb79e" strokeWidth="10" fill="none" />
              <path d="M49 82q21-10 42 0l9 42H40z" fill={summer ? "#f9e5b5" : autumn ? "#dfbda5" : "#bcdccf"} />
              <path d="M43 121h54l-3 23H76l-6-14-6 14H46z" fill={summer ? "#9acbd5" : "#a7b5cd"} />
              {summer && <g stroke="#e9f7ed" strokeWidth="3"><path d="m51 128 8 7m-8 0 8-7m22 0 8 7m-8 0 8-7" /></g>}
              <circle cx="70" cy="57" r="26" fill="#f4d7bf" />
              <path d="M45 52q-5-28 26-25 27 0 25 25-15-3-20-15-10 17-31 15" fill="#7d706b" />
              {summer ? (
                <>
                  <path d="M43 41q3-23 27-23t27 23" fill="#f3ddb0" />
                  <path d="M34 42h72" stroke="#c8ab7c" strokeWidth="7" />
                  <rect x="50" y="53" width="16" height="11" rx="4" fill="#6d7d92" />
                  <rect x="74" y="53" width="16" height="11" rx="4" fill="#6d7d92" />
                  <path d="M66 56h8" />
                </>
              ) : <g fill="#596176" stroke="none"><circle cx="59" cy="57" r="2.5" /><circle cx="81" cy="57" r="2.5" /></g>}
              <g fill="#e9a9a9" opacity=".6" stroke="none"><ellipse cx="53" cy="66" rx="5" ry="3" /><ellipse cx="87" cy="66" rx="5" ry="3" /></g>
              <path d="M63 69q7 7 14 0" fill="none" />
              {autumn && <><path d="M49 79q21 9 42 0v10q-21 8-42 0z" fill="#d99881" /><path d="m80 89 10 1-2 23-10-2z" fill="#d99881" /></>}
              {!summer && !autumn && <path d="m69 99 3 5 6 1-4 4 1 6-6-3-5 3 1-6-4-4 6-1z" fill="#f5e6b8" stroke="none" />}
            </>
          )}
        </g>
      </svg>
    </aside>
  );
}
