// Zugangsdaten der globalen Rangliste (Supabase). Beide Werte sind öffentlich und dürfen im Code stehen:
// der «anon»-Schlüssel erlaubt nur Lesen der Rangliste und das Melden über die Funktionen
// submit_score / save_contact. E-Mail-Adressen kann damit niemand lesen (nur der Admin nach Login).
// Leer = Rangliste noch nicht verbunden (das Spiel läuft trotzdem normal).
// termsUrl: optionaler Link zu den Teilnahmebedingungen des Gewinnspiels (leer = kein Link).
export const LEADERBOARD={url:"",anonKey:"",termsUrl:""};
