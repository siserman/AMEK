# AMEK Sortiment

285 Artikel in 30 Abteilungen, in der Reihenfolge des Rundgangs durch den Markt. Erzeugt mit `node tools/sortiment.mjs` aus `data/sortiment.json` und `data/produktdaten.json`; nicht von Hand bearbeiten.

Zum Durchsuchen, mit Datenblatt, Barcode und QR-Code je Artikel: [sortiment.html](sortiment.html) (im Spiel-Server unter `/docs/sortiment.html`).

- **Preise:** ungefähre Regalpreise eines deutschen Discounters, Stand 2025/26. Grundpreis je kg oder l nach Preisangabenverordnung. MwSt A = 7 %, B = 19 %.
- **Verpackung:** Art und Hauptmaterial; Maße der Verkaufseinheit als Breite × Höhe × Tiefe in mm (dieselben Maße wie die 3D-Packungen im Spiel).
- **Nährwerte:** Je 100 g bzw. 100 ml wie verkauft (Tiefkühlware unzubereitet). Typische Werte vergleichbarer Discounter-Artikel, geschätzt, keine Angaben echter Produkte. kJ = kcal × 4,184.
- **EAN:** EAN-13 mit GS1-Präfix 20 (für den internen Gebrauch freigegeben, kollidiert mit keinem echten Artikel): 20 · 2635 (AMEK auf der Telefontastatur) · Abteilung (3) · Artikel (3) · Prüfziffer. QR-Code: GS1 Digital Link, z. B. https://amek.example/01/02026350010016.
- **Marken:** alle erfunden.

Kennzeichnung der Nährwerte:

- `table`: Nährwerttabelle auf der Packung
- `loose`: Keine Nährwertpflicht: lose Ware ohne Fertigpackung
- `single`: Keine Nährwertpflicht: unverarbeitetes Erzeugnis aus einer Zutat (LMIV Anhang V)
- `annex-v`: Keine Nährwertpflicht nach LMIV Anhang V (Kaffee, Tee, Gewürze, Salz, Mineralwasser, Kaugummi)
- `alcohol`: Keine Nährwertpflicht: Getränk mit mehr als 1,2 % vol Alkohol
- `e-label`: Brennwert auf dem Etikett, Zutaten und Nährwerte über den QR-Code (E-Label, Pflicht für Wein seit 8. 12. 2023)
- `feed`: Futtermittel: analytische Bestandteile statt Nährwerttabelle
- `nonfood`: kein Lebensmittel

## Obst & Gemüse

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Bananen | Erntegut | lose, je kg | lose Ware | 220 × 90 × 140 | 1,49 | je kg | `2026350010016` · Kasse 1001 |
| Äpfel Elstar (statt 2,29) | Erntegut | 1 kg | Netz mit Etikettenclip, PE | 170 × 120 × 130 | 1,79 | 1 kg = 1,79 € | `2026350010023` |
| Äpfel Braeburn | Erntegut | lose, je kg | lose Ware | 160 × 80 × 100 | 2,49 | je kg | `2026350010030` · Kasse 1002 |
| Birnen Conference | Erntegut | lose, je kg | lose Ware | 160 × 100 × 100 | 2,49 | je kg | `2026350010047` · Kasse 1003 |
| Orangen | Erntegut | 2 kg | Netz mit Etikettenclip, PE | 220 × 150 × 160 | 2,99 | 1 kg = 1,50 € | `2026350010054` |
| Clementinen | Erntegut | 1 kg | Netz mit Etikettenclip, PE | 180 × 110 × 130 | 1,99 | 1 kg = 1,99 € | `2026350010061` |
| Zitronen | Erntegut | 500 g | Netz mit Etikettenclip, PE | 140 × 90 × 100 | 1,29 | 1 kg = 2,58 € | `2026350010078` |
| Tafeltrauben hell, kernlos | Erntegut | 500 g | Schale mit Deckelfolie, PET/PE | 180 × 70 × 120 | 1,99 | 1 kg = 3,98 € | `2026350010085` |
| Heidelbeeren | Erntegut | 125 g | Klappschale, rPET | 110 × 50 × 90 | 1,49 | 1 kg = 11,92 € | `2026350010092` |
| Kiwi | Erntegut | 1 Stück | Stückware mit Aufkleber | 60 × 50 × 50 | 0,29 |  | `2026350010108` |
| Avocado, verzehrreif | Erntegut | 1 Stück | Stückware mit Aufkleber | 70 × 70 × 70 | 0,99 |  | `2026350010115` |
| Rispentomaten | Erntegut | 500 g | Schale mit Deckelfolie, PET/PE | 180 × 80 × 120 | 1,49 | 1 kg = 2,98 € | `2026350010122` |
| Cherry-Romatomaten | Erntegut | 250 g | Klappschale, rPET | 130 × 60 × 100 | 0,99 | 1 kg = 3,96 € | `2026350010139` |
| Salatgurke | Erntegut | 1 Stück | Stückware in Schrumpffolie, PE | 300 × 50 × 50 | 0,69 |  | `2026350010146` |
| Paprika Mix rot, gelb, grün | Erntegut | 500 g | Netz mit Etikettenclip, PE | 200 × 100 × 120 | 1,99 | 1 kg = 3,98 € | `2026350010153` |
| Eisbergsalat | Erntegut | 1 Stück | Stückware in Folienbeutel, PP | 150 × 130 × 150 | 0,99 |  | `2026350010160` |
| Speisemöhren | Erntegut | 1 kg | Netz mit Etikettenclip, PE | 240 × 70 × 130 | 0,99 | 1 kg = 0,99 € | `2026350010177` |
| Speisezwiebeln | Erntegut | 1 kg | Netz mit Etikettenclip, PE | 170 × 120 × 130 | 0,99 | 1 kg = 0,99 € | `2026350010184` |
| Knoblauch | Erntegut | 3 Stück | Netz mit Etikettenclip, PE | 120 × 60 × 70 | 0,99 |  | `2026350010191` |
| Speisekartoffeln, festkochend | Erntegut | 2,5 kg | Beutel mit Sichtfenster, Papier | 240 × 300 × 120 | 2,79 | 1 kg = 1,12 € | `2026350010207` |
| Champignons weiß | Erntegut | 400 g | Schale mit Deckelfolie, PET/PE | 170 × 70 × 120 | 1,79 | 1 kg = 4,48 € | `2026350010214` |
| Brokkoli | Erntegut | 1 Stück | Stückware mit Aufkleber | 130 × 120 × 130 | 1,29 |  | `2026350010221` |
| Zucchini | Erntegut | lose, je kg | lose Ware | 220 × 60 × 80 | 1,99 | je kg | `2026350010238` · Kasse 1004 |
| Ingwer | Erntegut | lose, je kg | lose Ware | 100 × 40 × 60 | 3,99 | je kg | `2026350010245` · Kasse 1005 |
| Hokkaido-Kürbis | Erntegut | 1 Stück | Stückware mit Aufkleber | 170 × 130 × 170 | 1,49 |  | `2026350010252` |
| Bio-Bananen | AMEK Bio | 5 Stück | Bündel mit Banderole, Papier | 220 × 90 × 140 | 1,99 |  | `2026350010269` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| *Bananen* | 389 / 93 | 0,2 | 0,1 | 20 | 17 | 2 | 1,2 | 0 |
| *Äpfel Elstar* | 226 / 54 | 0,1 | 0 | 12 | 10 | 2,3 | 0,3 | 0 |
| *Äpfel Braeburn* | 226 / 54 | 0,1 | 0 | 12 | 10 | 2,3 | 0,3 | 0 |
| *Birnen Conference* | 230 / 55 | 0,3 | 0 | 12,4 | 10 | 3 | 0,5 | 0 |
| *Orangen* | 176 / 42 | 0,2 | 0 | 8,3 | 8,3 | 1,6 | 1 | 0 |
| *Clementinen* | 192 / 46 | 0,3 | 0 | 9 | 9 | 1,7 | 0,7 | 0 |
| *Zitronen* | 126 / 30 | 0,6 | 0,1 | 4 | 2,5 | 2,8 | 0,7 | 0 |
| *Tafeltrauben hell, kernlos* | 293 / 70 | 0,3 | 0,1 | 15,6 | 15,6 | 1,5 | 0,7 | 0 |
| *Heidelbeeren* | 176 / 42 | 0,6 | 0 | 7,4 | 7,4 | 4,9 | 0,6 | 0 |
| *Kiwi* | 213 / 51 | 0,6 | 0,1 | 9,1 | 9 | 2,1 | 1 | 0 |
| *Avocado, verzehrreif* | 858 / 205 | 21 | 3,1 | 1,9 | 0,4 | 6,3 | 1,9 | < 0,1 |
| *Rispentomaten* | 75 / 18 | 0,2 | 0 | 2,6 | 2,6 | 1 | 0,9 | < 0,1 |
| *Cherry-Romatomaten* | 92 / 22 | 0,2 | 0 | 3,6 | 3,5 | 1,2 | 1 | < 0,1 |
| *Salatgurke* | 59 / 14 | 0,2 | 0 | 2 | 1,8 | 0,5 | 0,6 | < 0,1 |
| *Paprika Mix rot, gelb, grün* | 113 / 27 | 0,4 | 0,1 | 5 | 4,5 | 2 | 1 | 0 |
| *Eisbergsalat* | 54 / 13 | 0,2 | 0 | 1,6 | 1,6 | 1 | 0,9 | < 0,1 |
| *Speisemöhren* | 151 / 36 | 0,2 | 0 | 6,7 | 6,4 | 2,9 | 0,9 | 0,15 |
| *Speisezwiebeln* | 117 / 28 | 0,3 | 0 | 5 | 4,4 | 1,8 | 1,2 | 0 |
| *Knoblauch* | 590 / 141 | 0,1 | 0 | 28 | 1,6 | 1,8 | 6,1 | < 0,1 |
| *Speisekartoffeln, festkochend* | 301 / 72 | 0,1 | 0 | 15 | 0,8 | 2,1 | 2 | 0 |
| *Champignons weiß* | 88 / 21 | 0,3 | 0,1 | 0,6 | 0,2 | 1,9 | 2,9 | < 0,1 |
| *Brokkoli* | 142 / 34 | 0,2 | 0 | 2,7 | 1,7 | 3 | 3,8 | < 0,1 |
| *Zucchini* | 84 / 20 | 0,4 | 0,1 | 2,2 | 1,9 | 1,1 | 1,6 | 0 |
| *Ingwer* | 247 / 59 | 0,6 | 0,2 | 10 | 1,7 | 2 | 1,7 | < 0,1 |
| *Hokkaido-Kürbis* | 264 / 63 | 0,6 | 0,1 | 12,6 | 6 | 2,4 | 1,7 | 0 |
| *Bio-Bananen* | 389 / 93 | 0,2 | 0,1 | 20 | 17 | 2 | 1,2 | 0 |

## Blumen & Kräuter

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Basilikum im Topf | Erntegut | 1 Topf | Kulturtopf mit Folienhülle, PP/PE | 120 × 200 × 120 | 1,29 |  | `2026350020015` |
| Besenheide (Calluna) | Erntegut | 1 Topf, Ø 11 cm | Kulturtopf, PP | 120 × 220 × 120 | 1,49 |  | `2026350020022` |
| Chrysantheme | Erntegut | 1 Topf, Ø 14 cm | Kulturtopf, PP | 160 × 260 × 160 | 2,99 |  | `2026350020039` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| *Basilikum im Topf* | 172 / 41 | 0,8 | 0,1 | 5,1 | 0,3 | 3 | 3,1 | < 0,1 |

