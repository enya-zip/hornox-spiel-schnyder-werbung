export const DURATION=900,STAGE_DURATION=90;
export const stages=[
 {key:'resort',start:0,end:90,biome:3},
 {key:'blatten',start:90,end:180,biome:6},
 {key:'zumsee',start:180,end:270,biome:7},
 {key:'furi',start:270,end:360,biome:8},
 {key:'meadow',start:360,end:450,biome:1},
 {key:'schwarzsee',start:450,end:540,biome:9},
 {key:'mountain',start:540,end:630,biome:4},
 {key:'glacier',start:630,end:720,biome:0},
 {key:'ridge',start:720,end:810,biome:10},
 {key:'summit',start:810,end:900,biome:5}
];
export const getStage=t=>Math.min(9,Math.floor(Math.max(0,t)/90));
export const getZone=t=>stages[getStage(t)].biome;
// Level 4 (Furi · Waldpfad): Zeitfenster der besonderen Herausforderungen.
// bridgeAt muss mit rules.js übereinstimmen (dort steht eine Kopie, weil die Regeln keine Imports haben dürfen).
export const bridgeAt=t=>t>=317&&t<327;
// Nebelstärke 0..1: zwei Nebelbänke mit 2 s Ein- und Ausblenden.
export const fogAt=t=>{let f=0;for(const [a,b] of [[302,310],[345,355]])f=Math.max(f,Math.min(1,(t-a)/2,(b-t)/2));return Math.max(0,f);};
// Abschnitte von Level 4: 1 heller Wald, 2 tiefer Wald, 3 Waldschlucht, 4 wilde Waldjagd.
export const forestSection=t=>t<270||t>=360?0:t<292.5?1:t<315?2:t<337.5?3:4;
// Level 5 «Alpweiden» (6:00–7:30): Abschnitte und Challenge-Fenster (müssen mit rules.js übereinstimmen).
export const meadowSection=t=>t<360||t>=450?0:t<382.5?1:t<405?2:t<427.5?3:4;
export const meadowWindows={herd:[388,394],cows:[398,404],hay:[409,421]};
// Level 6 «Schwarzsee» (7:30–9:00): Abschnitte und Steinpfad-Fenster (müssen mit rules.js übereinstimmen).
export const lakeSection=t=>t<450||t>=540?0:t<472.5?1:t<495?2:t<517.5?3:4;
export const swampMud=t=>t>=450&&t<540&&(t-450)%21>=15;
export const stoneAt=t=>t>=474&&t<492||t>=500&&t<508||t>=519&&t<538;
// Ab Level 7 steigt das Tempo weiter (gleich wie rules.js): klassisch bis +4 (Level 10 ≈ 31), entspannt bis +1,5.
export const lateSpeed=(t,relaxed)=>{const k=Math.max(0,Math.min(1,(t-540)/360));return relaxed?k*1.5:k*4;};
export const baseSpeed=(t,relaxed)=>(relaxed?14:19)+Math.min(relaxed?6:8,t/42)+lateSpeed(t,relaxed);
// Level 8 «Gletscher»: 5 Abschnitte à 18 s (Gletscherzunge, Schneebrücken, Séracs, Windböen, Seilschaft).
export const glacierSection=t=>t<630||t>=720?0:1+Math.min(4,Math.floor((t-630)/18));
export const GUSTS=[686.5,690.5,694.5,698.5];
// Level 9 «Hörnligrat»: schmale Gratstellen, eine Randspur ist Abgrund (Spur 0 = links, 2 = rechts).
export const ridgeNarrow=t=>t>=729&&t<737?0:t>=748&&t<756?2:t>=768&&t<776?0:t>=788&&t<796?2:-1;
// Level 10 «Matterhorn»: schmaler Schneegrat; ab 892 s frei bis zum Gipfelkreuz.
export const summitNarrow=t=>t>=836&&t<846?2:t>=858&&t<868?0:t>=876&&t<887?2:-1;
export const SOLVAY_AT=772;   // Solvayhütte (4003 m) am Grat
