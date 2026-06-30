import { useState } from "react";

type Aufgabe = {
  id: number;
  name: string;
  raum: string;
  punkte: number;
  zyklus: number;
  zustaendig: number;
  wechselnd: boolean;
};

type Person = {
  id: number;
  name: string;
  pin: string;
};

type SlotTyp = "waffe" | "amulett" | "helm" | "ruestung" | "schuhe";

type BonusTyp =
  | "xp_eigen_prozent"
  | "xp_gegner_prozent"
  | "frist_bonus_tage"
  | "spaetmalus_reduktion";

type Ausruestung = {
  id: number;
  name: string;
  slot: SlotTyp;
  emoji: string;
  kosten: number;
  bonusTyp: BonusTyp;
  bonusWert: number;
  beschreibung: string;
};

type Faehigkeit = {
  id: number;
  name: string;
  emoji: string;
  kosten: number;
  bonusTyp: BonusTyp;
  bonusWert: number;
  beschreibung: string;
};

const startPersonen: Person[] = [
  { id: 0, name: "Martin", pin: "1111" },
  { id: 1, name: "Anna", pin: "2222" },
];

const startAufgaben: Aufgabe[] = [
  { id: 1, name: "Küche putzen", raum: "Küche", punkte: 30, zyklus: 7, zustaendig: 0, wechselnd: true },
  { id: 2, name: "Bad reinigen", raum: "Bad", punkte: 40, zyklus: 14, zustaendig: 1, wechselnd: true },
  { id: 3, name: "Staubsaugen", raum: "Wohnzimmer", punkte: 20, zyklus: 7, zustaendig: 0, wechselnd: false },
  { id: 4, name: "Müll rausbringen", raum: "Küche", punkte: 10, zyklus: 3, zustaendig: 1, wechselnd: true },
];

const startAusruestung: Ausruestung[] = [
  {
    id: 1,
    name: "Amulett der Eile",
    slot: "amulett",
    emoji: "💍",
    kosten: 80,
    bonusTyp: "frist_bonus_tage",
    bonusWert: 2,
    beschreibung: "Verlängert die Zeit für volle Punkte um 2 Tage.",
  },
  {
    id: 2,
    name: "Schwert des Fleißes",
    slot: "waffe",
    emoji: "⚔️",
    kosten: 100,
    bonusTyp: "xp_eigen_prozent",
    bonusWert: 15,
    beschreibung: "Du erhältst 15% mehr XP bei jeder erledigten Aufgabe.",
  },
];

const startFaehigkeiten: Faehigkeit[] = [
  {
    id: 1,
    name: "Eiserner Wille",
    emoji: "🔥",
    kosten: 300,
    bonusTyp: "spaetmalus_reduktion",
    bonusWert: 50,
    beschreibung: "Dauerhaft: Punktabzug bei Verspätung wird um 50% reduziert.",
  },
];

const ADMIN_PASSWORT = "1234";

const C = {
  bg: "#f5f0eb",
  card: "#fffaf5",
  border: "#e0d5c8",
  text: "#4a3f35",
  textLight: "#8a7968",
  primary: "#9c7f6a",
  primaryHover: "#7d6354",
  success: "#8aab8a",
  danger: "#c47f7f",
  warning: "#c9a96e",
  purple: "#9a87a8",
  navActive: "#7d6354",
  navInactive: "#d9cfc3",
  highlight: "#f0e8df",
  xpBar: "#b89968",
};

const SLOT_LABEL: Record<SlotTyp, string> = {
  waffe: "⚔️ Waffe",
  amulett: "💍 Amulett",
  helm: "🪖 Helm",
  ruestung: "🛡️ Rüstung",
  schuhe: "👢 Schuhe",
};

const BONUS_LABEL: Record<BonusTyp, string> = {
  xp_eigen_prozent: "Eigene XP",
  xp_gegner_prozent: "Gegner-XP",
  frist_bonus_tage: "Frist-Bonus",
  spaetmalus_reduktion: "Verspätungs-Schutz",
};

function bonusText(typ: BonusTyp, wert: number): string {
  switch (typ) {
    case "xp_eigen_prozent": return `+${wert}% eigene XP pro Aufgabe`;
    case "xp_gegner_prozent": return `-${wert}% XP für die andere Person`;
    case "frist_bonus_tage": return `+${wert} Tage volle Punkte möglich`;
    case "spaetmalus_reduktion": return `-${wert}% Verspätungsabzug`;
  }
}

function levelInfo(xp: number) {
  let level = 1;
  let xpFuerLevel = 100;
  let xpVerbraucht = 0;
  while (xp >= xpVerbraucht + xpFuerLevel) {
    xpVerbraucht += xpFuerLevel;
    level++;
    xpFuerLevel = Math.round(xpFuerLevel * 1.3);
  }
  const xpImLevel = xp - xpVerbraucht;
  const prozent = Math.min(100, Math.round((xpImLevel / xpFuerLevel) * 100));
  return { level, xpImLevel, xpFuerLevel, prozent };
}