## Backstation

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Weizenbrötchen | aus dem Ofen | 1 Stück, 55 g | lose aus der Backstation, Papiertüte am Regal, Papier | 90 × 50 × 80 | 0,19 |  | `2026350030014` · Kasse 1101 |
| Mehrkornbrötchen | aus dem Ofen | 1 Stück, 70 g | lose aus der Backstation, Papiertüte am Regal, Papier | 90 × 50 × 80 | 0,35 |  | `2026350030021` · Kasse 1102 |
| Laugenbrezel | aus dem Ofen | 1 Stück, 80 g | lose aus der Backstation, Papiertüte am Regal, Papier | 130 × 35 × 110 | 0,45 |  | `2026350030038` · Kasse 1103 |
| Buttercroissant | aus dem Ofen | 1 Stück, 60 g | lose aus der Backstation, Papiertüte am Regal, Papier | 140 × 50 × 80 | 0,49 |  | `2026350030045` · Kasse 1104 |
| Schoko-Croissant | aus dem Ofen | 1 Stück, 80 g | lose aus der Backstation, Papiertüte am Regal, Papier | 140 × 50 × 80 | 0,69 |  | `2026350030052` · Kasse 1105 |
| Baguette | aus dem Ofen | 1 Stück, 250 g | lose aus der Backstation, Brotbeutel, Papier | 500 × 60 × 70 | 0,99 |  | `2026350030069` · Kasse 1106 |
| Roggenmischbrot | aus dem Ofen | 750 g | lose aus der Backstation, Brotbeutel, Papier | 240 × 110 × 130 | 1,79 | 1 kg = 2,39 € | `2026350030076` · Kasse 1107 |
| Berliner mit Konfitürefüllung | aus dem Ofen | 1 Stück, 75 g | lose aus der Backstation, Papiertüte am Regal, Papier | 90 × 50 × 90 | 0,59 |  | `2026350030083` · Kasse 1108 |
| Laugenstange mit Käse | aus dem Ofen | 1 Stück, 90 g | lose aus der Backstation, Papiertüte am Regal, Papier | 200 × 45 × 50 | 0,79 |  | `2026350030090` · Kasse 1109 |
| Apfeltasche | aus dem Ofen | 1 Stück, 100 g | lose aus der Backstation, Papiertüte am Regal, Papier | 110 × 40 × 80 | 0,79 |  | `2026350030106` · Kasse 1110 |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| *Weizenbrötchen* | 1109 / 265 | 1,5 | 0,3 | 52 | 2,5 | 3 | 9 | 1,3 |
| *Mehrkornbrötchen* | 1121 / 268 | 4,5 | 0,6 | 44 | 2,2 | 6 | 10 | 1,2 |
| *Laugenbrezel* | 1130 / 270 | 2,5 | 0,5 | 52 | 1,5 | 2,5 | 8,5 | 2,3 |
| *Buttercroissant* | 1757 / 420 | 23 | 14 | 44 | 7 | 2 | 8 | 1 |
| *Schoko-Croissant* | 1799 / 430 | 24 | 14 | 46 | 14 | 2,5 | 7,5 | 0,9 |
| *Baguette* | 1088 / 260 | 1,2 | 0,3 | 53 | 2,5 | 2,8 | 8,5 | 1,4 |
| *Roggenmischbrot* | 941 / 225 | 1,3 | 0,2 | 44 | 2,5 | 6 | 6,5 | 1,3 |
| *Berliner mit Konfitürefüllung* | 1506 / 360 | 16 | 7 | 47 | 18 | 1,8 | 6 | 0,6 |
| *Laugenstange mit Käse* | 1255 / 300 | 9 | 4,5 | 41 | 2 | 2,2 | 12 | 2 |
| *Apfeltasche* | 1255 / 300 | 15 | 7,5 | 36 | 13 | 1,8 | 4 | 0,5 |

## Brot & Toast

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Buttertoast | Ofenmeister | 500 g | Schlauchbeutel mit Clip, PP | 270 × 120 × 120 | 1,19 | 1 kg = 2,38 € | `2026350040013` |
| Vollkorntoast | Ofenmeister | 500 g | Schlauchbeutel mit Clip, PP | 270 × 120 × 120 | 1,29 | 1 kg = 2,58 € | `2026350040020` |
| Roggen-Vollkornbrot, geschnitten | Ofenmeister | 500 g | Folienverpackung, PP | 200 × 100 × 90 | 1,19 | 1 kg = 2,38 € | `2026350040037` |
| Knäckebrot Roggen | Ofenmeister | 250 g | Faltschachtel mit Innenbeutel, Karton/PP | 200 × 80 × 100 | 0,99 | 1 kg = 3,96 € | `2026350040044` |
| Weizen-Tortilla-Wraps | Ofenmeister | 6 Stück, 370 g | wiederverschließbarer Beutel, PE | 250 × 250 × 30 | 1,29 | 1 kg = 3,49 € | `2026350040051` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Buttertoast | 1130 / 270 | 4,5 | 2 | 48 | 5 | 2,8 | 8 | 1,1 |
| Vollkorntoast | 1046 / 250 | 4 | 0,6 | 41 | 3,8 | 6,5 | 9 | 1 |
| Roggen-Vollkornbrot, geschnitten | 837 / 200 | 1,2 | 0,2 | 38 | 3 | 8 | 6 | 1,1 |
| Knäckebrot Roggen | 1423 / 340 | 1,7 | 0,3 | 64 | 1,5 | 17 | 9,5 | 1,1 |
| Weizen-Tortilla-Wraps | 1255 / 300 | 6,5 | 2,9 | 50 | 3 | 2,5 | 8,5 | 1,3 |

## Molkerei & Eier

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Frische Vollmilch 3,5 % | Milchwiese | 1 l | Giebelkarton mit Schraubverschluss, Verbundkarton | 70 × 235 × 70 | 1,15 | 1 l = 1,15 € | `2026350050012` |
| Haltbare fettarme Milch 1,5 % | Milchwiese | 1 l | Tetra Brik mit Schraubverschluss, Verbundkarton | 65 × 200 × 95 | 0,99 | 1 l = 0,99 € | `2026350050029` |
| Bio-Vollmilch 3,8 % | AMEK Bio | 1 l | Giebelkarton mit Schraubverschluss, Verbundkarton | 70 × 235 × 70 | 1,49 | 1 l = 1,49 € | `2026350050036` |
| Haferdrink | Grünzeit | 1 l | Tetra Brik mit Schraubverschluss, Verbundkarton | 65 × 200 × 95 | 0,99 | 1 l = 0,99 € | `2026350050043` |
| Naturjoghurt 3,5 % | Milchwiese | 500 g | Becher mit Aluplatine, PP/Aluminium | 98 × 85 × 98 | 0,79 | 1 kg = 1,58 € | `2026350050050` |
| Joghurt nach griechischer Art 10 % | Milchwiese | 500 g | Becher mit Aluplatine, PP/Aluminium | 98 × 85 × 98 | 1,59 | 1 kg = 3,18 € | `2026350050067` |
| Fruchtjoghurt Erdbeere | Milchwiese | 150 g | Becher mit Aluplatine, PS/Aluminium | 72 × 72 × 72 | 0,39 | 1 kg = 2,60 € | `2026350050074` |
| Fruchtjoghurt Kirsche | Milchwiese | 150 g | Becher mit Aluplatine, PS/Aluminium | 72 × 72 × 72 | 0,39 | 1 kg = 2,60 € | `2026350050081` |
| Fruchtjoghurt Pfirsich-Maracuja | Milchwiese | 150 g | Becher mit Aluplatine, PS/Aluminium | 72 × 72 × 72 | 0,39 | 1 kg = 2,60 € | `2026350050098` |
| Fruchtjoghurt Heidelbeere | Milchwiese | 150 g | Becher mit Aluplatine, PS/Aluminium | 72 × 72 × 72 | 0,39 | 1 kg = 2,60 € | `2026350050104` |
| Skyr natur | Milchwiese | 450 g | Becher mit Aluplatine, PP/Aluminium | 100 × 75 × 100 | 1,39 | 1 kg = 3,09 € | `2026350050111` |
| Magerquark | Milchwiese | 500 g | Becher mit Aluplatine, PP/Aluminium | 110 × 75 × 110 | 1,19 | 1 kg = 2,38 € | `2026350050128` |
| Deutsche Markenbutter | Milchwiese | 250 g | Einwickler, Alu/Papier-Verbund | 125 × 40 × 65 | 1,49 | 1 kg = 5,96 € | `2026350050135` |
| Pflanzenmargarine | Grünzeit | 500 g | Becher mit Deckel, PP | 130 × 60 × 130 | 1,29 | 1 kg = 2,58 € | `2026350050142` |
| Schlagsahne 30 % | Milchwiese | 200 g | Kartonpackung, Verbundkarton | 55 × 120 × 55 | 0,85 | 1 kg = 4,25 € | `2026350050159` |
| Schmand 24 % | Milchwiese | 200 g | Becher mit Aluplatine, PP/Aluminium | 85 × 60 × 85 | 0,69 | 1 kg = 3,45 € | `2026350050166` |
| Eier aus Freilandhaltung, Gr. M | Milchwiese | 10 Stück | Eierkarton, Faserguss (Pulpe) | 270 × 70 × 110 | 3,19 |  | `2026350050173` |
| Eier aus Bodenhaltung, Gr. M | Milchwiese | 10 Stück | Eierkarton, Faserguss (Pulpe) | 270 × 70 × 110 | 2,59 |  | `2026350050180` |
| Pudding Schokolade | Milchwiese | 4 × 125 g | Becher mit Aluplatine, Banderole, PS/Aluminium/Karton, 4 Einheiten | 150 × 70 × 75 | 0,99 | 1 kg = 1,98 € | `2026350050197` |
| Pudding Vanille | Milchwiese | 4 × 125 g | Becher mit Aluplatine, Banderole, PS/Aluminium/Karton, 4 Einheiten | 150 × 70 × 75 | 0,99 | 1 kg = 1,98 € | `2026350050203` |
| Milchreis Zimt | Milchwiese | 200 g | Becher mit Aluplatine, PP/Aluminium | 80 × 70 × 80 | 0,49 | 1 kg = 2,45 € | `2026350050210` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Frische Vollmilch 3,5 % | 268 / 64 | 3,5 | 2,3 | 4,8 | 4,8 | 0 | 3,3 | 0,13 |
| Haltbare fettarme Milch 1,5 % | 197 / 47 | 1,5 | 1 | 4,9 | 4,9 | 0 | 3,4 | 0,13 |
| Bio-Vollmilch 3,8 % | 280 / 67 | 3,8 | 2,5 | 4,7 | 4,7 | 0 | 3,3 | 0,13 |
| Haferdrink | 192 / 46 | 1,5 | 0,2 | 6,7 | 4 | 0,8 | 0,6 | 0,1 |
| Naturjoghurt 3,5 % | 268 / 64 | 3,5 | 2,3 | 4,6 | 4,6 | 0 | 3,8 | 0,13 |
| Joghurt nach griechischer Art 10 % | 510 / 122 | 10 | 6,6 | 4,1 | 4,1 | 0 | 4 | 0,13 |
| Fruchtjoghurt Erdbeere | 410 / 98 | 2,8 | 1,8 | 14,5 | 13,5 | 0,3 | 3,3 | 0,12 |
| Fruchtjoghurt Kirsche | 410 / 98 | 2,8 | 1,8 | 14,5 | 13,5 | 0,3 | 3,3 | 0,12 |
| Fruchtjoghurt Pfirsich-Maracuja | 410 / 98 | 2,8 | 1,8 | 14,5 | 13,5 | 0,3 | 3,3 | 0,12 |
| Fruchtjoghurt Heidelbeere | 410 / 98 | 2,8 | 1,8 | 14,5 | 13,5 | 0,3 | 3,3 | 0,12 |
| Skyr natur | 264 / 63 | 0,2 | 0,1 | 4 | 4 | 0 | 11 | 0,1 |
| Magerquark | 280 / 67 | 0,2 | 0,1 | 4 | 4 | 0 | 12 | 0,1 |
| Deutsche Markenbutter | 3100 / 741 | 82 | 55 | 0,6 | 0,6 | 0 | 0,7 | < 0,1 |
| Pflanzenmargarine | 2636 / 630 | 70 | 26 | 0,5 | 0,5 | 0 | 0,2 | 0,25 |
| Schlagsahne 30 % | 1222 / 292 | 30 | 20 | 3,2 | 3,2 | 0 | 2,4 | < 0,1 |
| Schmand 24 % | 1004 / 240 | 24 | 16 | 3,5 | 3,5 | 0 | 2,6 | 0,1 |
| *Eier aus Freilandhaltung, Gr. M* | 573 / 137 | 9,3 | 2,7 | 0,7 | 0,7 | 0 | 12,9 | 0,35 |
| *Eier aus Bodenhaltung, Gr. M* | 573 / 137 | 9,3 | 2,7 | 0,7 | 0,7 | 0 | 12,9 | 0,35 |
| Pudding Schokolade | 435 / 104 | 2,6 | 1,7 | 17 | 14 | 0,5 | 3,2 | 0,15 |
| Pudding Vanille | 418 / 100 | 2,7 | 1,8 | 16 | 13 | 0,2 | 2,9 | 0,12 |
| Milchreis Zimt | 452 / 108 | 2,8 | 1,9 | 17,5 | 9,5 | 0,3 | 3,3 | 0,1 |

