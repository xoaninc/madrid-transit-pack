# Madrid Transit Pack

**[EN]** Four standardized Madrid train types for Subway Builder, one per real network — narrow-profile Metro, wide-profile Metro, Metro Ligero and Cercanías — with real-world specs (speeds, gradients, curve radii, platform lengths) taken from official technical norms and as-built project records. One type per *network* instead of per-model means branches and track sharing between lines of the same network just work.

**[ES]** Cuatro tipos de tren estandarizados de Madrid para Subway Builder, uno por red real. Al estandarizar por red en lugar de por modelo, los ramales y las vías compartidas entre líneas de la misma red funcionan sin conflictos de compatibilidad. La 1.7 refuerza esta premisa: el juego ya **prohíbe las intersecciones de vía entre tipos de tren distintos**, así que agrupar por red —y no por modelo— deja de ser una comodidad y pasa a ser lo que hace que la red se pueda trazar.

## Tipos incluidos / Included types

| ID | Red | Material de referencia | Velocidad | Composición | Pendiente máx. | Radio mín. |
|---|---|---|---|---|---|---|
| `madrid-metro-estrecho` | Metro L1-L5 + Ramal | CAF Serie 3000 | 80 km/h | 4 o 6 coches de 14,9 m (59,6-89,4 m) | 5,2 %¹ | 90 m (histórico)² |
| `madrid-metro-ancho` | Metro L6-L12 | Serie 8000 (ver nota³) | 110 km/h | 3 o 6 coches de 18,15 m (andenes hasta 115 m) | 4,0 %¹ | 250 m³ |
| `madrid-metro-ligero` | ML1-ML3 | Alstom Citadis 302 (versión Madrid: 2,40 m) | 70 km/h | 1-2 unidades de 32,16 m (186 plazas) | 6,5 %⁴ | 25 m |
| `renfe-cercanias` | Cercanías Madrid | Renfe S/452 (Alstom X'Trapolis) | 140 km/h | 1-2 unidades de 6 coches (100/200 m) | 3,5 % | 250 m⁵ |

¹ **En el juego la pendiente máxima es un permiso de construcción, así que va el techo real de la red y no el criterio de proyecto.** MM-DT-0-01 fija 35 ‰ (3,5 %) en proyecto, pero el Ramal Ópera–Príncipe Pío circula comercialmente al 52,06 ‰ (5,2 %) con material de gálibo estrecho, y el gran perfil usa el 4 % «excepcional» en la prolongación de L7 a Pitis (paso bajo la M-30), en la conexión L8–L10 y en L9 Pavones–Puerta de Arganda. Con 3,5 % no se podría reconstruir ninguno de los dos tramos. Datos de memorias de proyecto sin enlace público localizado.
² MM-DT-0-01 exige 300 m en líneas nuevas y 210 m en ampliaciones; el tipo estrecho conserva los ~90 m de las curvas históricas de L1-L5 para poder trazar por el casco antiguo.
³ Radio excepcional documentado en la memoria de la conexión L8–L10, que lo concede para «material tipo 5000» — no explícitamente para las 8000/9000. Y las cotas del tipo (18,15 m y ~200 plazas por coche) cuadran con la **Serie 8000**, cuyas composiciones de 6 coches miden ~108,8 m con ~1.270 plazas; la 9000 de AnsaldoBreda tiene medidas algo distintas.
⁴ Estimación: los Citadis admiten del 6 al 8 %, pero no hay cifra oficial publicada de ML1-ML3.
⁵ Criterio propio. El mínimo ETI para líneas nuevas de ancho ibérico es 150 m; no se ha localizado una cifra oficial única para Cercanías Madrid.

**Radio en estación:** las cuatro redes exigen curvas de radio ≥ 300 m en los andenes. En los dos tipos de metro esa cifra sale del radio de diseño de MM-DT-0-01 — *no* de las ETI, que **excluyen de su ámbito a metros y metros ligeros** (las versiones anteriores de este README lo atribuían mal). En Cercanías es criterio propio: las ETI no establecen ninguna regla de 300 m para andenes en curva.

## Procedencia de los datos

- **Reales y citados**: dimensiones, velocidades, capacidades y composiciones del material; radios de proyecto de 210/300 m (MM-DT-0-01); entrevía convencional ibérica de 3,808 m (Instrucción Técnica del Gálibo, 1985); aceleración lateral de 1,0 m/s², el máximo excepcional de insuficiencia de peralte de las ETI/ADIF (el valor normal es 0,65) — desde la 1.7 esa cifra la llevan además los campos de peralte, sin que `maxLateralAcceleration` deje de gobernar la vía antigua.
- **Derivados de datos oficiales**: entrevía del metro (~3,30 / 3,60 m, deducida del gálibo de túnel de 6,86 y 7,74 m). En Cercanías, `carLength` 16,67 m y `capacityPerCar` 151 son **promedios de la unidad** (100 ÷ 6 y 906 ÷ 6), no cotas por coche: la S/452 mezcla coches de uno y de dos pisos. El `capacityPerCar` del Metro Ligero es igualmente por unidad Citadis completa.
- **Declarados sin enlace verificable**: las pendientes reales del 5,2 % (Ramal) y del 4 % (gran perfil), de memorias de proyecto cuyos enlaces no se han localizado; el radio de 250 m del gran perfil; la aceleración de arranque del gran perfil y del Citadis; la pendiente y el radio de estación del Metro Ligero; los radios de 250 m de vía y 300 m de andén de Cercanías.
- **Equilibrio de juego**: costes de construcción, tph (42, elección del autor) y tiempos de parada. El mantenimiento, en cambio, **sí** está a la par de los tipos vanilla desde la v0.10.0 — ver más abajo.
- **Convención de este mod, no dato corporativo**: los colores. El azul institucional de Metro de Madrid es único (Pantone 286 C) y **no existe un celeste corporativo** ni ninguna distinción cromática oficial entre gálibo estrecho y gran perfil. El par azul/celeste de aquí existe solo para poder distinguir las dos redes en el mapa del juego.

> **Aviso para quien verifique estos datos:** el tipo de Cercanías modela la **Serie 452** (140 km/h, 100 m, ~905 plazas por unidad), no la **450** (759 plazas, 106-159 m). Una revisión previa de este pack lo auditó contra la 450 y marcó como erróneos varios valores que son correctos para la 452.

Detalles con sabor real: el perfil estrecho sale más barato de tunelar por el gálibo reducido (6,86 m), el Metro Ligero va en plataforma reservada y cruza a nivel (segregado, nunca en tráfico mixto), la S/452 conserva su caja de 3,10 m (16 cm más ancha que un Civia) y ~905 plazas por unidad de 100 m, con 2 coches de dos pisos.

## Instalación / Install

Copia la carpeta `madrid-transit-pack` en el directorio de mods de Subway Builder y actívalo en ajustes:

- **macOS**: `~/Library/Application Support/metro-maker4/mods/`
- **Windows**: `%APPDATA%/metro-maker4/mods/`

## Migración de líneas / Line migration (v0.12.0)

**[ES]** El pack incluye una herramienta que **migra líneas existentes a otro tipo de tren de verdad** — lo que el conversor del juego (flag `ROUTE_TYPE_CONVERSION`) no hace, porque solo reetiqueta y aborta si un andén se queda corto por centímetros.

- **Dónde**: en el **menú de inicio** (botón «Migrar líneas»), con la partida sin cargar. El panel de la barra dentro de la partida es solo diagnóstico: te dice, por línea y destino, si el tren cabe físicamente y cuántas vías incumplen radio o pendiente, y trae un atajo para encender el flag del conversor del juego.
- **Qué hace**: retipa la vía y sus grupos completos; lleva los **andenes al máximo del tipo destino** (solo los acorta si lo superan) redistribuyendo el trazado existente, sin inventar geometría; **regenera las bretelles** con el generador exacto del juego y las ensancha si el radio del destino no cabe en su ventana; adapta curvas y pendientes que incumplan la norma del tipo (con la regla real de estación: desnivel ≤ 0,1 m); **borra los trenes** de la línea y la deja parada (0 trenes, sin horario); y escribe una **partida nueva** — jamás pisa la original.
- **Flota**: por defecto los coches de los trenes borrados **se conservan en propiedad**, igual que hace el juego (no cuestan mantenimiento). Opcionalmente se reembolsan a precio de compra.
- **Líneas que comparten vía o estación** (p. ej. dos Cercanías por el mismo corredor): la herramienta lo detecta y ofrece migrar **todas juntas al mismo destino, o ninguna**.
- **Blueprints y ediciones de vía a medias (1.7)**: si la partida se guardó con una edición de vía sin cerrar (`trackEditSession`), la herramienta la **rechaza** — esa sesión guarda una copia de la vía sin migrar y, al cerrarla dentro del juego, restauraría vía del tipo antiguo sobre la línea ya migrada. Ciérrala o deshazla en el juego, vuelve a guardar y reintenta. Los **blueprints guardados** no se tocan: los que lleven vía del tipo que dejas atrás se listan en el plan, para que sepas cuáles reconstruir.
- **Si algo no se puede resolver** (un andén donde el tren no cabe, una curva imposible dentro de la correa de 15 m, una bretelle quad), se lista en el plan y el botón de migrar solo se desbloquea con una casilla de aceptación explícita. Con la casilla de «bajar coches», las composiciones que no quepan se reducen automáticamente a las que sí.
- **Varias líneas**: «Aplicar y migrar otra línea» encadena migraciones en memoria y escribe **un solo fichero** al final (p. ej. `sevilla-T1+T2-metro-ligero`).
- **Después de migrar**: construye un tramo de vía cualquiera (puedes borrarlo después) antes de asignar trenes — eso hace que el juego recalcule recorridos y tiempos, que hasta entonces siguen siendo los del tipo antiguo. La miniatura y la cámara se regeneran al primer guardado; si la partida original tenía timelapse, sus fotogramas no se conservan.

![Plan de migración / Migration plan](docs/migracion-plan.png)

**[EN]** The pack ships a tool that **actually migrates existing lines to another train type** — which the game's converter (the `ROUTE_TYPE_CONVERSION` flag) does not: it only relabels, and aborts if any platform is centimetres too short.

- **Where**: in the **main menu** ("Migrate lines" button), with no save loaded. The in-game toolbar panel is diagnosis only: per line and target it tells you whether the train physically fits and how many tracks violate the target's radius or gradient, plus a shortcut to turn on the game's converter flag.
- **What it does**: retypes the track and its full groups; brings **platforms to the target type's maximum** (only shortens those above it) by redistributing existing alignment — no invented geometry; **regenerates crossovers** with the game's exact generator, widening their window when the target radius needs it; conforms curves and gradients to the type's standard (including the real station rule: ≤ 0.1 m of level difference); **deletes the line's trains** and leaves it stopped; and writes a **new save** — never over the original.
- **Fleet**: by default the deleted trains' cars **stay owned**, as the game itself behaves (owned stock has no upkeep). Optionally they are refunded at purchase price.
- **Lines sharing track or stations**: detected; you migrate **all of them to the same target, or none**.
- **Blueprints and open track edits (1.7)**: a save written with an unfinished track edit session (`trackEditSession`) is **refused** — that session holds a copy of the un-migrated track and would restore old-type track over the migrated line when closed in game. Commit or undo it in game, save again, retry. **Saved blueprints** are left untouched: those holding track of the type you are leaving behind are listed in the plan so you know which to rebuild.
- **Anything unsolvable** is listed in the plan, and the migrate button only unlocks behind an explicit acceptance checkbox. The "shorten trains" option reduces consists that would not fit.
- **Several lines**: \u201cApply and migrate another line\u201d chains migrations in memory and writes **a single file** at the end (e.g. `sevilla-T1+T2-metro-ligero`).
- **After migrating**: build any piece of track (you may delete it afterwards) before assigning trains — that makes the game recompute routes and timings, which until then remain those of the old type. Thumbnail and camera regenerate on first save; timelapse frames are not kept.

## Fuentes / Sources

- [Norma MM-DT-0-01 'Geometría de Vía' — Metro de Madrid](https://www.alamys.org/wp-content/uploads/2021/04/Normativa-T%C3%A9cnica-B%C3%A1sica-de-V%C3%ADa-Metro-Madrid-2017.pdf) (radios mínimos 300/210 m, pendiente máxima 35 ‰, 110 km/h de diseño, pendiente nula en estaciones)
- [Proyectos de trazado ADIF/Mitma](https://cdn.mitma.gob.es/portal-web-drupal/estudio_ferrocarriles/astigarraga_lezo/memoriayanejos/07._trazado_y_superestructura_vf.pdf) (criterios de trazado en ancho ibérico. **Corrección respecto a versiones anteriores de este README:** las ETI fijan 150 m de radio mínimo en líneas nuevas y **no** establecen los 300 m de andén en curva que se les atribuía; además excluyen de su ámbito a metros y metros ligeros)
- [Serie 3000 — Wikipedia](https://es.wikipedia.org/wiki/Serie_3000) · [Vía Libre](https://vialibre-ffe.com/noticias.asp?not=509) (aceleración 1,0 m/s², composiciones de 59,94/89,38 m, 734 plazas)
- [Serie 8000 — Wikipedia](https://es.wikipedia.org/wiki/Serie_8000) · [Series 7000 y 9000 — Wikipedia](https://es.wikipedia.org/wiki/Series_7000_y_9000)
- [Serie 452 de Renfe — Wikipedia](https://es.wikipedia.org/wiki/Serie_452_de_Renfe) · [Geotren](https://www.geotren.es/blog/los-nuevos-trenes-de-cercanias-y-de-media-distancia-de-renfe/) · [Alstom](https://www.alstom.com/press-releases-news/2021/3/alstom-manufacture-152-high-capacity-xtrapolis-commuter-trains-spanish-operator-renfe) (140 km/h, 905 plazas/100 m, caja de 3,10 m)
- [Dossier Metros Ligeros de Madrid — Vía Libre](https://vialibre-ffe.com/pdf/madrid_dossier526.pdf) (Citadis 302 versión Madrid: 32,156 m × 2,40 m, 186 plazas, 750 V, 70 km/h)
- [Metro de Madrid — Trenvista](https://www.trenvista.net/encarrilando/la-gran-diversidad-del-metro-de-madrid/) (andenes de 60/90/115 m y gálibos)

## Costes y equilibrio de juego

Los costes de construcción y algunos parámetros de juego (tph, coste de estaciones y de vía) están equilibrados contra los tipos vanilla de Subway Builder, no son datos reales.

**El motor no admite curvas de coste por tipo.** Hasta la v0.10.0 tres de los cuatro tipos declaraban `elevationMultipliers` para que, por ejemplo, el túnel de gálibo estrecho costase menos que el de gran perfil. Subway Builder **no lee ese campo para calcular**: en la 1.6.0 la cadena aparecía dos veces en todo el binario y ambas eran el dato del tranvía vanilla; en la 1.7.0 aparece seis veces, pero tres de ellas son un panel de UI nuevo que se limita a **mostrar** el multiplicador del tipo, y el parámetro de tipo de tren de `getElevationMultiplier` sigue siendo vestigial en 1.7 (la función solo lee la tabla global). Los cuatro tipos cobran siempre la misma tabla global (`4,5 / 2 / 1 / 0,5 / 0,35 / 0,5 / 0,8` de bore profundo a viaducto), así que la única diferencia real de coste entre redes es su `baseTrackCost`. Los bloques se han retirado en la v0.12.0 para que el código no prometa lo que el juego no cumple.

### Mantenimiento a paridad vanilla (desde v0.10.0)

El motor define `MAINTENANCE_COST_MULTIPLIER = 2` **incrustado dentro de las definiciones de los tipos vanilla**, y no lo aplica a los tipos que registran los mods. Hasta la v0.9.4 este pack usaba los valores sin doblar, así que sus cuatro redes costaban entre el 44 % y el 67 % de mantener que su equivalente del juego base — y la estación de Cercanías, un 15,6 %, pese a costar 63,75 M€ construirla. Desde la v0.10.0 van ya a la par:

| Tipo | Vía €/m | Estación €/año | Referencia vanilla |
|---|---|---|---|
| `madrid-metro-estrecho` | 320 | 280.000 | `heavy-metro` (360 / 320.000), algo por debajo por el gálibo reducido |
| `madrid-metro-ancho` | 360 | 320.000 | `heavy-metro`, paridad exacta |
| `madrid-metro-ligero` | 280 | 200.000 | `light-rail` (280 / 200.000), paridad exacta desde la v0.13.0 |
| `renfe-cercanias` | 300 | 320.000 | `commuter-rail`, paridad exacta |

## Peralte y velocidad en curva (1.7.0)

La 1.7 añadió un modelo de peralte para la velocidad en curva. **No sustituye al anterior: convive con él.** El juego elige uno de tres modelos por vía (`getSpeedForSegment`):

| Modelo | Cuándo | Fórmula |
|---|---|---|
| `legacy` | vía **sin** `cantEnabled`, o sea todo lo construido antes de la 1.7 | `sqrt(maxLateralAcceleration × radio)`, por un factor de longitud de tren `max(0,5; 1 − longitud/200)` y ×0,5 en estación |
| `staticCant` | vía con `cantEnabled` y el flag `CANT_MECHANICS` **apagado** — el caso por defecto | un peralte plano por segmento con la fórmula de abajo |
| `cant` | vía con `cantEnabled` y `CANT_MECHANICS` encendido | perfil de peralte completo, con rampas de transición y topes de zona de parada |

La fórmula de peralte es:

```
v = sqrt((peralte + insuficiencia) / 150 × radio)      1 m/s² ≡ 150 mm
```

Las cotas por vehículo viven en `stats.maxCantMm` y `stats.maxCantDeficiencyMm`. Un tipo que no las declare no se queda sin peralte: el motor respalda **cada una por su lado**. El peralte cae en `CANT_MAX_APPLIED_MM = 150 mm` y la insuficiencia en `maxLateralAcceleration × 150` (`getCantDeficiencyMm`, en el bundle del renderer). Para los cuatro tipos del pack eso sumaba 300 mm en vía corriente — **2,00 m/s² efectivos**, 1,90 en el Metro Ligero por su 0,9 de aceleración lateral —, por encima de cualquier tipo vanilla salvo Cercanías. Desde la v0.13.0 los cuatro los declaran:

| Tipo | `maxCantMm` | `maxCantDeficiencyMm` | m/s² efectivos en vía corriente | Procedencia |
|---|---|---|---|---|
| `madrid-metro-estrecho` | 120 | 100 | 1,47 | **Criterio propio.** Peralte de metro urbano, coherente con las curvas históricas de 90 m de L1-L5 |
| `madrid-metro-ancho` | 150 | 110 | 1,73 | **Paridad de juego** con `heavy-metro` |
| `madrid-metro-ligero` | 100 | 115 | 1,43 | **Paridad de juego** con `light-rail` |
| `renfe-cercanias` | 160 | 150 | 2,07 | 160 mm es el máximo de ADIF en ancho ibérico con tráfico mixto (los 180 del `commuter-rail` vanilla son el tope ETI, solo viable donde se garantiza que ningún tren para en curva); 150 mm de insuficiencia es el equivalente en milímetros del 1,0 m/s² excepcional ETI que ya usaba el pack |

**Ninguna de estas cifras sale de MM-DT-0-01**, que no publica valores de peralte: las dos primeras son criterio propio y paridad, no dato corporativo. La columna de m/s² efectivos es la de **vía corriente**: en andén el peralte aplicado es 0 y queda solo la insuficiencia, o sea 0,67 m/s² en el estrecho y 0,77 en el ML.

Dos topes del motor conviene tenerlos presentes al trazar: `CANT_STATION_MAX_MM` y `CANT_STREET_RUNNING_MAX_MM` valen **0**. En vía de estación el andén tiene que quedar a nivel —lo mismo que exige la norma real— y la vía embutida en calzada va plana, así que ahí la curva se sostiene **solo con la insuficiencia**. Una curva **sostenida** en estación da `sqrt(insuficiencia / 150 × radio)`: 51 km/h para el estrecho en sus 300 m de radio mínimo de andén, 24 km/h para el Metro Ligero en los 60 m del suyo. Digo sostenida porque el radio que entra en el modelo no es el geométrico local: `calculateCantTrackRadii` lo promedia en una ventana de `CANT_RADIUS_WINDOW_M = 30` m —o `analyticTrackRadii`, si la vía guarda `curveGeometry`— y después lo suelta en `max(radio, minTurnRadius)`. Vale igual para `cant` y para `staticCant`; el modelo `legacy` es el único que va por otro camino (`calculateSmoothedTrackRadii`, que además sí lee el `curveType` de la vía). Una curva corta metida entre tramos más rectos sale con radio efectivo mayor, y por tanto **más rápida** que esas cifras; tómalas como el suelo del caso continuo, no como lectura garantizada.

Con `CANT_MECHANICS` encendido —y solo entonces, porque `applyCantProfile` no corre en `staticCant`— hay un tope más: el peralte aplicado se limita a `min(peralte, CANT_MAX_STOPPED_MM = 150)` en los `CANT_STOP_ZONE_LENGTH_M = 200` m de aproximación a una parada o bifurcación, de modo que los 160 mm de Cercanías se quedan en 150 en esos tramos. Los pasos a nivel fuerzan peralte 0 en su vértice, y el peralte sube y baja con rampa limitada (`CANT_RAMP_MM_PER_S = 45`), así que entrar en curva desde vía plana cuesta metros.

⚠️ **`maxLateralAcceleration` sigue muy vivo, y esto es fácil de leer al revés.** Gobierna el modelo `legacy`, que es el que se aplica a **toda la vía de cualquier partida anterior a la 1.7** — es decir, hoy, a casi toda la red de casi todo el mundo. Los valores de peralte solo entran en vía nueva. Además sigue siendo el respaldo de la insuficiencia cuando un tipo no declara `maxCantDeficiencyMm`. Por eso los cuatro tipos lo conservan con su justificación ETI/ADIF: no es un campo decorativo como `elevationMultipliers`.

Nota sobre el flag: `CANT_MECHANICS` es una opción experimental con `defaultEnabled: false`, así que salvo que la actives a mano, la vía nueva usa `staticCant` — mismos números de peralte, pero un valor plano por segmento en vez del perfil con rampas.

⚠️ El modelo solo se aplica a **vía construida a partir de la 1.7** (`Track.cantEnabled`). Las líneas que ya tengas mantienen sus velocidades.

⚠️ **Si vienes de la v0.12.0 con una partida en curso**, el Metro Ligero pasa de la referencia `tram` a `light-rail`: la vía sube de 240 a 280 €/m (×1,17) y la estación de 50.000 a 200.000 €/año (×4). Una línea de 12 estaciones y 15 km pasa de 4,80 a 6,60 M€/año. Además deja de admitir circulación en tráfico mixto (ver abajo).

⚠️ **Si vienes de la v0.9.4 con una partida en curso**, el mantenimiento sube ×2 en las cuatro redes. En Cercanías la estación sube ×6,4 (50.000 → 320.000), aunque el total de una línea realista queda en el mismo orden que el resto: 12 estaciones y 25 km pasan de 5,60 a 11,34 M€/año (×2,02), porque la vía domina el gasto.

## Aviso importante / Important warning

**[ES]** Si construyes líneas con estos tipos y después desactivas o desinstalas el mod, **esa partida deja de cargar**. Desde la 1.7 esto alcanza también a los **blueprints guardados**: un blueprint es una copia de vía con su tipo dentro, así que los que hayas guardado con vía de este pack quedan igual de huérfanos. El juego resuelve el tipo de tren por id y no tiene reserva para uno desconocido: la carga aborta a medias con «Error loading save». No hay reparación posible desde el juego. Antes de quitar el mod, pasa esas líneas a un tipo del juego base con el conversor del propio juego (flag `ROUTE_TYPE_CONVERSION`; el panel del pack trae un atajo para encenderlo) o guarda una copia.

**[EN]** If you build lines with these types and later disable or uninstall the mod, **that save will no longer load**. As of 1.7 this extends to **saved blueprints** too: a blueprint stores track with its type inside, so any you saved with this pack's track is orphaned the same way. Train types resolve by id and there is no fallback for an unknown one: the load aborts halfway with "Error loading save", and the game offers no repair path. Move those lines to a built-in type with the game's own converter (the `ROUTE_TYPE_CONVERSION` flag; the pack's panel has a shortcut to enable it), or keep a backup, before removing the mod.

## Créditos / Credits

- Las stats del tipo Cercanías parten del modelo "Series 452" del pack [danTrains](https://github.com/DanielD1909/danTrains) de **DanielD1909** (MIT), verificadas y ajustadas después contra las fuentes reales de arriba.

## Licencia

MIT — ver [LICENSE](LICENSE).
