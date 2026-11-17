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