## Käse

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Gouda jung, in Scheiben (statt 2,79) | Käsekammer | 400 g | Schale mit wiederverschließbarer Folie, PET/PE | 160 × 30 × 170 | 2,29 | 1 kg = 5,73 € | `2026350060011` |
| Emmentaler, gerieben | Käsekammer | 200 g | wiederverschließbarer Beutel, PE/PA | 150 × 200 × 40 | 1,79 | 1 kg = 8,95 € | `2026350060028` |
| Mozzarella | Käsekammer | 125 g | Beutel mit Lake, PE | 110 × 130 × 40 | 0,89 | 1 kg = 7,12 € | `2026350060035` |
| Feta | Käsekammer | 200 g | Schale mit Lake und Deckelfolie, PP | 120 × 45 × 80 | 1,89 | 1 kg = 9,45 € | `2026350060042` |
| Camembert | Käsekammer | 125 g | Papier in Spanschachtel, Papier/Holz | 110 × 35 × 110 | 0,99 | 1 kg = 7,92 € | `2026350060059` |
| Parmigiano Reggiano, gerieben | Käsekammer | 100 g | wiederverschließbarer Beutel, PE/PA | 120 × 160 × 30 | 1,99 | 1 kg = 19,90 € | `2026350060066` |
| Frischkäse Natur | Käsekammer | 200 g | Becher mit Siegelfolie und Deckel, PP | 100 × 50 × 100 | 0,89 | 1 kg = 4,45 € | `2026350060073` |
| Frischkäse Kräuter | Käsekammer | 200 g | Becher mit Siegelfolie und Deckel, PP | 100 × 50 × 100 | 0,89 | 1 kg = 4,45 € | `2026350060080` |
| Grill- und Pfannenkäse | Käsekammer | 200 g | Schale mit wiederverschließbarer Folie, PET/PE | 140 × 35 × 120 | 1,69 | 1 kg = 8,45 € | `2026350060097` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Gouda jung, in Scheiben | 1490 / 356 | 28 | 19 | 0 | 0 | 0 | 25 | 2 |
| Emmentaler, gerieben | 1590 / 380 | 29,5 | 20 | 0 | 0 | 0 | 28,5 | 0,5 |
| Mozzarella | 987 / 236 | 18 | 12,5 | 1 | 1 | 0 | 17,5 | 0,5 |
| Feta | 1121 / 268 | 22 | 15 | 0,5 | 0,5 | 0 | 17 | 2,8 |
| Camembert | 1213 / 290 | 23 | 15 | 0,1 | 0,1 | 0 | 20 | 1,8 |
| Parmigiano Reggiano, gerieben | 1674 / 400 | 29 | 19 | 0 | 0 | 0 | 33 | 1,6 |
| Frischkäse Natur | 1017 / 243 | 23 | 15,5 | 3,5 | 3,5 | 0 | 5,5 | 0,75 |
| Frischkäse Kräuter | 975 / 233 | 22 | 14,5 | 3,5 | 3 | 0,3 | 5,3 | 1 |
| Grill- und Pfannenkäse | 1297 / 310 | 24 | 16 | 1,5 | 1,5 | 0 | 22 | 2,3 |

## Wurst & Aufschnitt

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Salami, hauchdünn | Hofmetzger | 100 g | Schale mit wiederverschließbarer Folie, PET/PE | 120 × 20 × 180 | 1,29 | 1 kg = 12,90 € | `2026350070010` |
| Kochschinken | Hofmetzger | 200 g | Schale mit wiederverschließbarer Folie, PET/PE | 140 × 20 × 190 | 2,49 | 1 kg = 12,45 € | `2026350070027` |
| Hähnchenbrust-Aufschnitt | Hofmetzger | 150 g | Schale mit wiederverschließbarer Folie, PET/PE | 120 × 20 × 180 | 1,69 | 1 kg = 11,27 € | `2026350070034` |
| Fleischwurst | Hofmetzger | 400 g | Kunstdarm im Vakuumbeutel, PA/PE | 200 × 50 × 120 | 2,29 | 1 kg = 5,73 € | `2026350070041` |
| Wiener Würstchen | Hofmetzger | 6 Stück, 300 g | Glas mit Twist-off-Deckel, Glas/Weißblech | 200 × 35 × 140 | 2,49 | 1 kg = 8,30 € | `2026350070058` |
| Speckwürfel | Hofmetzger | 2 × 125 g | Vakuumschale, PET/PE, 2 Einheiten | 120 × 25 × 150 | 1,79 | 1 kg = 7,16 € | `2026350070065` |
| Feine Leberwurst | Hofmetzger | 125 g | Becher mit Aluplatine, PP/Aluminium | 85 × 45 × 85 | 0,99 | 1 kg = 7,92 € | `2026350070072` |
| Vegane Salami-Alternative | Grünzeit | 80 g | Schale mit wiederverschließbarer Folie, PET/PE | 120 × 20 × 160 | 1,29 | 1 kg = 16,13 € | `2026350070089` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Salami, hauchdünn | 1674 / 400 | 35 | 13 | 1 | 0,5 | 0 | 21 | 4,5 |
| Kochschinken | 481 / 115 | 3 | 1,1 | 1 | 1 | 0 | 21 | 2,2 |
| Hähnchenbrust-Aufschnitt | 439 / 105 | 1,5 | 0,5 | 1,5 | 1 | 0 | 21 | 2 |
| Fleischwurst | 1172 / 280 | 25 | 9,5 | 1 | 0,5 | 0 | 13 | 2,2 |
| Wiener Würstchen | 1088 / 260 | 22 | 8,5 | 1 | 0,5 | 0 | 14 | 2,1 |
| Speckwürfel | 1213 / 290 | 25 | 9,5 | 0,5 | 0,5 | 0 | 16 | 3,5 |
| Feine Leberwurst | 1255 / 300 | 27 | 10 | 2 | 1 | 0 | 13 | 1,9 |
| Vegane Salami-Alternative | 1130 / 270 | 18 | 1,6 | 6 | 1,5 | 3 | 21 | 3,2 |

## Fleisch & Fisch

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Hackfleisch gemischt | Hofmetzger | 500 g | Schutzatmosphäre-Schale mit Folie, rPET/PE | 190 × 50 × 140 | 4,29 | 1 kg = 8,58 € | `2026350080019` |
| Rinderhackfleisch | Hofmetzger | 500 g | Schutzatmosphäre-Schale mit Folie, rPET/PE | 190 × 50 × 140 | 5,49 | 1 kg = 10,98 € | `2026350080026` |
| Hähnchenbrustfilet (statt 5,79) | Hofmetzger | 400 g | Schutzatmosphäre-Schale mit Folie, rPET/PE | 190 × 45 × 140 | 4,79 | 1 kg = 11,98 € | `2026350080033` |
| Schweineschnitzel | Hofmetzger | 500 g | Schutzatmosphäre-Schale mit Folie, rPET/PE | 210 × 40 × 150 | 4,49 | 1 kg = 8,98 € | `2026350080040` |
| Bratwurst grob | Hofmetzger | 400 g | Schutzatmosphäre-Schale mit Folie, rPET/PE | 210 × 40 × 140 | 2,99 | 1 kg = 7,48 € | `2026350080057` |
| Hähnchen-Unterschenkel | Hofmetzger | 1 kg | Schutzatmosphäre-Schale mit Folie, rPET/PE | 240 × 60 × 180 | 3,49 | 1 kg = 3,49 € | `2026350080064` |
| Lachsfilet mit Haut | Meeresbrise | 250 g | Schutzatmosphäre-Schale mit Folie, rPET/PE | 180 × 40 × 130 | 4,49 | 1 kg = 17,96 € | `2026350080071` |
| Räucherlachs, geschnitten | Meeresbrise | 100 g | Schale mit wiederverschließbarer Folie, PET/PE | 130 × 20 × 200 | 2,49 | 1 kg = 24,90 € | `2026350080088` |
| Veganes Hack | Grünzeit | 275 g | Schutzatmosphäre-Schale mit Folie, rPET/PE | 170 × 45 × 130 | 2,49 | 1 kg = 9,05 € | `2026350080095` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Hackfleisch gemischt | 1046 / 250 | 20 | 8 | 0 | 0 | 0 | 17,5 | 0,15 |
| Rinderhackfleisch | 900 / 215 | 15 | 6,5 | 0 | 0 | 0 | 20 | 0,15 |
| Hähnchenbrustfilet | 448 / 107 | 1,2 | 0,3 | 0 | 0 | 0 | 24 | 0,15 |
| Schweineschnitzel | 448 / 107 | 2 | 0,8 | 0 | 0 | 0 | 22 | 0,15 |
| Bratwurst grob | 1213 / 290 | 26 | 10 | 0,5 | 0,3 | 0 | 14 | 1,9 |
| Hähnchen-Unterschenkel | 669 / 160 | 9,5 | 2,7 | 0 | 0 | 0 | 18,5 | 0,25 |
| Lachsfilet mit Haut | 858 / 205 | 14 | 2,5 | 0 | 0 | 0 | 20 | 0,15 |
| Räucherlachs, geschnitten | 753 / 180 | 10 | 2 | 0 | 0 | 0 | 22,5 | 3,2 |
| Veganes Hack | 833 / 199 | 11 | 1 | 5 | 0,6 | 4 | 18 | 1,4 |

