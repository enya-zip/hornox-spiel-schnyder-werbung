HORNOX RUN · ALPEN RESORT
Export vom 10. November 2026

Enthalten ist der vollständige gespeicherte Projektstand v20 vom 31. Oktober 2026.
Diese Version enthält auch die Trotinettfahrer, Skiträger und Snowboardträger.
Spielcode, 3D-Modelle, Bilder, Schriften, Musik, Sounds, Cover und Projektkonfiguration
sind im Archiv enthalten. Die Originaldateien wurden unverändert übernommen.

SO GEHT DIE ÜBERNAHME
1. Mit dem gewünschten Zielaccount in Higgsfield verbinden.
2. Das ZIP dem Chat mit der Higgsfield-Verbindung als Datei oder Downloadlink bereitstellen.
3. Den Text aus IMPORTAUFTRAG.txt mitsenden.
4. Das neue Projekt dort aus dem vorhandenen Code wiederherstellen und testen lassen.

Dies ist ein Quellcode- und Asset-Export. Eine native Ein-Klick-Importfunktion oder
ein direkter Accounttransfer wird über die verwendete Verbindung nicht angeboten.
Der Import im anderen Account wurde in diesem Auftrag noch nicht ausgeführt oder getestet.

Die Originaladresse gehört zum bisherigen Projekt. Im Zielaccount muss eine neue,
freie Adresse gewählt werden. Das laufende Originalspiel wurde nicht verändert.

WAS IM ZIELPROJEKT ANZUPASSEN IST
Die alten absoluten Spieladressen in app/src/app-meta.json, app/public/index.html
und app/public/sitemap.xml auf die neue Zieladresse setzen. Dazu gehören die
Cover-/OG-/Favicon-URLs, Canonical- und OG-URL sowie der Link zum Öffnen des Spiels.
Alle zugehörigen Bilddateien liegen im Export unter app/public/.
Externe Links auf www.alpenresort.com bleiben bestehen.

Die Infrastrukturdeklaration app/app.manifest.json enthält:
db=false, r2=false, kv=false, durableObject="Room".
Diese Deklaration für das neue Projekt übernehmen und Ressourcen neu provisionieren.
Die lokale wrangler.jsonc enthält Platzhalter; die Plattform erstellt die
Produktionskonfiguration des Zielprojekts selbst. Keine Ressourcen des alten
Accounts übernehmen. Für das Quellprojekt sind keine Secrets konfiguriert.

NICHT IM EXPORT
Die ursprüngliche Projekt-ID, Eigentümerschaft, bestehende URL und Feed-Zuordnung
werden nicht übertragen. Live-Zustände aus Durable Objects sowie persönliche
Bestwerte/Einstellungen im Browser sind nicht im Archiv. Das Zielprojekt startet
mit neuen Räumen; Browserdaten bleiben an die bisherige Adresse gebunden.

ORDNER
app/       Vollständige Spiel- und Serverdateien, Buildkonfiguration und Pakete.
design/    Bestehende Dokumentation, Assetnachweise und frühere Prüfnotizen.
refs/      Im Quellprojekt enthaltene Referenzdateien.
export.json und SHA256SUMS.txt dokumentieren Herkunft und Dateiprüfsummen.

PRÜFUNG DIESES EXPORTS
Alle 574 gespeicherten Projektdateien sind enthalten und stimmen bytegenau mit
dem unveränderten Quellstand überein. Archivintegrität und SHA-256 wurden geprüft.
3D-Modelle sind echte eingebettete Dateien, keine Git-LFS-Verweise. Die lokalen
Laufzeitassets sind enthalten; es gibt keine extern geladenen Laufzeitbibliotheken
in den öffentlichen Spieldateien. Ein Vergleich mit der öffentlichen Live-URL
war per HTTP nicht möglich. Ein neuer Build und ein Zielaccounttest wurden beim
Export nicht ausgeführt; Bun und installierte Projektabhängigkeiten fehlen hier.
Die im Ordner design/ vorhandenen Spielprüfungen beziehen sich auf frühere
Projektarbeiten und sind keine neue Importprüfung.
