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