## Frische Küche

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Kartoffelsalat mit Gurke | Feinkostküche | 500 g | Becher mit Siegelfolie und Deckel, PP | 120 × 85 × 120 | 1,49 | 1 kg = 2,98 € | `2026350090018` |
| Hummus Natur | Grünzeit | 200 g | Becher mit Siegelfolie und Deckel, PP | 100 × 50 × 100 | 1,19 | 1 kg = 5,95 € | `2026350090025` |
| Frische Tortelloni Ricotta & Spinat | Pastaria | 250 g | Schutzatmosphäre-Schale mit Folie, PP/PE | 160 × 40 × 200 | 1,49 | 1 kg = 5,96 € | `2026350090032` |
| Frische Tortelloni Käse | Pastaria | 250 g | Schutzatmosphäre-Schale mit Folie, PP/PE | 160 × 40 × 200 | 1,49 | 1 kg = 5,96 € | `2026350090049` |
| Frischer Pizzateig, ausgerollt | Pastaria | 400 g | Rolle in Papier, Röhrenverpackung, Karton/Papier | 320 × 70 × 70 | 1,29 | 1 kg = 3,23 € | `2026350090056` |
| Kartoffel-Gnocchi | Pastaria | 500 g | Schutzatmosphäre-Beutel, PE/PA | 160 × 220 × 40 | 1,19 | 1 kg = 2,38 € | `2026350090063` |
| Tofu Natur | Grünzeit | 400 g | Schale mit Lake und Deckelfolie, PP | 120 × 45 × 100 | 1,69 | 1 kg = 4,23 € | `2026350090070` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Kartoffelsalat mit Gurke | 678 / 162 | 11 | 1 | 14 | 2,5 | 1,5 | 1,8 | 1,3 |
| Hummus Natur | 1251 / 299 | 25 | 2,5 | 9 | 0,5 | 5 | 7 | 1 |
| Frische Tortelloni Ricotta & Spinat | 1038 / 248 | 7 | 3,5 | 36 | 2,5 | 2,5 | 9,5 | 1 |
| Frische Tortelloni Käse | 1130 / 270 | 8,5 | 4,5 | 37 | 2 | 2 | 11 | 1,1 |
| Frischer Pizzateig, ausgerollt | 1184 / 283 | 7,5 | 1,2 | 46 | 2,5 | 2 | 7,5 | 1,3 |
| Kartoffel-Gnocchi | 649 / 155 | 0,6 | 0,1 | 33 | 0,8 | 1,5 | 3,8 | 1,2 |
| Tofu Natur | 544 / 130 | 7,5 | 1,2 | 1,5 | 0,5 | 1 | 13,5 | < 0,1 |

## Tiefkühl

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Steinofen-Pizza Salami | Frostino | 350 g | Faltschachtel, Pizza in Folie, Karton/PP | 290 × 40 × 290 | 1,79 | 1 kg = 5,11 € | `2026350100014` |
| Steinofen-Pizza Margherita | Frostino | 320 g | Faltschachtel, Pizza in Folie, Karton/PP | 290 × 40 × 290 | 1,59 | 1 kg = 4,97 € | `2026350100021` |
| Steinofen-Pizza Speciale | Frostino | 370 g | Faltschachtel, Pizza in Folie, Karton/PP | 290 × 40 × 290 | 1,99 | 1 kg = 5,38 € | `2026350100038` |
| Steinofen-Pizza Tonno | Frostino | 350 g | Faltschachtel, Pizza in Folie, Karton/PP | 290 × 40 × 290 | 1,99 | 1 kg = 5,69 € | `2026350100045` |
| Pommes Frites (statt 1,79) | Frostino | 1 kg | Tiefkühlbeutel, PE | 220 × 60 × 300 | 1,49 | 1 kg = 1,49 € | `2026350100052` |
| Rahmspinat | Frostino | 450 g | Faltschachtel, Karton (beschichtet) | 140 × 40 × 200 | 1,09 | 1 kg = 2,42 € | `2026350100069` |
| Junge Erbsen, sehr fein | Frostino | 1 kg | Tiefkühlbeutel, PE | 220 × 60 × 300 | 1,99 | 1 kg = 1,99 € | `2026350100076` |
| Kaisergemüse | Frostino | 1 kg | Tiefkühlbeutel, PE | 220 × 60 × 300 | 2,19 | 1 kg = 2,19 € | `2026350100083` |
| Fischstäbchen, 15 Stück | Meeresbrise | 450 g | Faltschachtel, Karton (beschichtet) | 210 × 40 × 160 | 2,79 | 1 kg = 6,20 € | `2026350100090` |
| Wildlachsfilets | Meeresbrise | 2 × 125 g | Faltschachtel, Filets einzeln vakuumiert, Karton/PE, 2 Einheiten | 180 × 35 × 140 | 4,29 | 1 kg = 17,16 € | `2026350100106` |
| Beerenmischung | Frostino | 500 g | Tiefkühlbeutel, PE | 180 × 50 × 250 | 2,49 | 1 kg = 4,98 € | `2026350100113` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Steinofen-Pizza Salami | 1084 / 259 | 11 | 4,5 | 29 | 3,5 | 2 | 11 | 1,4 |
| Steinofen-Pizza Margherita | 992 / 237 | 9 | 4 | 29 | 3,5 | 2 | 10 | 1,2 |
| Steinofen-Pizza Speciale | 962 / 230 | 9,5 | 4,2 | 26 | 3 | 2 | 10 | 1,4 |
| Steinofen-Pizza Tonno | 950 / 227 | 8,5 | 3 | 27 | 3,5 | 2 | 10,5 | 1,2 |
| Pommes Frites | 598 / 143 | 4,5 | 0,5 | 22 | 0,5 | 2,5 | 2,5 | 0,1 |
| Rahmspinat | 234 / 56 | 3,5 | 2 | 3 | 1,5 | 2 | 2,5 | 0,9 |
| Junge Erbsen, sehr fein | 322 / 77 | 0,6 | 0,1 | 10 | 5,5 | 5 | 5,5 | < 0,1 |
| Kaisergemüse | 130 / 31 | 0,3 | 0,1 | 3,5 | 2,8 | 2,5 | 2,2 | < 0,1 |
| Fischstäbchen, 15 Stück | 828 / 198 | 8,5 | 0,8 | 17 | 1,2 | 1 | 13 | 0,8 |
| Wildlachsfilets | 523 / 125 | 4,3 | 0,8 | 0 | 0 | 0 | 21,5 | 0,2 |
| Beerenmischung | 167 / 40 | 0,3 | 0 | 6 | 6 | 4 | 1 | 0 |

## Eis

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Vanilleeis | Gelatino | 1 l | Eisbox mit Deckel, PP | 170 × 80 × 120 | 1,79 | 1 l = 1,79 € | `2026350110013` |
| Schokoladeneis | Gelatino | 1 l | Eisbox mit Deckel, PP | 170 × 80 × 120 | 1,79 | 1 l = 1,79 € | `2026350110020` |
| Stracciatella-Eis | Gelatino | 1 l | Eisbox mit Deckel, PP | 170 × 80 × 120 | 1,79 | 1 l = 1,79 € | `2026350110037` |
| Eis am Stiel Classic | Gelatino | 6 × 110 ml | Faltschachtel, Stiele einzeln verpackt, Karton/PP, 6 Einheiten | 200 × 50 × 160 | 2,99 | 1 l = 4,53 € | `2026350110044` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Vanilleeis | 444 / 106 | 5,5 | 3,8 | 12,5 | 11 | 0,2 | 1,6 | < 0,1 |
| Schokoladeneis | 477 / 114 | 5,8 | 4 | 13,5 | 12 | 0,8 | 2 | < 0,1 |
| Stracciatella-Eis | 490 / 117 | 6,5 | 4,8 | 13 | 11,5 | 0,3 | 1,6 | < 0,1 |
| Eis am Stiel Classic | 920 / 220 | 14,5 | 10 | 20 | 18 | 0,5 | 2,5 | < 0,1 |

## Frühstück & Aufstriche

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Haferflocken, zart | Goldkorn | 500 g | Beutel, Papier | 130 × 200 × 60 | 0,69 | 1 kg = 1,38 € | `2026350120012` |
| Knusper-Müsli Schoko | Morgenstund | 600 g | Faltschachtel mit Innenbeutel, Karton/PP | 190 × 260 × 70 | 2,29 | 1 kg = 3,82 € | `2026350120029` |
| Früchte-Müsli | Morgenstund | 750 g | Faltschachtel mit Innenbeutel, Karton/PP | 190 × 260 × 70 | 1,99 | 1 kg = 2,65 € | `2026350120036` |
| Cornflakes | Morgenstund | 375 g | Faltschachtel mit Innenbeutel, Karton/PP | 190 × 280 × 60 | 1,29 | 1 kg = 3,44 € | `2026350120043` |
| Schoko-Kissen | Morgenstund | 500 g | Faltschachtel mit Innenbeutel, Karton/PP | 190 × 270 × 60 | 1,79 | 1 kg = 3,58 € | `2026350120050` |
| Nuss-Nougat-Creme (statt 3,29) | Cremello | 750 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 100 × 150 × 100 | 2,79 | 1 kg = 3,72 € | `2026350120067` |
| Konfitüre extra Erdbeere | Fruchtgarten | 450 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 77 × 110 × 77 | 1,49 | 1 kg = 3,31 € | `2026350120074` |
| Konfitüre extra Sauerkirsche | Fruchtgarten | 450 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 77 × 110 × 77 | 1,49 | 1 kg = 3,31 € | `2026350120081` |
| Konfitüre extra Aprikose | Fruchtgarten | 450 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 77 × 110 × 77 | 1,49 | 1 kg = 3,31 € | `2026350120098` |
| Blütenhonig, cremig | Imkerei Sommerfeld | 500 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 80 × 110 × 80 | 3,99 | 1 kg = 7,98 € | `2026350120104` |
| Erdnusscreme, crunchy | Cremello | 350 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 80 × 110 × 80 | 1,99 | 1 kg = 5,69 € | `2026350120111` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Haferflocken, zart | 1556 / 372 | 7 | 1,3 | 58,7 | 0,7 | 10 | 13,5 | < 0,1 |
| Knusper-Müsli Schoko | 1866 / 446 | 16 | 6 | 63 | 22 | 7 | 9 | 0,2 |
| Früchte-Müsli | 1464 / 350 | 5,5 | 1 | 62 | 22 | 8 | 9 | < 0,1 |
| Cornflakes | 1582 / 378 | 0,9 | 0,2 | 84 | 8 | 3 | 7 | 1,1 |
| Schoko-Kissen | 1874 / 448 | 17 | 4 | 66 | 30 | 3,5 | 6 | 0,4 |
| Nuss-Nougat-Creme | 2255 / 539 | 30,9 | 10,6 | 57,5 | 56,3 | 3,4 | 6,3 | 0,11 |
| Konfitüre extra Erdbeere | 1046 / 250 | 0,1 | 0 | 61 | 59 | 1 | 0,4 | < 0,1 |
| Konfitüre extra Sauerkirsche | 1046 / 250 | 0,1 | 0 | 61 | 59 | 1 | 0,4 | < 0,1 |
| Konfitüre extra Aprikose | 1046 / 250 | 0,1 | 0 | 61 | 59 | 1 | 0,4 | < 0,1 |
| *Blütenhonig, cremig* | 1372 / 328 | 0 | 0 | 81,5 | 81,5 | 0 | 0,4 | < 0,1 |
| Erdnusscreme, crunchy | 2556 / 611 | 49 | 9 | 13 | 6,5 | 7 | 26 | 1,1 |