export default function App() {
  const [personen, setPersonen] = useState<Person[]>(startPersonen);
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>(startAufgaben);
  const [xp, setXp] = useState<number[]>([0, 0]);
  const [ausruestung, setAusruestung] = useState<Ausruestung[]>(startAusruestung);
  const [faehigkeiten, setFaehigkeiten] = useState<Faehigkeit[]>(startFaehigkeiten);

  const [inventar, setInventar] = useState<Record<number, number[]>>({ 0: [], 1: [] });
  const [ausgeruestet, setAusgeruestet] = useState<Record<number, Partial<Record<SlotTyp, number>>>>({ 0: {}, 1: {} });
  const [erlernteFaehigkeiten, setErlernteFaehigkeiten] = useState<Record<number, number[]>>({ 0: [], 1: [] });

  const [seite, setSeite] = useState<"aufgaben" | "mitglieder" | "shop" | "admin">("aufgaben");
  const [shopUnterseite, setShopUnterseite] = useState<"inventar" | "ausruestung" | "faehigkeiten">("inventar");

  const [eingeloggtId, setEingeloggtId] = useState<number | null>(null);
  const [loginAuswahl, setLoginAuswahl] = useState<number | null>(null);
  const [loginPin, setLoginPin] = useState("");
  const [loginFehler, setLoginFehler] = useState(false);
  const [loginModus, setLoginModus] = useState<"start" | "person" | "admin">("start");

  const [adminPasswortEingabe, setAdminPasswortEingabe] = useState("");
  const [adminFehler, setAdminFehler] = useState(false);
  const [adminUnterseite, setAdminUnterseite] = useState<"ausruestung" | "neuAusruestung" | "faehigkeiten" | "neuFaehigkeit">("ausruestung");

  const [bearbeiteAusruestungId, setBearbeiteAusruestungId] = useState<number | null>(null);
  const [bearbeiteAusruestung, setBearbeiteAusruestung] = useState<Partial<Ausruestung>>({});
  const [neueAusruestung, setNeueAusruestung] = useState<Partial<Ausruestung>>({ name: "", slot: "waffe", emoji: "⚔️", kosten: 50, bonusTyp: "xp_eigen_prozent", bonusWert: 10, beschreibung: "" });

  const [bearbeiteFaehigkeitId, setBearbeiteFaehigkeitId] = useState<number | null>(null);
  const [bearbeiteFaehigkeit, setBearbeiteFaehigkeit] = useState<Partial<Faehigkeit>>({});
  const [neueFaehigkeit, setNeueFaehigkeit] = useState<Partial<Faehigkeit>>({ name: "", emoji: "🔥", kosten: 300, bonusTyp: "spaetmalus_reduktion", bonusWert: 25, beschreibung: "" });

  const [meldung, setMeldung] = useState<string | null>(null);

  const [neuerPersonName, setNeuerPersonName] = useState("");
  const [neuerPersonPin, setNeuerPersonPin] = useState("");
  const [bearbeitePersonId, setBearbeitePersonId] = useState<number | null>(null);
  const [bearbeiteName, setBearbeiteName] = useState("");
  const [bearbeitePin, setBearbeitePin] = useState("");

  const [formOffen, setFormOffen] = useState(false);
  const [neuerName, setNeuerName] = useState("");
  const [neuerRaum, setNeuerRaum] = useState("");
  const [neuePunkte, setNeuePunkte] = useState(20);
  const [neuerZyklus, setNeuerZyklus] = useState(7);
  const [neuerZustaendig, setNeuerZustaendig] = useState(0);
  const [neuesWechselnd, setNeuesWechselnd] = useState(false);

  function zeigeMeldung(text: string) {
    setMeldung(text);
    setTimeout(() => setMeldung(null), 3500);
  }

  function aktiveBoni(personId: number) {
    const result = { xp_eigen_prozent: 0, xp_gegner_prozent: 0, frist_bonus_tage: 0, spaetmalus_reduktion: 0 };

    const slots = ausgeruestet[personId] ?? {};
    Object.values(slots).forEach((ausrId) => {
      if (ausrId === undefined) return;
      const a = ausruestung.find((x) => x.id === ausrId);
      if (a) result[a.bonusTyp] += a.bonusWert;
    });

    const gelernt = erlernteFaehigkeiten[personId] ?? [];
    gelernt.forEach((fId) => {
      const f = faehigkeiten.find((x) => x.id === fId);
      if (f) result[f.bonusTyp] += f.bonusWert;
    });

    return result;
  }

  function pinEingabe(ziffer: string) {
    if (loginPin.length >= 4) return;
    const neuePin = loginPin + ziffer;
    setLoginPin(neuePin);
    setLoginFehler(false);

    if (neuePin.length === 4 && loginAuswahl !== null) {
      const person = personen.find((p) => p.id === loginAuswahl);
      if (person && person.pin === neuePin) {
        setEingeloggtId(loginAuswahl);
        setLoginAuswahl(null);
        setLoginPin("");
      } else {
        setLoginFehler(true);
        setTimeout(() => setLoginPin(""), 500);
      }
    }
  }

  function pinLoeschen() {
    setLoginPin((prev) => prev.slice(0, -1));
    setLoginFehler(false);
  }

  function ausloggen() {
    setEingeloggtId(null);
    setLoginAuswahl(null);
    setLoginPin("");
    setLoginModus("start");
    setSeite("aufgaben");
  }

  function adminLogin() {
    if (adminPasswortEingabe === ADMIN_PASSWORT) {
      setAdminFehler(false);
      setAdminPasswortEingabe("");
      setEingeloggtId(-1);
      setSeite("admin");
    } else {
      setAdminFehler(true);
    }
  }

  function erledigen(id: number) {
    if (eingeloggtId === null || eingeloggtId === -1) return;
    setAufgaben((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (a.zustaendig !== eingeloggtId) {
          zeigeMeldung("❌ Diese Aufgabe gehört nicht dir.");
          return a;
        }

        const eigenerBonus = aktiveBoni(eingeloggtId);
        const gegnerId = personen.find((p) => p.id !== eingeloggtId)?.id;

        let gewonneneXp = a.punkte;
        gewonneneXp = Math.round(gewonneneXp * (1 + eigenerBonus.xp_eigen_prozent / 100));

        setXp((prevXp) => {
          const neu = [...prevXp];
          neu[eingeloggtId] += gewonneneXp;
          if (gegnerId !== undefined && eigenerBonus.xp_gegner_prozent > 0) {
            const abzug = Math.round(neu[gegnerId] * (eigenerBonus.xp_gegner_prozent / 100));
            neu[gegnerId] = Math.max(0, neu[gegnerId] - abzug);
          }
          return neu;
        });

        zeigeMeldung(`✨ +${gewonneneXp} XP erhalten!${eigenerBonus.xp_eigen_prozent > 0 ? " (inkl. Ausrüstungsbonus)" : ""}`);

        return { ...a, zustaendig: a.wechselnd ? (a.zustaendig === 0 ? 1 : 0) : a.zustaendig };
      })
    );
  }

  function aufgabeHinzufuegen() {
    if (!neuerName || !neuerRaum) return;
    setAufgaben((prev) => [...prev, {
      id: Date.now(), name: neuerName, raum: neuerRaum,
      punkte: neuePunkte, zyklus: neuerZyklus,
      zustaendig: neuerZustaendig, wechselnd: neuesWechselnd,
    }]);
    setNeuerName(""); setNeuerRaum(""); setNeuePunkte(20); setNeuerZyklus(7); setFormOffen(false);
  }

  function aufgabeLoeschen(id: number) {
    setAufgaben((prev) => prev.filter((a) => a.id !== id));
    zeigeMeldung("🗑️ Aufgabe gelöscht.");
  }

  function personHinzufuegen() {
    if (!neuerPersonName.trim() || neuerPersonPin.length !== 4) {
      zeigeMeldung("❌ Name und 4-stellige PIN erforderlich.");
      return;
    }
    const neueId = personen.length;
    setPersonen((prev) => [...prev, { id: neueId, name: neuerPersonName.trim(), pin: neuerPersonPin }]);
    setXp((prev) => [...prev, 0]);
    setInventar((prev) => ({ ...prev, [neueId]: [] }));
    setAusgeruestet((prev) => ({ ...prev, [neueId]: {} }));
    setErlernteFaehigkeiten((prev) => ({ ...prev, [neueId]: [] }));
    setNeuerPersonName("");
    setNeuerPersonPin("");
  }

  function personSpeichern(id: number) {
    setPersonen((prev) => prev.map((p) => p.id === id ? { ...p, name: bearbeiteName, pin: bearbeitePin || p.pin } : p));
    setBearbeitePersonId(null);
  }

  function personLoeschen(id: number) {
    setPersonen((prev) => prev.filter((p) => p.id !== id));
  }

  function ausruestungKaufen(a: Ausruestung) {
    if (eingeloggtId === null || eingeloggtId === -1) return;
    const meinInventar = inventar[eingeloggtId] ?? [];
    if (meinInventar.includes(a.id)) { zeigeMeldung("❌ Du besitzt diesen Gegenstand bereits."); return; }
    if (xp[eingeloggtId] < a.kosten) { zeigeMeldung("❌ Nicht genug XP!"); return; }

    setXp((prev) => {
      const neu = [...prev];
      neu[eingeloggtId] -= a.kosten;
      return neu;
    });
    setInventar((prev) => ({ ...prev, [eingeloggtId]: [...(prev[eingeloggtId] ?? []), a.id] }));
    zeigeMeldung(`✅ ${a.name} gekauft! Du kannst es jetzt im Inventar anlegen.`);
  }

  function ausruesten(a: Ausruestung) {
    if (eingeloggtId === null || eingeloggtId === -1) return;
    setAusgeruestet((prev) => ({
      ...prev,
      [eingeloggtId]: { ...(prev[eingeloggtId] ?? {}), [a.slot]: a.id },
    }));
    zeigeMeldung(`⚔️ ${a.name} angelegt!`);
  }

  function ablegen(slot: SlotTyp) {
    if (eingeloggtId === null || eingeloggtId === -1) return;
    setAusgeruestet((prev) => {
      const neu = { ...(prev[eingeloggtId] ?? {}) };
      delete neu[slot];
      return { ...prev, [eingeloggtId]: neu };
    });
  }

  function faehigkeitLernen(f: Faehigkeit) {
    if (eingeloggtId === null || eingeloggtId === -1) return;
    const gelernt = erlernteFaehigkeiten[eingeloggtId] ?? [];
    if (gelernt.includes(f.id)) { zeigeMeldung("❌ Diese Fähigkeit hast du bereits gelernt."); return; }
    if (xp[eingeloggtId] < f.kosten) { zeigeMeldung("❌ Nicht genug XP!"); return; }

    setXp((prev) => {
      const neu = [...prev];
      neu[eingeloggtId] -= f.kosten;
      return neu;
    });
    setErlernteFaehigkeiten((prev) => ({ ...prev, [eingeloggtId]: [...gelernt, f.id] }));
    zeigeMeldung(`🔥 Fähigkeit „${f.name}" dauerhaft erlernt!`);
  }

  function ausruestungSpeichern() {
    if (!bearbeiteAusruestung.name) return;
    setAusruestung((prev) => prev.map((a) => a.id === bearbeiteAusruestungId ? { ...a, ...bearbeiteAusruestung } as Ausruestung : a));
    setBearbeiteAusruestungId(null);
    setBearbeiteAusruestung({});
    zeigeMeldung("✅ Ausrüstung gespeichert!");
  }

  function ausruestungLoeschen(id: number) {
    setAusruestung((prev) => prev.filter((a) => a.id !== id));
    zeigeMeldung("🗑️ Ausrüstung gelöscht.");
  }

  function neueAusruestungSpeichern() {
    if (!neueAusruestung.name || !neueAusruestung.beschreibung) return;
    setAusruestung((prev) => [...prev, {
      id: Date.now(),
      name: neueAusruestung.name!,
      slot: neueAusruestung.slot ?? "waffe",
      emoji: neueAusruestung.emoji ?? "⚔️",
      kosten: neueAusruestung.kosten ?? 50,
      bonusTyp: neueAusruestung.bonusTyp ?? "xp_eigen_prozent",
      bonusWert: neueAusruestung.bonusWert ?? 10,
      beschreibung: neueAusruestung.beschreibung!,
    }]);
    setNeueAusruestung({ name: "", slot: "waffe", emoji: "⚔️", kosten: 50, bonusTyp: "xp_eigen_prozent", bonusWert: 10, beschreibung: "" });
    zeigeMeldung("✅ Neue Ausrüstung erstellt!");
    setAdminUnterseite("ausruestung");
  }

  function faehigkeitSpeichern() {
    if (!bearbeiteFaehigkeit.name) return;
    setFaehigkeiten((prev) => prev.map((f) => f.id === bearbeiteFaehigkeitId ? { ...f, ...bearbeiteFaehigkeit } as Faehigkeit : f));
    setBearbeiteFaehigkeitId(null);
    setBearbeiteFaehigkeit({});
    zeigeMeldung("✅ Fähigkeit gespeichert!");
  }

  function faehigkeitLoeschen(id: number) {
    setFaehigkeiten((prev) => prev.filter((f) => f.id !== id));
    zeigeMeldung("🗑️ Fähigkeit gelöscht.");
  }

  function neueFaehigkeitSpeichern() {
    if (!neueFaehigkeit.name || !neueFaehigkeit.beschreibung) return;
    setFaehigkeiten((prev) => [...prev, {
      id: Date.now(),
      name: neueFaehigkeit.name!,
      emoji: neueFaehigkeit.emoji ?? "🔥",
      kosten: neueFaehigkeit.kosten ?? 300,
      bonusTyp: neueFaehigkeit.bonusTyp ?? "spaetmalus_reduktion",
      bonusWert: neueFaehigkeit.bonusWert ?? 25,
      beschreibung: neueFaehigkeit.beschreibung!,
    }]);
    setNeueFaehigkeit({ name: "", emoji: "🔥", kosten: 300, bonusTyp: "spaetmalus_reduktion", bonusWert: 25, beschreibung: "" });
    zeigeMeldung("✅ Neue Fähigkeit erstellt!");
    setAdminUnterseite("faehigkeiten");
  }

  const input: React.CSSProperties = {
    width: "100%", padding: "9px 11px", borderRadius: "8px",
    border: `1px solid ${C.border}`, marginBottom: "10px",
    boxSizing: "border-box", background: C.highlight,
    color: C.text, fontSize: "14px",
  };

  const btn = (color: string, text = "white"): React.CSSProperties => ({
    background: color, color: text, border: "none",
    padding: "9px 16px", borderRadius: "8px", cursor: "pointer",
    fontSize: "14px", fontWeight: 500,
  });

  const card: React.CSSProperties = {
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: "12px", padding: "14px", marginBottom: "12px",
  };

  const wrapper: React.CSSProperties = {
    fontFamily: "'Segoe UI', sans-serif", padding: "20px",
    maxWidth: "500px", margin: "0 auto", background: C.bg, minHeight: "100vh",
  };

  if (eingeloggtId === null) {
    return (
      <div style={{ ...wrapper, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h1 style={{ color: C.text, textAlign: "center", marginBottom: "4px" }}>🏠 Haushalts-Quest</h1>
        <p style={{ color: C.textLight, textAlign: "center", marginBottom: "30px" }}>Wer bist du?</p>

        {loginModus === "start" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {personen.map((p) => {
              const lvl = levelInfo(xp[p.id] ?? 0);
              return (
                <button key={p.id} onClick={() => { setLoginModus("person"); setLoginAuswahl(p.id); }}
                  style={{ ...card, ...btn(C.card, C.text), textAlign: "left", fontSize: "17px", display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>🧙</span> {p.name}
                  </span>
                  <span style={{ fontSize: "13px", color: C.textLight }}>Level {lvl.level}</span>
                </button>
              );
            })}
            <button onClick={() => setLoginModus("admin")}
              style={{ ...card, ...btn(C.highlight, C.text), textAlign: "left", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", border: `1px dashed ${C.border}` }}>
              <span style={{ fontSize: "20px" }}>⚙️</span> Administrator
            </button>
          </div>
        )}

        {loginModus === "person" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: C.text, fontWeight: 600, fontSize: "16px" }}>
              {personen.find((p) => p.id === loginAuswahl)?.name} – PIN eingeben
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px", margin: "16px 0" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: i < loginPin.length ? (loginFehler ? C.danger : C.primary) : C.navInactive,
                  transition: "background 0.2s",
                }} />
              ))}
            </div>

            {loginFehler && <p style={{ color: C.danger, fontSize: "13px" }}>❌ Falsche PIN</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", maxWidth: "240px", margin: "0 auto" }}>
              {["1","2","3","4","5","6","7","8","9"].map((z) => (
                <button key={z} onClick={() => pinEingabe(z)} style={{ ...btn(C.highlight, C.text), fontSize: "18px", padding: "16px" }}>{z}</button>
              ))}
              <button onClick={() => { setLoginModus("start"); setLoginAuswahl(null); setLoginPin(""); }} style={{ ...btn(C.navInactive, C.text), fontSize: "14px" }}>Zurück</button>
              <button onClick={() => pinEingabe("0")} style={{ ...btn(C.highlight, C.text), fontSize: "18px", padding: "16px" }}>0</button>
              <button onClick={pinLoeschen} style={{ ...btn(C.navInactive, C.text), fontSize: "14px" }}>⌫</button>
            </div>
          </div>
        )}

        {loginModus === "admin" && (
          <div style={{ ...card, background: C.highlight }}>
            <p style={{ marginTop: 0, color: C.text, fontWeight: 600 }}>⚙️ Administrator-Zugang</p>
            <p style={{ marginTop: 0, color: C.textLight, fontSize: "13px" }}>Bitte Passwort eingeben:</p>
            <input style={input} type="password" placeholder="Passwort" value={adminPasswortEingabe}
              onChange={(e) => setAdminPasswortEingabe(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adminLogin()} />
            {adminFehler && <p style={{ color: C.danger, margin: "0 0 10px", fontSize: "13px" }}>❌ Falsches Passwort</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={adminLogin} style={{ ...btn(C.primary), flex: 1 }}>🔓 Anmelden</button>
              <button onClick={() => { setLoginModus("start"); setAdminPasswortEingabe(""); setAdminFehler(false); }} style={btn(C.navInactive, C.text)}>Zurück</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const aktuellePerson = personen.find((p) => p.id === eingeloggtId);
  const istAdmin = eingeloggtId === -1;
  const meineBoni = istAdmin ? null : aktiveBoni(eingeloggtId);
  const meinLevel = istAdmin ? null : levelInfo(xp[eingeloggtId] ?? 0);

  return (
    <div style={wrapper}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h1 style={{ color: C.text, margin: 0 }}>🏠 Haushalts-Quest</h1>
        <button onClick={ausloggen} style={{ ...btn(C.navInactive, C.text), fontSize: "12px", padding: "6px 10px" }}>
          {istAdmin ? "⚙️ Admin · Logout" : `🧙 ${aktuellePerson?.name} · Logout`}
        </button>
      </div>
      <p style={{ color: C.textLight, marginTop: 0, marginBottom: "16px", fontSize: "14px" }}>Gemeinsam den Haushalt meistern</p>

      {meldung && (
        <div style={{ background: C.primary, color: "white", padding: "10px 16px", borderRadius: "10px", marginBottom: "16px", textAlign: "center", fontSize: "14px" }}>
          {meldung}
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
        {(istAdmin ? (["aufgaben", "mitglieder", "shop", "admin"] as const) : (["aufgaben", "mitglieder", "shop"] as const)).map((s) => (
          <button key={s} onClick={() => setSeite(s)}
            style={{ ...btn(seite === s ? C.navActive : C.navInactive, seite === s ? "white" : C.text), flex: 1, fontSize: "12px", padding: "8px 4px" }}>
            {s === "aufgaben" ? "📋" : s === "mitglieder" ? "👥" : s === "shop" ? "🎒" : "⚙️"}<br />
            {s === "aufgaben" ? "Aufgaben" : s === "mitglieder" ? "Mitglieder" : s === "shop" ? "Inventar" : "Admin"}
          </button>
        ))}
      </div>

      {seite === "aufgaben" && (
        <div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            {personen.map((p) => {
              const lvl = levelInfo(xp[p.id] ?? 0);
              return (
                <div key={p.id} style={{ ...card, flex: 1, marginBottom: 0, background: p.id === eingeloggtId ? C.highlight : C.card, borderColor: p.id === eingeloggtId ? C.primary : C.border }}>
                  <div style={{ fontSize: "13px", color: C.textLight, marginBottom: "2px" }}>{p.name}</div>
                  <div style={{ fontSize: "12px", color: C.text, fontWeight: 600, marginBottom: "4px" }}>Level {lvl.level}</div>
                  <div style={{ background: C.navInactive, borderRadius: "6px", height: "8px", overflow: "hidden", marginBottom: "4px" }}>
                    <div style={{ background: C.xpBar, height: "100%", width: `${lvl.prozent}%`, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: C.textLight }}>{lvl.xpImLevel}/{lvl.xpFuerLevel} XP</div>
                </div>
              );
            })}
          </div>

          {meineBoni && (meineBoni.xp_eigen_prozent > 0 || meineBoni.frist_bonus_tage > 0 || meineBoni.spaetmalus_reduktion > 0 || meineBoni.xp_gegner_prozent > 0) && (
            <div style={{ ...card, background: C.highlight, fontSize: "12px", color: C.textLight, padding: "10px 14px" }}>
              <strong style={{ color: C.text }}>🎽 Aktive Boni: </strong>
              {meineBoni.xp_eigen_prozent > 0 && <span>+{meineBoni.xp_eigen_prozent}% XP · </span>}
              {meineBoni.frist_bonus_tage > 0 && <span>+{meineBoni.frist_bonus_tage} Tage Frist · </span>}
              {meineBoni.spaetmalus_reduktion > 0 && <span>-{meineBoni.spaetmalus_reduktion}% Verspätungsabzug · </span>}
              {meineBoni.xp_gegner_prozent > 0 && <span>-{meineBoni.xp_gegner_prozent}% Gegner-XP</span>}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, color: C.text, fontSize: "18px" }}>Aufgaben</h2>
            {istAdmin && (
              <button onClick={() => setFormOffen(!formOffen)} style={btn(formOffen ? C.navInactive : C.primary, formOffen ? C.text : "white")}>
                {formOffen ? "✕ Abbrechen" : "+ Neue Aufgabe"}
              </button>
            )}
          </div>

          {formOffen && istAdmin && (
            <div style={{ ...card, background: C.highlight, marginBottom: "16px" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 600, color: C.text }}>Neue Aufgabe</p>
              <input style={input} placeholder="Name der Aufgabe" value={neuerName} onChange={(e) => setNeuerName(e.target.value)} />
              <input style={input} placeholder="Raum (z.B. Küche)" value={neuerRaum} onChange={(e) => setNeuerRaum(e.target.value)} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>XP-Wert: {neuePunkte}</label>
              <input style={{ ...input, marginTop: "4px" }} type="range" min={5} max={100} step={5} value={neuePunkte} onChange={(e) => setNeuePunkte(Number(e.target.value))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Zyklus: alle {neuerZyklus} Tage</label>
              <input style={{ ...input, marginTop: "4px" }} type="range" min={1} max={30} value={neuerZyklus} onChange={(e) => setNeuerZyklus(Number(e.target.value))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Zuständig:</label>
              <select style={input} value={neuerZustaendig} onChange={(e) => setNeuerZustaendig(Number(e.target.value))}>
                {personen.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: C.textLight, fontSize: "13px" }}>
                <input type="checkbox" checked={neuesWechselnd} onChange={(e) => setNeuesWechselnd(e.target.checked)} />
                Zuständigkeit wechselt nach Erledigung
              </label>
              <button onClick={aufgabeHinzufuegen} style={{ ...btn(C.success), width: "100%" }}>✅ Speichern</button>
            </div>
          )}

          {aufgaben.map((a) => {
            const person = personen.find((p) => p.id === a.zustaendig);
            const istMeine = a.zustaendig === eingeloggtId;
            return (
              <div key={a.id} style={{ ...card, opacity: istAdmin || istMeine ? 1 : 0.75 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <strong style={{ color: C.text, fontSize: "15px" }}>{a.name}</strong>
                  {istAdmin && (
                    <button onClick={() => aufgabeLoeschen(a.id)} style={{ ...btn(C.danger), padding: "4px 8px", fontSize: "12px" }}>🗑️</button>
                  )}
                </div>
                <p style={{ margin: "6px 0 4px", fontSize: "13px", color: C.textLight }}>📍 {a.raum} · 🔄 alle {a.zyklus} Tage · ✨ {a.punkte} XP</p>
                <p style={{ margin: "0 0 10px", fontSize: "13px", color: C.textLight }}>👤 <span style={{ color: C.text, fontWeight: 500 }}>{person?.name ?? "?"}</span></p>
                {!istAdmin && (
                  <button onClick={() => erledigen(a.id)} disabled={!istMeine} style={{ ...btn(istMeine ? C.success : C.navInactive, istMeine ? "white" : C.textLight), cursor: istMeine ? "pointer" : "not-allowed" }}>
                    {istMeine ? "✅ Erledigt" : "🔒 Nicht deine Aufgabe"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {seite === "mitglieder" && (
        <div>
          <h2 style={{ color: C.text }}>👥 Haushaltsmitglieder</h2>
          {personen.map((p) => {
            const lvl = levelInfo(xp[p.id] ?? 0);
            return (
              <div key={p.id} style={card}>
                {bearbeitePersonId === p.id && istAdmin ? (
                  <div>
                    <label style={{ color: C.textLight, fontSize: "13px" }}>Name</label>
                    <input style={input} value={bearbeiteName} onChange={(e) => setBearbeiteName(e.target.value)} />
                    <label style={{ color: C.textLight, fontSize: "13px" }}>Neue PIN (leer lassen = unverändert)</label>
                    <input style={input} maxLength={4} placeholder="4-stellig" value={bearbeitePin} onChange={(e) => setBearbeitePin(e.target.value.replace(/\D/g, ""))} />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => personSpeichern(p.id)} style={btn(C.success)}>💾 Speichern</button>
                      <button onClick={() => setBearbeitePersonId(null)} style={btn(C.navInactive, C.text)}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ color: C.text }}>{p.name}</strong>
                      <p style={{ margin: "2px 0", fontSize: "13px", color: C.textLight }}>Level {lvl.level} · ✨ {xp[p.id]} XP gesamt</p>
                    </div>
                    {istAdmin && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => { setBearbeitePersonId(p.id); setBearbeiteName(p.name); setBearbeitePin(""); }} style={{ ...btn(C.warning), padding: "6px 10px" }}>✏️</button>
                        <button onClick={() => personLoeschen(p.id)} style={{ ...btn(C.danger), padding: "6px 10px" }}>🗑️</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {istAdmin && (
            <div style={{ ...card, background: C.highlight }}>
              <p style={{ margin: "0 0 10px", fontWeight: 600, color: C.text }}>+ Neue Person</p>
              <input style={input} placeholder="Name" value={neuerPersonName} onChange={(e) => setNeuerPersonName(e.target.value)} />
              <input style={input} placeholder="4-stellige PIN" maxLength={4} value={neuerPersonPin} onChange={(e) => setNeuerPersonPin(e.target.value.replace(/\D/g, ""))} />
              <button onClick={personHinzufuegen} style={{ ...btn(C.success), width: "100%" }}>✅ Hinzufügen</button>
            </div>
          )}
        </div>
      )}

      {seite === "shop" && !istAdmin && (
        <div>
          <h2 style={{ color: C.text }}>🎒 Ausrüstung & Fähigkeiten</h2>
          <p style={{ color: C.textLight, fontSize: "14px" }}>
            <strong style={{ color: C.text }}>{aktuellePerson?.name}</strong> · Level {meinLevel?.level} · ✨ {xp[eingeloggtId]} XP
          </p>

          <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
            {(["inventar", "ausruestung", "faehigkeiten"] as const).map((u) => (
              <button key={u} onClick={() => setShopUnterseite(u)}
                style={{ ...btn(shopUnterseite === u ? C.purple : C.navInactive, shopUnterseite === u ? "white" : C.text), flex: 1, fontSize: "13px" }}>
                {u === "inventar" ? "🎽 Angelegt" : u === "ausruestung" ? "🛒 Shop" : "📖 Fähigkeiten"}
              </button>
            ))}
          </div>

          {shopUnterseite === "inventar" && (
            <div>
              <p style={{ fontSize: "13px", color: C.textLight, marginBottom: "10px" }}>Deine Ausrüstungs-Slots:</p>
              {(["waffe", "amulett", "helm", "ruestung", "schuhe"] as SlotTyp[]).map((slot) => {
                const aktiveId = ausgeruestet[eingeloggtId]?.[slot];
                const aktiv = aktiveId ? ausruestung.find((a) => a.id === aktiveId) : null;
                return (
                  <div key={slot} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: "13px", color: C.textLight }}>{SLOT_LABEL[slot]}</span>
                        {aktiv ? (
                          <div>
                            <strong style={{ color: C.text }}>{aktiv.emoji} {aktiv.name}</strong>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: C.textLight }}>{bonusText(aktiv.bonusTyp, aktiv.bonusWert)}</p>
                          </div>
                        ) : (
                          <p style={{ margin: "2px 0 0", fontSize: "13px", color: C.textLight, fontStyle: "italic" }}>Leer</p>
                        )}
                      </div>
                      {aktiv && (
                        <button onClick={() => ablegen(slot)} style={{ ...btn(C.navInactive, C.text), fontSize: "12px", padding: "6px 10px" }}>Ablegen</button>
                      )}
                    </div>
                  </div>
                );
              })}

              <p style={{ fontSize: "13px", color: C.textLight, margin: "20px 0 10px" }}>Im Besitz, aber nicht angelegt:</p>
              {(inventar[eingeloggtId] ?? [])
                .filter((id) => !Object.values(ausgeruestet[eingeloggtId] ?? {}).includes(id))
                .map((id) => {
                  const a = ausruestung.find((x) => x.id === id);
                  if (!a) return null;
                  return (
                    <div key={a.id} style={card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ color: C.text }}>{a.emoji} {a.name}</strong>
                          <p style={{ margin: "2px 0 0", fontSize: "12px", color: C.textLight }}>{SLOT_LABEL[a.slot]} · {bonusText(a.bonusTyp, a.bonusWert)}</p>
                        </div>
                        <button onClick={() => ausruesten(a)} style={btn(C.success)}>Anlegen</button>
                      </div>
                    </div>
                  );
                })}
              {(inventar[eingeloggtId] ?? []).filter((id) => !Object.values(ausgeruestet[eingeloggtId] ?? {}).includes(id)).length === 0 && (
                <p style={{ fontSize: "13px", color: C.textLight, fontStyle: "italic" }}>Nichts im Lager – kauf etwas im Shop!</p>
              )}
            </div>
          )}

          {shopUnterseite === "ausruestung" && (
            <div>
              {ausruestung.map((a) => {
                const besitzt = (inventar[eingeloggtId] ?? []).includes(a.id);
                const zuWenig = xp[eingeloggtId] < a.kosten;
                return (
                  <div key={a.id} style={{ ...card, opacity: besitzt ? 0.6 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: C.text }}>{a.emoji} {a.name}</strong>
                        <p style={{ margin: "4px 0", fontSize: "12px", color: C.textLight }}>{SLOT_LABEL[a.slot]}</p>
                        <p style={{ margin: "4px 0", fontSize: "13px", color: C.textLight }}>{a.beschreibung}</p>
                        <p style={{ margin: "4px 0", fontSize: "12px", color: C.textLight }}>✨ {a.kosten} XP</p>
                      </div>
                      <button onClick={() => ausruestungKaufen(a)} disabled={besitzt || zuWenig}
                        style={{ ...btn(besitzt ? C.navInactive : zuWenig ? "#e8d5d5" : C.purple, besitzt ? C.text : zuWenig ? C.danger : "white"), minWidth: "80px", marginLeft: "10px", cursor: besitzt || zuWenig ? "not-allowed" : "pointer" }}>
                        {besitzt ? "Besitzt" : zuWenig ? "Zu wenig" : "Kaufen"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {shopUnterseite === "faehigkeiten" && (
            <div>
              <p style={{ fontSize: "12px", color: C.textLight, marginBottom: "12px", fontStyle: "italic" }}>
                Fähigkeiten sind teuer, aber permanent – einmal gelernt, wirken sie für immer.
              </p>
              {faehigkeiten.map((f) => {
                const gelernt = (erlernteFaehigkeiten[eingeloggtId] ?? []).includes(f.id);
                const zuWenig = xp[eingeloggtId] < f.kosten;
                return (
                  <div key={f.id} style={{ ...card, opacity: gelernt ? 0.6 : 1, borderColor: gelernt ? C.success : C.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: C.text }}>{f.emoji} {f.name}</strong>
                        <p style={{ margin: "4px 0", fontSize: "13px", color: C.textLight }}>{f.beschreibung}</p>
                        <p style={{ margin: "4px 0", fontSize: "12px", color: C.textLight }}>✨ {f.kosten} XP · dauerhaft</p>
                      </div>
                      <button onClick={() => faehigkeitLernen(f)} disabled={gelernt || zuWenig}
                        style={{ ...btn(gelernt ? C.success : zuWenig ? "#e8d5d5" : C.purple, gelernt ? "white" : zuWenig ? C.danger : "white"), minWidth: "90px", marginLeft: "10px", cursor: gelernt || zuWenig ? "not-allowed" : "pointer" }}>
                        {gelernt ? "✓ Gelernt" : zuWenig ? "Zu wenig" : "Lernen"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {seite === "admin" && istAdmin && (
        <div>
          <h2 style={{ color: C.text }}>⚙️ Administrator</h2>
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
            <button onClick={() => setAdminUnterseite("ausruestung")} style={{ ...btn(adminUnterseite === "ausruestung" ? C.purple : C.navInactive, adminUnterseite === "ausruestung" ? "white" : C.text), flex: 1, fontSize: "12px" }}>⚔️ Ausrüstung</button>
            <button onClick={() => setAdminUnterseite("neuAusruestung")} style={{ ...btn(adminUnterseite === "neuAusruestung" ? C.purple : C.navInactive, adminUnterseite === "neuAusruestung" ? "white" : C.text), flex: 1, fontSize: "12px" }}>+ Ausrüstung</button>
            <button onClick={() => setAdminUnterseite("faehigkeiten")} style={{ ...btn(adminUnterseite === "faehigkeiten" ? C.purple : C.navInactive, adminUnterseite === "faehigkeiten" ? "white" : C.text), flex: 1, fontSize: "12px" }}>🔥 Fähigkeiten</button>
            <button onClick={() => setAdminUnterseite("neuFaehigkeit")} style={{ ...btn(adminUnterseite === "neuFaehigkeit" ? C.purple : C.navInactive, adminUnterseite === "neuFaehigkeit" ? "white" : C.text), flex: 1, fontSize: "12px" }}>+ Fähigkeit</button>
          </div>

          {adminUnterseite === "ausruestung" && ausruestung.map((a) => (
            <div key={a.id} style={card}>
              {bearbeiteAusruestungId === a.id ? (
                <div>
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Emoji</label>
                  <input style={input} value={bearbeiteAusruestung.emoji ?? a.emoji} onChange={(e) => setBearbeiteAusruestung((p) => ({ ...p, emoji: e.target.value }))} />
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Name</label>
                  <input style={input} value={bearbeiteAusruestung.name ?? a.name} onChange={(e) => setBearbeiteAusruestung((p) => ({ ...p, name: e.target.value }))} />
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Slot</label>
                  <select style={input} value={bearbeiteAusruestung.slot ?? a.slot} onChange={(e) => setBearbeiteAusruestung((p) => ({ ...p, slot: e.target.value as SlotTyp }))}>
                    {Object.entries(SLOT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Beschreibung</label>
                  <input style={input} value={bearbeiteAusruestung.beschreibung ?? a.beschreibung} onChange={(e) => setBearbeiteAusruestung((p) => ({ ...p, beschreibung: e.target.value }))} />
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Bonus-Typ</label>
                  <select style={input} value={bearbeiteAusruestung.bonusTyp ?? a.bonusTyp} onChange={(e) => setBearbeiteAusruestung((p) => ({ ...p, bonusTyp: e.target.value as BonusTyp }))}>
                    {Object.entries(BONUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Bonus-Wert: {bearbeiteAusruestung.bonusWert ?? a.bonusWert}</label>
                  <input style={{ ...input, marginTop: "4px" }} type="range" min={1} max={50}
                    value={bearbeiteAusruestung.bonusWert ?? a.bonusWert}
                    onChange={(e) => setBearbeiteAusruestung((p) => ({ ...p, bonusWert: Number(e.target.value) }))} />
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Kosten: {bearbeiteAusruestung.kosten ?? a.kosten} XP</label>
                  <input style={{ ...input, marginTop: "4px" }} type="range" min={10} max={500} step={10}
                    value={bearbeiteAusruestung.kosten ?? a.kosten}
                    onChange={(e) => setBearbeiteAusruestung((p) => ({ ...p, kosten: Number(e.target.value) }))} />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={ausruestungSpeichern} style={btn(C.success)}>💾 Speichern</button>
                    <button onClick={() => { setBearbeiteAusruestungId(null); setBearbeiteAusruestung({}); }} style={btn(C.navInactive, C.text)}>✕</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ color: C.text }}>{a.emoji} {a.name}</strong>
                    <p style={{ margin: "4px 0", fontSize: "12px", color: C.textLight }}>{SLOT_LABEL[a.slot]}</p>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: C.textLight }}>{a.beschreibung}</p>
                    <p style={{ margin: "4px 0", fontSize: "12px", color: C.textLight }}>✨ {a.kosten} XP</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { setBearbeiteAusruestungId(a.id); setBearbeiteAusruestung({ ...a }); }} style={{ ...btn(C.warning), padding: "6px 10px" }}>✏️</button>
                    <button onClick={() => ausruestungLoeschen(a.id)} style={{ ...btn(C.danger), padding: "6px 10px" }}>🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {adminUnterseite === "neuAusruestung" && (
            <div style={{ ...card, background: C.highlight }}>
              <p style={{ margin: "0 0 12px", fontWeight: 600, color: C.text }}>Neue Ausrüstung erstellen</p>
              <label style={{ color: C.textLight, fontSize: "13px" }}>Emoji</label>
              <input style={input} value={neueAusruestung.emoji} onChange={(e) => setNeueAusruestung((p) => ({ ...p, emoji: e.target.value }))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Name</label>
              <input style={input} placeholder="z.B. Helm der Klarheit" value={neueAusruestung.name} onChange={(e) => setNeueAusruestung((p) => ({ ...p, name: e.target.value }))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Slot</label>
              <select style={input} value={neueAusruestung.slot} onChange={(e) => setNeueAusruestung((p) => ({ ...p, slot: e.target.value as SlotTyp }))}>
                {Object.entries(SLOT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label style={{ color: C.textLight, fontSize: "13px" }}>Beschreibung</label>
              <input style={input} placeholder="Was bewirkt dieser Gegenstand?" value={neueAusruestung.beschreibung} onChange={(e) => setNeueAusruestung((p) => ({ ...p, beschreibung: e.target.value }))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Bonus-Typ</label>
              <select style={input} value={neueAusruestung.bonusTyp} onChange={(e) => setNeueAusruestung((p) => ({ ...p, bonusTyp: e.target.value as BonusTyp }))}>
                {Object.entries(BONUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label style={{ color: C.textLight, fontSize: "13px" }}>Bonus-Wert: {neueAusruestung.bonusWert}</label>
              <input style={{ ...input, marginTop: "4px" }} type="range" min={1} max={50}
                value={neueAusruestung.bonusWert} onChange={(e) => setNeueAusruestung((p) => ({ ...p, bonusWert: Number(e.target.value) }))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Kosten: {neueAusruestung.kosten} XP</label>
              <input style={{ ...input, marginTop: "4px" }} type="range" min={10} max={500} step={10}
                value={neueAusruestung.kosten} onChange={(e) => setNeueAusruestung((p) => ({ ...p, kosten: Number(e.target.value) }))} />
              <button onClick={neueAusruestungSpeichern} style={{ ...btn(C.purple), width: "100%" }}>✅ Ausrüstung erstellen</button>
            </div>
          )}

          {adminUnterseite === "faehigkeiten" && faehigkeiten.map((f) => (
            <div key={f.id} style={card}>
              {bearbeiteFaehigkeitId === f.id ? (
                <div>
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Emoji</label>
                  <input style={input} value={bearbeiteFaehigkeit.emoji ?? f.emoji} onChange={(e) => setBearbeiteFaehigkeit((p) => ({ ...p, emoji: e.target.value }))} />
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Name</label>
                  <input style={input} value={bearbeiteFaehigkeit.name ?? f.name} onChange={(e) => setBearbeiteFaehigkeit((p) => ({ ...p, name: e.target.value }))} />
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Beschreibung</label>
                  <input style={input} value={bearbeiteFaehigkeit.beschreibung ?? f.beschreibung} onChange={(e) => setBearbeiteFaehigkeit((p) => ({ ...p, beschreibung: e.target.value }))} />
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Bonus-Typ</label>
                  <select style={input} value={bearbeiteFaehigkeit.bonusTyp ?? f.bonusTyp} onChange={(e) => setBearbeiteFaehigkeit((p) => ({ ...p, bonusTyp: e.target.value as BonusTyp }))}>
                    {Object.entries(BONUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Bonus-Wert: {bearbeiteFaehigkeit.bonusWert ?? f.bonusWert}</label>
                  <input style={{ ...input, marginTop: "4px" }} type="range" min={1} max={75}
                    value={bearbeiteFaehigkeit.bonusWert ?? f.bonusWert}
                    onChange={(e) => setBearbeiteFaehigkeit((p) => ({ ...p, bonusWert: Number(e.target.value) }))} />
                  <label style={{ color: C.textLight, fontSize: "13px" }}>Kosten: {bearbeiteFaehigkeit.kosten ?? f.kosten} XP</label>
                  <input style={{ ...input, marginTop: "4px" }} type="range" min={50} max={1000} step={25}
                    value={bearbeiteFaehigkeit.kosten ?? f.kosten}
                    onChange={(e) => setBearbeiteFaehigkeit((p) => ({ ...p, kosten: Number(e.target.value) }))} />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={faehigkeitSpeichern} style={btn(C.success)}>💾 Speichern</button>
                    <button onClick={() => { setBearbeiteFaehigkeitId(null); setBearbeiteFaehigkeit({}); }} style={btn(C.navInactive, C.text)}>✕</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ color: C.text }}>{f.emoji} {f.name}</strong>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: C.textLight }}>{f.beschreibung}</p>
                    <p style={{ margin: "4px 0", fontSize: "12px", color: C.textLight }}>✨ {f.kosten} XP · dauerhaft</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { setBearbeiteFaehigkeitId(f.id); setBearbeiteFaehigkeit({ ...f }); }} style={{ ...btn(C.warning), padding: "6px 10px" }}>✏️</button>
                    <button onClick={() => faehigkeitLoeschen(f.id)} style={{ ...btn(C.danger), padding: "6px 10px" }}>🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {adminUnterseite === "neuFaehigkeit" && (
            <div style={{ ...card, background: C.highlight }}>
              <p style={{ margin: "0 0 12px", fontWeight: 600, color: C.text }}>Neue Fähigkeit erstellen</p>
              <label style={{ color: C.textLight, fontSize: "13px" }}>Emoji</label>
              <input style={input} value={neueFaehigkeit.emoji} onChange={(e) => setNeueFaehigkeit((p) => ({ ...p, emoji: e.target.value }))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Name</label>
              <input style={input} placeholder="z.B. Eiserner Wille" value={neueFaehigkeit.name} onChange={(e) => setNeueFaehigkeit((p) => ({ ...p, name: e.target.value }))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Beschreibung</label>
              <input style={input} placeholder="Was bewirkt diese Fähigkeit?" value={neueFaehigkeit.beschreibung} onChange={(e) => setNeueFaehigkeit((p) => ({ ...p, beschreibung: e.target.value }))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Bonus-Typ</label>
              <select style={input} value={neueFaehigkeit.bonusTyp} onChange={(e) => setNeueFaehigkeit((p) => ({ ...p, bonusTyp: e.target.value as BonusTyp }))}>
                {Object.entries(BONUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label style={{ color: C.textLight, fontSize: "13px" }}>Bonus-Wert: {neueFaehigkeit.bonusWert}</label>
              <input style={{ ...input, marginTop: "4px" }} type="range" min={1} max={75}
                value={neueFaehigkeit.bonusWert} onChange={(e) => setNeueFaehigkeit((p) => ({ ...p, bonusWert: Number(e.target.value) }))} />
              <label style={{ color: C.textLight, fontSize: "13px" }}>Kosten: {neueFaehigkeit.kosten} XP</label>
              <input style={{ ...input, marginTop: "4px" }} type="range" min={50} max={1000} step={25}
                value={neueFaehigkeit.kosten} onChange={(e) => setNeueFaehigkeit((p) => ({ ...p, kosten: Number(e.target.value) }))} />
              <button onClick={neueFaehigkeitSpeichern} style={{ ...btn(C.purple), width: "100%" }}>✅ Fähigkeit erstellen</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}