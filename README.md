# Madrid Transit Pack

**[EN]** Four standardized Madrid train types for Subway Builder, one per real network — narrow-profile Metro, wide-profile Metro, Metro Ligero and Cercanías — with real-world specs (speeds, gradients, curve radii, platform lengths) taken from official technical documentation. One type per *network* instead of per-model means branches and track sharing between lines of the same network just work.

**[ES]** Cuatro tipos de tren estandarizados de Madrid para Subway Builder, uno por red real. Al estandarizar por red en lugar de por modelo, los ramales y las vías compartidas entre líneas de la misma red funcionan sin conflictos de compatibilidad.

## Tipos incluidos / Included types

| ID | Red | Material de referencia | Velocidad | Composición | Pendiente máx. | Radio mín. |
|---|---|---|---|---|---|---|
| `madrid-metro-estrecho` | Metro L1-L5 + Ramal | CAF Serie 3000 | 80 km/h | 4-6 coches de 14,9 m (59,94-89,38 m) | 3,5 % | 90 m (histórico)¹ |
| `madrid-metro-ancho` | Metro L6-L12 | Series 8000/9000 | 110 km/h | 3-6 coches de ~18 m (andenes hasta 115 m) | 3,5 % | 300 m |
| `madrid-metro-ligero` | ML1-ML3 | Alstom Citadis 302 | 70 km/h | 1-2 unidades de 32,5 m | 6,5 % | 25 m |
| `renfe-cercanias` | Cercanías Madrid | Renfe S/452 (Alstom X'Trapolis) | 140 km/h | 1-2 unidades de 6 coches (100/200 m) | 3,5 % | 250 m² |

¹ La norma moderna de Metro (MM-DT-0-01) exige 300 m en líneas nuevas y 210 m en ampliaciones; el tipo estrecho conserva los ~90 m de las curvas históricas de L1-L5 para poder trazar por el casco antiguo. Los andenes de todas las redes exigen curvas de radio ≥ 300 m (límite de las ETI usado en proyectos de ADIF).
² Criterio de proyecto en red convencional (sin cifra única oficial publicada).

**Procedencia de los datos** — reales y citados: dimensiones, velocidades, capacidades y composiciones del material; pendiente máxima 3,5 % y radios 210/300 m (norma MM-DT-0-01 de Metro de Madrid); andenes ≥ 300 m (ETI, vía proyectos ADIF/Mitma); entrevía convencional 3,808 m. Equilibrio de juego (no reales): costes, mantenimientos, tph, radio de estación del Metro Ligero y radio de vía de Cercanías (250 m, criterio).

Detalles con sabor real: el perfil estrecho tiene túneles más baratos (gálibo de 6,86 m), el Metro Ligero puede circular por la calle y cruzar a nivel, la S/452 conserva su caja de 3,10 m (16 cm más ancha que un Civia) y ~905 plazas por unidad de 100 m, con 2 coches de dos pisos.

## Instalación / Install

Copia la carpeta `madrid-transit-pack` en el directorio de mods de Subway Builder y actívalo en ajustes:

- **macOS**: `~/Library/Application Support/metro-maker4/mods/`
- **Windows**: `%APPDATA%/metro-maker4/mods/`

## Fuentes / Sources

- [Norma MM-DT-0-01 'Geometría de Vía' — Metro de Madrid](https://www.alamys.org/wp-content/uploads/2021/04/Normativa-T%C3%A9cnica-B%C3%A1sica-de-V%C3%ADa-Metro-Madrid-2017.pdf) (radios mínimos 300/210 m, pendiente máxima 35 ‰, 110 km/h de diseño, pendiente nula en estaciones)
- [Proyectos de trazado ADIF/Mitma](https://cdn.mitma.gob.es/portal-web-drupal/estudio_ferrocarriles/astigarraga_lezo/memoriayanejos/07._trazado_y_superestructura_vf.pdf) (andenes en curva: radio mínimo 300 m según las ETI)
- [Serie 3000 — Wikipedia](https://es.wikipedia.org/wiki/Serie_3000) · [Vía Libre](https://vialibre-ffe.com/noticias.asp?not=509) (aceleración 1,0 m/s², composiciones de 59,94/89,38 m, 734 plazas)
- [Serie 8000 — Wikipedia](https://es.wikipedia.org/wiki/Serie_8000) · [Series 7000 y 9000 — Wikipedia](https://es.wikipedia.org/wiki/Series_7000_y_9000)
- [Serie 452 de Renfe — Wikipedia](https://es.wikipedia.org/wiki/Serie_452_de_Renfe) · [Geotren](https://www.geotren.es/blog/los-nuevos-trenes-de-cercanias-y-de-media-distancia-de-renfe/) · [Alstom](https://www.alstom.com/press-releases-news/2021/3/alstom-manufacture-152-high-capacity-xtrapolis-commuter-trains-spanish-operator-renfe) (140 km/h, 905 plazas/100 m, caja de 3,10 m)
- [Alstom Citadis — Wikipedia](https://es.wikipedia.org/wiki/Alstom_Citadis) · [Trainspo](https://trainspo.com/model/2607/) (32,5 m × 2,65 m, 70 km/h)
- [Metro de Madrid — Trenvista](https://www.trenvista.net/encarrilando/la-gran-diversidad-del-metro-de-madrid/) (andenes de 60/90/115 m y gálibos)

Los costes y algunos parámetros de juego (mantenimiento, tph, coste de estaciones) están equilibrados contra los tipos vanilla de Subway Builder, no son datos reales.

## Créditos / Credits

- Las stats del tipo Cercanías parten del modelo "Series 452" del pack [danTrains](https://github.com/DanielD1909/danTrains) de **DanielD1909** (MIT), verificadas y ajustadas después contra las fuentes reales de arriba.

## Licencia

MIT — ver [LICENSE](LICENSE).