## Kaffee & Tee

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Röstkaffee klassisch, gemahlen | Caffè Monte | 500 g | Vakuumziegel, Alu-Verbundfolie | 90 × 170 × 60 | 6,49 | 1 kg = 12,98 € | `2026350130011` |
| Röstkaffee mild, gemahlen | Caffè Monte | 500 g | Vakuumziegel, Alu-Verbundfolie | 90 × 170 × 60 | 6,49 | 1 kg = 12,98 € | `2026350130028` |
| Röstkaffee entkoffeiniert, gemahlen | Caffè Monte | 500 g | Vakuumziegel, Alu-Verbundfolie | 90 × 170 × 60 | 6,99 | 1 kg = 13,98 € | `2026350130035` |
| Caffè Crema, ganze Bohne (statt 13,99) | Caffè Monte | 1 kg | Standbodenbeutel mit Aromaventil, Alu-Verbundfolie | 130 × 270 × 80 | 10,99 | 1 kg = 10,99 € | `2026350130042` |
| Espresso, ganze Bohne | Caffè Monte | 1 kg | Standbodenbeutel mit Aromaventil, Alu-Verbundfolie | 130 × 270 × 80 | 14,49 | 1 kg = 14,49 € | `2026350130059` |
| Kaffeepads Classic | Caffè Monte | 16 Stück, 111 g | Beutel im Karton, Pads einzeln aromaversiegelt, Karton/Verbundfolie, 16 Einheiten | 130 × 130 × 70 | 2,29 | 1 kg = 20,63 € | `2026350130066` |
| Kaffeekapseln Lungo | Caffè Monte | 10 Stück, 52 g | Faltschachtel, Kapseln aus Aluminium, Karton/Aluminium, 10 Einheiten | 110 × 110 × 45 | 2,49 | 1 kg = 47,88 € | `2026350130073` |
| Pfefferminztee | Teeblatt | 20 Beutel, 30 g | Faltschachtel, Beutel einzeln im Kuvert, Karton/Papier, 20 Einheiten | 120 × 75 × 70 | 0,79 | 1 kg = 26,33 € | `2026350130080` |
| Kamillentee | Teeblatt | 20 Beutel, 30 g | Faltschachtel, Beutel einzeln im Kuvert, Karton/Papier, 20 Einheiten | 120 × 75 × 70 | 0,79 | 1 kg = 26,33 € | `2026350130097` |
| Früchtetee Waldbeere | Teeblatt | 20 Beutel, 50 g | Faltschachtel, Beutel einzeln im Kuvert, Karton/Papier, 20 Einheiten | 120 × 75 × 70 | 0,99 | 1 kg = 19,80 € | `2026350130103` |
| Schwarzer Tee Earl Grey | Teeblatt | 20 Beutel, 35 g | Faltschachtel, Beutel einzeln im Kuvert, Karton/Papier, 20 Einheiten | 120 × 75 × 70 | 1,29 | 1 kg = 36,86 € | `2026350130110` |
| Grüner Tee | Teeblatt | 20 Beutel, 35 g | Faltschachtel, Beutel einzeln im Kuvert, Karton/Papier, 20 Einheiten | 120 × 75 × 70 | 1,29 | 1 kg = 36,86 € | `2026350130127` |
| Kakao-Getränkepulver | Cremello | 800 g | Dose mit Kunststoffdeckel, Karton/Weißblech | 110 × 160 × 110 | 3,49 | 1 kg = 4,36 € | `2026350130134` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Kakao-Getränkepulver | 1586 / 379 | 3 | 1,8 | 80 | 76 | 6 | 5 | 0,1 |

## Nudeln & Reis

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Spaghetti | Pastaria | 500 g | Faltschachtel, Karton | 75 × 270 × 35 | 0,89 | 1 kg = 1,78 € | `2026350140010` |
| Penne Rigate | Pastaria | 500 g | Beutel, PP | 130 × 220 × 60 | 0,89 | 1 kg = 1,78 € | `2026350140027` |
| Fusilli | Pastaria | 500 g | Beutel, PP | 130 × 220 × 60 | 0,89 | 1 kg = 1,78 € | `2026350140034` |
| Farfalle | Pastaria | 500 g | Beutel, PP | 130 × 220 × 60 | 0,99 | 1 kg = 1,98 € | `2026350140041` |
| Vollkorn-Spaghetti | Pastaria | 500 g | Faltschachtel, Karton | 75 × 270 × 35 | 1,19 | 1 kg = 2,38 € | `2026350140058` |
| Lasagneplatten | Pastaria | 500 g | Faltschachtel, Karton | 120 × 220 × 60 | 1,29 | 1 kg = 2,58 € | `2026350140065` |
| Eierspätzle | Goldkorn | 500 g | Beutel, PP | 140 × 220 × 60 | 1,49 | 1 kg = 2,98 € | `2026350140072` |
| Mie-Nudeln | Wokwerk | 250 g | Faltschachtel, Karton | 140 × 170 × 50 | 0,99 | 1 kg = 3,96 € | `2026350140089` |
| Langkornreis | Goldkorn | 1 kg | Faltschachtel, Karton | 120 × 190 × 70 | 1,79 | 1 kg = 1,79 € | `2026350140096` |
| Basmati-Reis | Goldkorn | 1 kg | Beutel, PP | 130 × 220 × 70 | 2,79 | 1 kg = 2,79 € | `2026350140102` |
| Kochbeutel-Reis Langkorn | Goldkorn | 4 × 125 g | Faltschachtel, Kochbeutel einzeln, Karton/PP, 4 Einheiten | 120 × 190 × 50 | 1,29 | 1 kg = 2,58 € | `2026350140119` |
| Couscous | Goldkorn | 500 g | Faltschachtel, Karton | 110 × 170 × 60 | 1,19 | 1 kg = 2,38 € | `2026350140126` |
| Rote Linsen | Goldkorn | 500 g | Beutel, PP | 120 × 180 × 50 | 1,49 | 1 kg = 2,98 € | `2026350140133` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Spaghetti | 1481 / 354 | 1,5 | 0,3 | 71 | 3,5 | 3 | 12,5 | < 0,1 |
| Penne Rigate | 1481 / 354 | 1,5 | 0,3 | 71 | 3,5 | 3 | 12,5 | < 0,1 |
| Fusilli | 1481 / 354 | 1,5 | 0,3 | 71 | 3,5 | 3 | 12,5 | < 0,1 |
| Farfalle | 1481 / 354 | 1,5 | 0,3 | 71 | 3,5 | 3 | 12,5 | < 0,1 |
| Vollkorn-Spaghetti | 1418 / 339 | 2,5 | 0,4 | 62 | 3,5 | 8 | 13 | < 0,1 |
| Lasagneplatten | 1481 / 354 | 1,5 | 0,3 | 71 | 3,5 | 3 | 12,5 | < 0,1 |
| Eierspätzle | 1531 / 366 | 3 | 0,8 | 70 | 2 | 2,5 | 13,5 | 0,1 |
| Mie-Nudeln | 1510 / 361 | 2,5 | 0,6 | 72 | 2,5 | 2,5 | 12,5 | 0,4 |
| Langkornreis | 1456 / 348 | 0,6 | 0,2 | 78 | 0,2 | 1,4 | 7 | 0 |
| Basmati-Reis | 1460 / 349 | 0,8 | 0,2 | 78 | 0,2 | 1,3 | 7,5 | 0 |
| Kochbeutel-Reis Langkorn | 1456 / 348 | 0,6 | 0,2 | 78 | 0,2 | 1,4 | 7 | 0 |
| Couscous | 1473 / 352 | 1,5 | 0,3 | 70 | 2 | 4 | 12,5 | < 0,1 |
| Rote Linsen | 1389 / 332 | 2 | 0,3 | 48 | 1,5 | 11 | 25 | < 0,1 |

## Backen & Grundnahrung

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Weizenmehl Type 405 | Goldkorn | 1 kg | Faltschachtel, Karton | 110 × 190 × 70 | 0,65 | 1 kg = 0,65 € | `2026350150019` |
| Dinkelmehl Type 630 | Goldkorn | 1 kg | Faltschachtel, Karton | 110 × 190 × 70 | 1,29 | 1 kg = 1,29 € | `2026350150026` |
| Feinzucker | Goldkorn | 1 kg | Faltschachtel, Karton | 100 × 160 × 70 | 0,79 | 1 kg = 0,79 € | `2026350150033` |
| Puderzucker | Goldkorn | 250 g | Faltschachtel, Karton | 80 × 130 × 50 | 0,59 | 1 kg = 2,36 € | `2026350150040` |
| Jodsalz mit Fluorid | Goldkorn | 500 g | Faltschachtel mit Ausgießer, Karton | 80 × 120 × 45 | 0,29 | 1 kg = 0,58 € | `2026350150057` |
| Speisestärke | Goldkorn | 400 g | Faltschachtel, Karton | 90 × 150 × 50 | 0,79 | 1 kg = 1,98 € | `2026350150064` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Weizenmehl Type 405 | 1427 / 341 | 1 | 0,2 | 71 | 0,5 | 4 | 10 | < 0,1 |
| Dinkelmehl Type 630 | 1448 / 346 | 1,5 | 0,3 | 69 | 1 | 4 | 12 | < 0,1 |
| Feinzucker | 1674 / 400 | 0 | 0 | 100 | 100 | 0 | 0 | 0 |
| Puderzucker | 1674 / 400 | 0 | 0 | 100 | 100 | 0 | 0 | 0 |
| Speisestärke | 1490 / 356 | 0,1 | 0 | 88 | 0,5 | 0,5 | 0,4 | < 0,1 |

## Gewürze

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Pfeffer schwarz, gemahlen | Würzwerk | 50 g | Streudose, PET | 45 × 95 × 45 | 0,99 | 1 kg = 19,80 € | `2026350160018` |
| Paprika edelsüß | Würzwerk | 50 g | Streudose, PET | 45 × 95 × 45 | 0,79 | 1 kg = 15,80 € | `2026350160025` |
| Oregano, gerebelt | Würzwerk | 12 g | Streudose, PET | 45 × 95 × 45 | 0,79 | 1 kg = 65,83 € | `2026350160032` |
| Curry | Würzwerk | 50 g | Streudose, PET | 45 × 95 × 45 | 0,89 | 1 kg = 17,80 € | `2026350160049` |
| Zimt, gemahlen | Würzwerk | 40 g | Streudose, PET | 45 × 95 × 45 | 0,79 | 1 kg = 19,75 € | `2026350160056` |
| Kräuter der Provence | Würzwerk | 15 g | Streudose, PET | 45 × 95 × 45 | 0,89 | 1 kg = 59,33 € | `2026350160063` |
| Chiliflocken | Würzwerk | 40 g | Streudose, PET | 45 × 95 × 45 | 0,99 | 1 kg = 24,75 € | `2026350160070` |

## Saucen, Öl & Essig

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Passierte Tomaten | Pastaria | 500 g | Tetra Recart, Verbundkarton | 70 × 130 × 60 | 0,59 | 1 kg = 1,18 € | `2026350170017` |
| Pesto Genovese | Pastaria | 190 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 68 × 90 × 68 | 1,59 | 1 kg = 8,37 € | `2026350170024` |
| Pesto Rosso | Pastaria | 190 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 68 × 90 × 68 | 1,59 | 1 kg = 8,37 € | `2026350170031` |
| Nudelsauce Basilikum | Pastaria | 500 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 80 × 130 × 80 | 1,29 | 1 kg = 2,58 € | `2026350170048` |
| Nudelsauce Arrabbiata | Pastaria | 500 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 80 × 130 × 80 | 1,29 | 1 kg = 2,58 € | `2026350170055` |
| Nudelsauce Bolognese | Pastaria | 500 g | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 80 × 130 × 80 | 1,69 | 1 kg = 3,38 € | `2026350170062` |
| Tomatenmark, 2-fach konzentriert | Pastaria | 200 g | Tube, Aluminium | 180 × 45 × 45 | 0,79 | 1 kg = 3,95 € | `2026350170079` |
| Tomatenketchup | Saucenhaus | 500 ml | Kopfstehflasche, PP | 75 × 200 × 50 | 1,29 | 1 l = 2,58 € | `2026350170086` |
| Delikatess-Mayonnaise | Saucenhaus | 500 ml | Kopfstehflasche, PP | 75 × 200 × 50 | 1,49 | 1 l = 2,98 € | `2026350170093` |
| Senf, mittelscharf | Saucenhaus | 200 ml | Schraubglas mit Twist-off-Deckel, Glas/Weißblech | 65 × 100 × 65 | 0,69 | 1 l = 3,45 € | `2026350170109` |
| Sonnenblumenöl | Saucenhaus | 1 l | Flasche, PET | 85 × 290 × 85 | 1,79 | 1 l = 1,79 € | `2026350170116` |
| Rapsöl | Saucenhaus | 1 l | Flasche, PET | 85 × 290 × 85 | 1,69 | 1 l = 1,69 € | `2026350170123` |
| Natives Olivenöl extra | Pastaria | 750 ml | Flasche, Glas | 75 × 290 × 75 | 5,99 | 1 l = 7,99 € | `2026350170130` |
| Aceto Balsamico di Modena | Pastaria | 500 ml | Flasche, Glas | 70 × 270 × 70 | 1,19 | 1 l = 2,38 € | `2026350170147` |
| Gemüsebrühe, instant | Würzwerk | 300 g | Glas mit Kunststoffdeckel, Glas/PP | 90 × 130 × 90 | 1,49 | 1 kg = 4,97 € | `2026350170154` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Passierte Tomaten | 126 / 30 | 0,2 | 0 | 5 | 4,5 | 1,2 | 1,4 | 0,1 |
| Pesto Genovese | 1971 / 471 | 47 | 6 | 6 | 3 | 2 | 5 | 3 |
| Pesto Rosso | 1611 / 385 | 37 | 4,5 | 8 | 6 | 2 | 4 | 2,6 |
| Nudelsauce Basilikum | 209 / 50 | 1,5 | 0,2 | 7 | 6 | 1,5 | 1,5 | 0,9 |
| Nudelsauce Arrabbiata | 218 / 52 | 1,8 | 0,2 | 7 | 5,8 | 1,5 | 1,5 | 1 |
| Nudelsauce Bolognese | 343 / 82 | 4 | 1,4 | 6,5 | 5 | 1 | 5 | 1 |
| Tomatenmark, 2-fach konzentriert | 347 / 83 | 0,5 | 0,1 | 13 | 12 | 4 | 4,5 | 0,15 |
| Tomatenketchup | 410 / 98 | 0,1 | 0 | 23 | 22 | 0,8 | 1,2 | 1,8 |
| Delikatess-Mayonnaise | 3017 / 721 | 79 | 6 | 1,5 | 1,2 | 0 | 1,1 | 1,2 |
| Senf, mittelscharf | 381 / 91 | 4,5 | 0,3 | 5 | 3,5 | 3 | 6 | 3,5 |
| Sonnenblumenöl | 3464 / 828 | 92 | 10 | 0 | 0 | 0 | 0 | 0 |
| Rapsöl | 3464 / 828 | 92 | 6,5 | 0 | 0 | 0 | 0 | 0 |
| Natives Olivenöl extra | 3464 / 828 | 92 | 13 | 0 | 0 | 0 | 0 | 0 |
| Aceto Balsamico di Modena | 402 / 96 | 0 | 0 | 23,5 | 21,5 | 0 | 0,5 | < 0,1 |
| Gemüsebrühe, instant | 912 / 218 | 10 | 4,5 | 26 | 10 | 1 | 6 | 52 |

## Konserven

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Gehackte Tomaten | Gartenland | 400 g | Konservendose mit Aufreißdeckel, Weißblech | 75 × 110 × 75 | 0,59 | 1 kg = 1,48 € | `2026350180016` |
| Gemüsemais | Gartenland | 340 g | Konservendose mit Aufreißdeckel, Weißblech | 75 × 90 × 75 | 0,89 | 1 kg = 2,62 € | `2026350180023` |
| Kidneybohnen | Gartenland | 400 g | Konservendose mit Aufreißdeckel, Weißblech | 75 × 110 × 75 | 0,69 | 1 kg = 1,73 € | `2026350180030` |
| Kichererbsen | Gartenland | 400 g | Konservendose mit Aufreißdeckel, Weißblech | 75 × 110 × 75 | 0,79 | 1 kg = 1,98 € | `2026350180047` |
| Gewürzgurken | Gartenland | 670 g | Glas mit Twist-off-Deckel, Glas/Weißblech | 90 × 160 × 90 | 1,49 | 1 kg = 2,22 € | `2026350180054` |
| Thunfischfilets in Sonnenblumenöl | Meeresbrise | 150 g | Konservendose mit Aufreißdeckel, Weißblech | 85 × 35 × 85 | 1,59 | 1 kg = 10,60 € | `2026350180061` |
| Sauerkraut, mild | Gartenland | 850 ml | Konservendose mit Aufreißdeckel, Weißblech | 100 × 120 × 100 | 0,99 | 1 l = 1,16 € | `2026350180078` |
| Ravioli in Tomatensauce | Pastaria | 800 g | Konservendose mit Aufreißdeckel, Weißblech | 100 × 120 × 100 | 1,49 | 1 kg = 1,86 € | `2026350180085` |
| Linsen-Eintopf mit Würstchen | Gartenland | 800 g | Konservendose mit Aufreißdeckel, Weißblech | 100 × 120 × 100 | 1,79 | 1 kg = 2,24 € | `2026350180092` |
| Pfirsiche, halbe Frucht | Gartenland | 820 g | Konservendose mit Aufreißdeckel, Weißblech | 100 × 120 × 100 | 1,39 | 1 kg = 1,70 € | `2026350180108` |
| Apfelmus | Gartenland | 720 ml | Glas mit Twist-off-Deckel, Glas/Weißblech | 85 × 140 × 85 | 1,09 | 1 l = 1,51 € | `2026350180115` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Gehackte Tomaten | 92 / 22 | 0,1 | 0 | 3,6 | 3,5 | 1 | 1,2 | < 0,1 |
| Gemüsemais | 347 / 83 | 1,2 | 0,2 | 13,5 | 4,5 | 3,2 | 2,9 | 0,3 |
| Kidneybohnen | 423 / 101 | 0,5 | 0,1 | 13,5 | 1,2 | 7,5 | 7 | 0,3 |
| Kichererbsen | 494 / 118 | 2,5 | 0,3 | 14 | 0,5 | 5,5 | 7 | 0,4 |
| Gewürzgurken | 100 / 24 | 0,1 | 0 | 5 | 4,5 | 0,8 | 0,4 | 1,4 |
| Thunfischfilets in Sonnenblumenöl | 791 / 189 | 9 | 1,5 | 0 | 0 | 0 | 27 | 1 |
| Sauerkraut, mild | 75 / 18 | 0,2 | 0 | 1,5 | 0,6 | 2,5 | 1,2 | 1,2 |
| Ravioli in Tomatensauce | 364 / 87 | 2,5 | 1 | 13 | 3 | 1 | 3 | 0,9 |
| Linsen-Eintopf mit Würstchen | 406 / 97 | 4 | 1,4 | 9 | 1,2 | 2,5 | 5 | 0,9 |
| Pfirsiche, halbe Frucht | 272 / 65 | 0,1 | 0 | 15 | 14,5 | 1 | 0,5 | < 0,1 |
| Apfelmus | 305 / 73 | 0,1 | 0 | 17 | 15 | 1,5 | 0,2 | < 0,1 |

## Süßwaren

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Alpenvollmilch-Schokolade | Chocolino | 100 g | Faltschachtel, Tafel in Folie, Karton/Aluminium | 80 × 160 × 14 | 1,09 | 1 kg = 10,90 € | `2026350190015` |
| Zartbitter-Schokolade 70 % | Chocolino | 100 g | Faltschachtel, Tafel in Folie, Karton/Aluminium | 80 × 160 × 14 | 1,29 | 1 kg = 12,90 € | `2026350190022` |
| Vollmilch Ganze Haselnuss | Chocolino | 100 g | Faltschachtel, Tafel in Folie, Karton/Aluminium | 80 × 160 × 14 | 1,29 | 1 kg = 12,90 € | `2026350190039` |
| Joghurt-Erdbeer-Schokolade | Chocolino | 100 g | Faltschachtel, Tafel in Folie, Karton/Aluminium | 80 × 160 × 14 | 1,09 | 1 kg = 10,90 € | `2026350190046` |
| Weiße Schokolade | Chocolino | 100 g | Faltschachtel, Tafel in Folie, Karton/Aluminium | 80 × 160 × 14 | 1,09 | 1 kg = 10,90 € | `2026350190053` |
| Edel-Marzipan-Schokolade | Chocolino | 100 g | Faltschachtel, Tafel in Folie, Karton/Aluminium | 80 × 160 × 14 | 1,29 | 1 kg = 12,90 € | `2026350190060` |
| Fruchtgummi Bärchen | Naschwerk | 200 g | Beutel, PP (metallisiert) | 130 × 190 × 35 | 0,89 | 1 kg = 4,45 € | `2026350190077` |
| Saure Schlangen | Naschwerk | 200 g | Beutel, PP (metallisiert) | 130 × 190 × 35 | 0,89 | 1 kg = 4,45 € | `2026350190084` |
| Lakritz-Schnecken | Naschwerk | 200 g | Beutel, PP (metallisiert) | 130 × 190 × 35 | 0,99 | 1 kg = 4,95 € | `2026350190091` |
| Butterkekse | Krümelkönig | 200 g | Schlauchbeutel, PP | 210 × 65 × 60 | 0,85 | 1 kg = 4,25 € | `2026350190107` |
| Doppelkekse Kakao | Krümelkönig | 500 g | Schlauchbeutel, PP | 220 × 70 × 80 | 1,49 | 1 kg = 2,98 € | `2026350190114` |
| Haselnusswaffeln | Krümelkönig | 250 g | Schlauchbeutel, PP | 170 × 90 × 60 | 1,19 | 1 kg = 4,76 € | `2026350190121` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Alpenvollmilch-Schokolade | 2238 / 535 | 30 | 18 | 57 | 56 | 1,5 | 6,5 | 0,25 |
| Zartbitter-Schokolade 70 % | 2339 / 559 | 41 | 25 | 33 | 28 | 11 | 9 | < 0,1 |
| Vollmilch Ganze Haselnuss | 2280 / 545 | 35 | 15 | 48 | 46 | 3 | 8 | 0,2 |
| Joghurt-Erdbeer-Schokolade | 2310 / 552 | 34 | 19 | 56 | 55 | 0,5 | 5,5 | 0,25 |
| Weiße Schokolade | 2284 / 546 | 32 | 19 | 58 | 58 | 0 | 6,5 | 0,25 |
| Edel-Marzipan-Schokolade | 1933 / 462 | 24 | 6,5 | 52 | 48 | 4 | 7,5 | < 0,1 |
| Fruchtgummi Bärchen | 1435 / 343 | 0,1 | 0 | 77 | 46 | 0 | 6,9 | < 0,1 |
| Saure Schlangen | 1418 / 339 | 0,3 | 0,1 | 80 | 55 | 0 | 4 | 0,2 |
| Lakritz-Schnecken | 1381 / 330 | 0,5 | 0,1 | 76 | 40 | 1,5 | 4,5 | 0,5 |
| Butterkekse | 1816 / 434 | 12 | 7,5 | 74 | 22 | 2 | 7,5 | 0,8 |
| Doppelkekse Kakao | 2000 / 478 | 20 | 9,5 | 68 | 38 | 3 | 5 | 0,7 |
| Haselnusswaffeln | 2159 / 516 | 28 | 12 | 60 | 38 | 2 | 6 | 0,3 |

## Knabbern & Nüsse

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Kartoffelchips Paprika (statt 1,19) | Knusperland | 175 g | Beutel, PP (metallisiert) | 180 × 260 × 75 | 0,89 | 1 kg = 5,09 € | `2026350200011` |
| Kartoffelchips Gesalzen (statt 1,19) | Knusperland | 175 g | Beutel, PP (metallisiert) | 180 × 260 × 75 | 0,89 | 1 kg = 5,09 € | `2026350200028` |
| Kartoffelchips Sour Cream & Onion (statt 1,19) | Knusperland | 175 g | Beutel, PP (metallisiert) | 180 × 260 × 75 | 0,89 | 1 kg = 5,09 € | `2026350200035` |
| Salzstangen | Knusperland | 250 g | Beutel, PP (metallisiert) | 100 × 250 × 50 | 0,79 | 1 kg = 3,16 € | `2026350200042` |
| Tortilla-Chips Nacho Cheese | Knusperland | 200 g | Beutel, PP (metallisiert) | 180 × 260 × 75 | 1,29 | 1 kg = 6,45 € | `2026350200059` |
| Erdnuss-Flips | Knusperland | 200 g | Beutel, PP (metallisiert) | 170 × 260 × 70 | 0,99 | 1 kg = 4,95 € | `2026350200066` |
| Erdnüsse, geröstet & gesalzen | Nussgarten | 200 g | Beutel, PP (metallisiert) | 130 × 190 × 50 | 1,19 | 1 kg = 5,95 € | `2026350200073` |
| Studentenfutter | Nussgarten | 200 g | Beutel, PP (metallisiert) | 130 × 190 × 50 | 1,79 | 1 kg = 8,95 € | `2026350200080` |
| Cashewkerne, naturbelassen | Nussgarten | 200 g | Beutel, PP (metallisiert) | 130 × 190 × 50 | 2,79 | 1 kg = 13,95 € | `2026350200097` |
| Walnusskerne | Nussgarten | 200 g | Beutel, PP (metallisiert) | 130 × 190 × 50 | 2,99 | 1 kg = 14,95 € | `2026350200103` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Kartoffelchips Paprika | 2201 / 526 | 32 | 3 | 51 | 3 | 4 | 6,5 | 1,4 |
| Kartoffelchips Gesalzen | 2213 / 529 | 33 | 3 | 50 | 0,5 | 4 | 6 | 1,3 |
| Kartoffelchips Sour Cream & Onion | 2209 / 528 | 32 | 3 | 51 | 3,5 | 4 | 6,5 | 1,5 |
| Salzstangen | 1598 / 382 | 4 | 0,5 | 74 | 3 | 3 | 11 | 4,3 |
| Tortilla-Chips Nacho Cheese | 2088 / 499 | 25 | 2,5 | 59 | 2,5 | 5 | 7 | 1,5 |
| Erdnuss-Flips | 2201 / 526 | 30 | 4 | 50 | 3 | 4 | 12 | 1,2 |
| Erdnüsse, geröstet & gesalzen | 2586 / 618 | 50 | 7 | 11 | 5 | 8 | 27 | 1,2 |
| Studentenfutter | 1962 / 469 | 29 | 4 | 37 | 33 | 6 | 12 | < 0,1 |
| Cashewkerne, naturbelassen | 2489 / 595 | 46 | 8 | 26 | 6 | 3 | 19 | < 0,1 |
| Walnusskerne | 2929 / 700 | 67,5 | 6,2 | 6,5 | 2,6 | 6 | 15,5 | < 0,1 |

## Weihnachtsgebäck

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Lebkuchen, schokoliert | Winterzauber | 500 g | Faltschachtel mit Folienbeutel, Karton/PP | 200 × 60 × 130 | 1,99 | 1 kg = 3,98 € | `2026350210010` |
| Butter-Spekulatius | Winterzauber | 400 g | Faltschachtel mit Folienbeutel, Karton/PP | 200 × 70 × 70 | 1,29 | 1 kg = 3,23 € | `2026350210027` |
| Dominosteine | Winterzauber | 250 g | Faltschachtel mit Folienbeutel, Karton/PP | 160 × 50 × 110 | 1,49 | 1 kg = 5,96 € | `2026350210034` |
| Schoko-Weihnachtsmann | Winterzauber | 100 g | Hohlfigur in Stanniol, Aluminium | 70 × 170 × 70 | 0,99 | 1 kg = 9,90 € | `2026350210041` |
| Christstollen | Winterzauber | 750 g | Folie in Faltschachtel, Karton/PP | 280 × 90 × 120 | 3,99 | 1 kg = 5,32 € | `2026350210058` |
| Halloween-Fruchtgummi | Naschwerk | 300 g | Beutel, PP (metallisiert) | 150 × 220 × 40 | 1,29 | 1 kg = 4,30 € | `2026350210065` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Lebkuchen, schokoliert | 1690 / 404 | 14 | 6 | 63 | 40 | 3 | 5 | 0,3 |
| Butter-Spekulatius | 2025 / 484 | 20 | 12 | 69 | 32 | 2 | 6 | 0,6 |
| Dominosteine | 1582 / 378 | 11 | 6 | 64 | 45 | 2,5 | 4,5 | < 0,1 |
| Schoko-Weihnachtsmann | 2238 / 535 | 30 | 18 | 57 | 56 | 1,5 | 6,5 | 0,25 |
| Christstollen | 1669 / 399 | 17 | 8,5 | 54 | 26 | 3 | 6 | 0,4 |
| Halloween-Fruchtgummi | 1435 / 343 | 0,1 | 0 | 77 | 46 | 0 | 6,9 | < 0,1 |

## Wasser

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Mineralwasser Classic + 1,50 Pfand | Quellgut | 6 × 1,5 l | Einweg-Flaschen im Schrumpfgebinde, PET/PE, 6 Einheiten | 270 × 330 × 180 | 1,74 | 1 l = 0,19 € | `2026350220019` |
| Mineralwasser Medium + 1,50 Pfand | Quellgut | 6 × 1,5 l | Einweg-Flaschen im Schrumpfgebinde, PET/PE, 6 Einheiten | 270 × 330 × 180 | 1,74 | 1 l = 0,19 € | `2026350220026` |
| Mineralwasser Still + 1,50 Pfand | Quellgut | 6 × 1,5 l | Einweg-Flaschen im Schrumpfgebinde, PET/PE, 6 Einheiten | 270 × 330 × 180 | 1,74 | 1 l = 0,19 € | `2026350220033` |
| Pilsener, Kasten (statt 9,99) + 3,10 Pfand, 4,9 % vol | Kellerbräu | 20 × 0,5 l | Mehrweg-Kasten mit Glasflaschen, PE-HD/Glas, 20 Einheiten | 300 × 270 × 400 | 8,49 | 1 l = 0,85 € | `2026350220040` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| *Pilsener, Kasten* | 172 / 41 | 0 | 0 | 3 | 0,2 | 0 | 0,5 | 0 |

## Säfte & Limo

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Orangensaft, 100 % Saft | Sonnhof | 1 l | Tetra Brik mit Schraubverschluss, Verbundkarton | 65 × 200 × 95 | 1,89 | 1 l = 1,89 € | `2026350230018` |
| Apfelsaft, naturtrüb | Sonnhof | 1 l | Tetra Brik mit Schraubverschluss, Verbundkarton | 65 × 200 × 95 | 1,29 | 1 l = 1,29 € | `2026350230025` |
| Multivitaminsaft | Sonnhof | 1 l | Tetra Brik mit Schraubverschluss, Verbundkarton | 65 × 200 × 95 | 1,49 | 1 l = 1,49 € | `2026350230032` |
| Apfelschorle + 0,25 Pfand | Sonnhof | 1,5 l | Einwegflasche, PET | 90 × 310 × 90 | 0,99 | 1 l = 0,66 € | `2026350230049` |
| Cola + 0,25 Pfand | Fizzo | 1,5 l | Einwegflasche, PET | 90 × 310 × 90 | 0,79 | 1 l = 0,53 € | `2026350230056` |
| Cola Zero + 0,25 Pfand | Fizzo | 1,5 l | Einwegflasche, PET | 90 × 310 × 90 | 0,79 | 1 l = 0,53 € | `2026350230063` |
| Orangenlimonade + 0,25 Pfand | Fizzo | 1,5 l | Einwegflasche, PET | 90 × 310 × 90 | 0,69 | 1 l = 0,46 € | `2026350230070` |
| Zitronenlimonade + 0,25 Pfand | Fizzo | 1,5 l | Einwegflasche, PET | 90 × 310 × 90 | 0,69 | 1 l = 0,46 € | `2026350230087` |
| Eistee Pfirsich + 0,25 Pfand | Fizzo | 1,5 l | Einwegflasche, PET | 90 × 310 × 90 | 0,79 | 1 l = 0,53 € | `2026350230094` |
| Energy Drink + 0,25 Pfand | Fizzo | 0,25 l | Getränkedose, Aluminium | 53 × 135 × 53 | 0,59 | 1 l = 2,36 € | `2026350230100` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Orangensaft, 100 % Saft | 184 / 44 | 0,1 | 0 | 9 | 9 | 0,2 | 0,7 | 0 |
| Apfelsaft, naturtrüb | 192 / 46 | 0,1 | 0 | 11 | 10,5 | 0,1 | 0,1 | 0 |
| Multivitaminsaft | 209 / 50 | 0,1 | 0 | 11,5 | 11 | 0,1 | 0,4 | < 0,1 |
| Apfelschorle | 105 / 25 | 0 | 0 | 6 | 6 | 0 | 0 | 0 |
| Cola | 176 / 42 | 0 | 0 | 10,6 | 10,6 | 0 | 0 | 0 |
| Cola Zero | 1 / 0 | 0 | 0 | 0 | 0 | 0 | 0 | < 0,1 |
| Orangenlimonade | 151 / 36 | 0 | 0 | 9 | 9 | 0 | 0 | 0 |
| Zitronenlimonade | 159 / 38 | 0 | 0 | 9,4 | 9,4 | 0 | 0 | 0 |
| Eistee Pfirsich | 105 / 25 | 0 | 0 | 6,2 | 6,2 | 0 | 0 | < 0,1 |
| Energy Drink | 192 / 46 | 0 | 0 | 11 | 11 | 0 | 0 | 0,1 |

## Bier, Wein & Sekt

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Pilsener + 0,25 Pfand, 4,9 % vol | Kellerbräu | 0,5 l Dose | Getränkedose, Aluminium | 66 × 168 × 66 | 0,55 | 1 l = 1,10 € | `2026350240017` |
| Pilsener alkoholfrei + 0,25 Pfand, 0,4 % vol | Kellerbräu | 0,5 l Dose | Getränkedose, Aluminium | 66 × 168 × 66 | 0,59 | 1 l = 1,18 € | `2026350240024` |
| Radler + 0,25 Pfand, 2,5 % vol | Kellerbräu | 0,5 l Dose | Getränkedose, Aluminium | 66 × 168 × 66 | 0,55 | 1 l = 1,10 € | `2026350240031` |
| Merlot, trocken, 13 % vol | Rebenhang | 0,75 l | Flasche mit Schraubverschluss, Glas | 75 × 300 × 75 | 2,99 | 1 l = 3,99 € | `2026350240048` |
| Primitivo, halbtrocken, 13,5 % vol | Rebenhang | 0,75 l | Flasche mit Schraubverschluss, Glas | 75 × 300 × 75 | 3,99 | 1 l = 5,32 € | `2026350240055` |
| Riesling, trocken, 12 % vol | Rebenhang | 0,75 l | Flasche mit Schraubverschluss, Glas | 75 × 320 × 75 | 3,49 | 1 l = 4,65 € | `2026350240062` |
| Roséwein, 12 % vol | Rebenhang | 0,75 l | Flasche mit Schraubverschluss, Glas | 75 × 300 × 75 | 2,99 | 1 l = 3,99 € | `2026350240079` |
| Sekt, trocken, 11 % vol | Perlwerk | 0,75 l | Flasche mit Korken und Agraffe, Glas | 85 × 300 × 85 | 2,99 | 1 l = 3,99 € | `2026350240086` |
| Glühwein, rot, 9,5 % vol | Winterzauber | 1 l | Flasche mit Schraubverschluss, Glas | 85 × 310 × 85 | 2,49 | 1 l = 2,49 € | `2026350240093` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| *Pilsener* | 172 / 41 | 0 | 0 | 3 | 0,2 | 0 | 0,5 | 0 |
| Pilsener alkoholfrei | 109 / 26 | 0 | 0 | 5,8 | 3,5 | 0 | 0,4 | 0 |
| *Radler* | 176 / 42 | 0 | 0 | 6,8 | 6,5 | 0 | 0,2 | 0 |
| Merlot, trocken | 314 / 75 | 0 | 0 | 0,6 | 0,4 | 0 | 0,1 | 0 |
| Primitivo, halbtrocken | 339 / 81 | 0 | 0 | 1,5 | 1,2 | 0 | 0,1 | 0 |
| Riesling, trocken | 289 / 69 | 0 | 0 | 0,6 | 0,4 | 0 | 0,1 | 0 |
| Roséwein | 297 / 71 | 0 | 0 | 1,2 | 1 | 0 | 0,1 | 0 |
| Sekt, trocken | 297 / 71 | 0 | 0 | 2,5 | 2,3 | 0 | 0,1 | 0 |
| Glühwein, rot | 397 / 95 | 0 | 0 | 10,5 | 10 | 0 | 0,1 | 0 |

## Drogerie

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Duschgel Sensitive | Pura | 300 ml | Flasche mit Klappverschluss, PE-HD | 70 × 190 × 40 | 0,85 | 1 l = 2,83 € | `2026350250016` |
| Duschgel Sport | Pura | 300 ml | Flasche mit Klappverschluss, PE-HD | 70 × 190 × 40 | 0,85 | 1 l = 2,83 € | `2026350250023` |
| Duschgel Mandelmilch | Pura | 300 ml | Flasche mit Klappverschluss, PE-HD | 70 × 190 × 40 | 0,85 | 1 l = 2,83 € | `2026350250030` |
| Shampoo Classic | Pura | 300 ml | Flasche mit Klappverschluss, PE-HD | 70 × 200 × 40 | 0,99 | 1 l = 3,30 € | `2026350250047` |
| Shampoo Anti-Schuppen | Pura | 300 ml | Flasche mit Klappverschluss, PE-HD | 70 × 200 × 40 | 0,99 | 1 l = 3,30 € | `2026350250054` |
| Zahncreme Kräuter | Pura | 75 ml | Tube in Faltschachtel, PE/Karton | 180 × 45 × 40 | 0,55 | 1 l = 7,33 € | `2026350250061` |
| Zahncreme Whitening | Pura | 75 ml | Tube in Faltschachtel, PE/Karton | 180 × 45 × 40 | 0,55 | 1 l = 7,33 € | `2026350250078` |
| Zahnbürsten, mittel | Pura | 2 Stück | Blister auf Karton, PET/Karton, 2 Einheiten | 70 × 230 × 25 | 1,29 |  | `2026350250085` |
| Deospray Fresh | Pura | 150 ml | Spraydose, Aluminium | 50 × 170 × 50 | 1,19 | 1 l = 7,93 € | `2026350250092` |
| Deospray Sensitive | Pura | 150 ml | Spraydose, Aluminium | 50 × 170 × 50 | 1,19 | 1 l = 7,93 € | `2026350250108` |
| Taschentücher, 4-lagig | Weichwolke | 10 × 10 Stück | Päckchen im Folienbeutel, PE, 10 Einheiten | 210 × 60 × 110 | 0,99 |  | `2026350250115` |
| Flüssigseife Milch & Honig | Pura | 500 ml | Flasche mit Klappverschluss, PE-HD | 80 × 200 × 50 | 0,69 | 1 l = 1,38 € | `2026350250122` |
| Slipeinlagen normal | Pura | 60 Stück | Faltschachtel, Karton | 100 × 150 × 70 | 1,19 |  | `2026350250139` |
| Wattepads | Pura | 120 Stück | Folienbeutel, PE | 70 × 170 × 70 | 0,79 |  | `2026350250146` |

## Baby

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Windeln Gr. 4 (9–14 kg) | Kleinchen | 48 Stück | Folienbeutel mit Griff, PE | 240 × 300 × 120 | 6,99 |  | `2026350260015` |
| Baby-Feuchttücher sensitiv | Kleinchen | 80 Stück | Softpack mit Klappdeckel, PE/PP | 190 × 60 × 110 | 0,99 |  | `2026350260022` |
| Karotte mit Kartoffel, ab 5. Monat | Kleinchen | 190 g | Glas mit Twist-off-Deckel, Glas/Weißblech | 65 × 80 × 65 | 0,69 | 1 kg = 3,63 € | `2026350260039` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Karotte mit Kartoffel, ab 5. Monat | 230 / 55 | 1,5 | 0,2 | 8 | 3 | 2 | 1,2 | < 0,1 |

## Haushalt

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Toilettenpapier, 3-lagig | Weichwolke | 10 × 150 Blatt | Folienbeutel, PE, 10 Einheiten | 330 × 220 × 220 | 3,99 |  | `2026350270014` |
| Küchenrolle, 3-lagig | Weichwolke | 4 × 64 Blatt | Folienbeutel, PE, 4 Einheiten | 230 × 230 × 115 | 2,49 |  | `2026350270021` |
| Spülmittel Zitrone | Glanzwerk | 500 ml | Flasche mit Klappverschluss, PE-HD | 75 × 220 × 45 | 0,75 | 1 l = 1,50 € | `2026350270038` |
| Spülmaschinen-Tabs All-in-1 | Glanzwerk | 40 Stück | Standbodenbeutel, PE | 200 × 140 × 100 | 3,99 |  | `2026350270045` |
| Colorwaschmittel, flüssig | Glanzwerk | 20 WL, 1,1 l | Flasche mit Klappverschluss, PE-HD | 130 × 260 × 80 | 2,99 | 1 l = 2,72 € | `2026350270052` |
| Vollwaschmittel, Pulver | Glanzwerk | 20 WL, 1,35 kg | Faltschachtel mit Griff, Karton | 200 × 250 × 80 | 2,79 | 1 kg = 2,07 € | `2026350270069` |
| Weichspüler Frühlingsfrisch | Glanzwerk | 1 l | Flasche mit Klappverschluss, PE-HD | 100 × 240 × 70 | 0,99 | 1 l = 0,99 € | `2026350270076` |
| Allzweckreiniger | Glanzwerk | 1 l | Flasche mit Klappverschluss, PE-HD | 100 × 260 × 60 | 0,89 | 1 l = 0,89 € | `2026350270083` |
| Müllbeutel mit Zugband, 35 l | Glanzwerk | 20 Stück | Rolle im Karton, Karton | 100 × 120 × 100 | 1,19 |  | `2026350270090` |
| Alufolie, 30 m | Glanzwerk | 30 m × 29 cm | Faltschachtel mit Abreißkante, Karton | 310 × 50 × 50 | 1,49 | 1 m = 0,05 € | `2026350270106` |
| Alkaline-Batterien AA | Werkfeld | 8 Stück | Blister auf Karton, PET/Karton, 8 Einheiten | 120 × 160 × 25 | 2,99 |  | `2026350270113` |
| Teelichter | Wohnzeit | 50 Stück | Folienbeutel, PE | 200 × 100 × 140 | 1,99 |  | `2026350270120` |

## Tierbedarf

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Katzen-Nassfutter mit Rind | Pfotenglück | 100 g | Schale mit Deckelfolie, Aluminium | 90 × 30 × 110 | 0,29 | 1 kg = 2,90 € | `2026350280013` |
| Katzen-Nassfutter mit Huhn | Pfotenglück | 100 g | Schale mit Deckelfolie, Aluminium | 90 × 30 × 110 | 0,29 | 1 kg = 2,90 € | `2026350280020` |
| Katzen-Nassfutter mit Lachs | Pfotenglück | 100 g | Schale mit Deckelfolie, Aluminium | 90 × 30 × 110 | 0,29 | 1 kg = 2,90 € | `2026350280037` |
| Hunde-Nassfutter mit Rind | Pfotenglück | 800 g | Konservendose mit Aufreißdeckel, Weißblech | 100 × 110 × 100 | 1,19 | 1 kg = 1,49 € | `2026350280044` |
| Katzen-Trockenfutter Geflügel | Pfotenglück | 1 kg | Standbodenbeutel, PE/PET | 180 × 280 × 80 | 1,99 | 1 kg = 1,99 € | `2026350280051` |
| Klumpstreu | Pfotenglück | 10 l | Beutel mit Griff, PE | 300 × 380 × 120 | 2,79 | 1 l = 0,28 € | `2026350280068` |

Analytische Bestandteile (Futtermittel):

| Artikel | Rohprotein | Fettgehalt | Rohasche | Rohfaser | Feuchtigkeit |
|---|--:|--:|--:|--:|--:|
| Katzen-Nassfutter mit Rind | 8,5 % | 5 % | 2 % | 0,3 % | 80 % |
| Katzen-Nassfutter mit Huhn | 8,5 % | 5 % | 2 % | 0,3 % | 80 % |
| Katzen-Nassfutter mit Lachs | 8,5 % | 5 % | 2 % | 0,3 % | 80 % |
| Hunde-Nassfutter mit Rind | 7,5 % | 5 % | 2,2 % | 0,4 % | 81 % |
| Katzen-Trockenfutter Geflügel | 32 % | 12 % | 7,5 % | 2,5 % | 10 % |

## Aktion der Woche

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Akku-Bohrschrauber 12 V | Werkfeld | 1 Stück, inkl. Akku | Koffer im Umkarton, Karton/PP | 300 × 250 × 100 | 29,99 |  | `2026350290012` |
| LED-Lichterkette, 100 LEDs | Wohnzeit | 1 Stück | Faltschachtel mit Sichtfenster, Karton/PET | 200 × 150 × 80 | 7,99 |  | `2026350290029` |
| Thermo-Socken, 3 Paar | Wohnzeit | Gr. 39–42 | Kartonbanderole, Karton | 130 × 250 × 30 | 5,99 |  | `2026350290036` |
| Kuschel-Fleecedecke, 150 × 200 cm | Wohnzeit | 1 Stück | Faltschachtel mit Sichtfenster, Karton/PET | 350 × 250 × 120 | 8,99 |  | `2026350290043` |
| Eiskratzer mit Handschuh | Werkfeld | 1 Stück | Hängekarte, Karton | 150 × 300 × 60 | 2,99 |  | `2026350290050` |
| Thermobecher, 0,4 l | Wohnzeit | 1 Stück | Faltschachtel, Karton | 80 × 190 × 80 | 4,99 |  | `2026350290067` |

## An der Kasse

| Artikel | Marke | Inhalt | Verpackung | Maße (mm) | Preis | Grundpreis | EAN |
|---|---|---|---|---|--:|---|---|
| Papiertragetasche | AMEK | 1 Stück | Papiertragetasche, Kraftpapier | 280 × 360 × 20 | 0,35 |  | `2026350300018` |
| Kaugummi Peppermint, zuckerfrei | Naschwerk | 30 g | Dose, PP | 60 × 90 × 25 | 0,69 | 1 kg = 23,00 € | `2026350300025` |
| Erdnuss-Karamell-Riegel | Chocolino | 50 g | Flowpack, PP | 130 × 30 × 35 | 0,49 | 1 kg = 9,80 € | `2026350300032` |
| Traubenzucker Zitrone | Naschwerk | 75 g | Rolle in Papier, Papier | 100 × 70 × 25 | 0,59 | 1 kg = 7,87 € | `2026350300049` |

Nährwerte je 100 g bzw. 100 ml (*kursiv: typische Werte, keine Nährwerttabelle auf der Packung*):

| Artikel | kJ / kcal | Fett | ges. FS | KH | Zucker | Ballastst. | Eiweiß | Salz |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Erdnuss-Karamell-Riegel | 2042 / 488 | 24 | 9 | 59 | 50 | 2 | 9 | 0,6 |
| Traubenzucker Zitrone | 1540 / 368 | 0 | 0 | 91 | 91 | 0 | 0 | < 0,1 |
