(function () {
	const api = window.SubwayBuilderAPI;
	const TAG = "[madrid-transit-pack]";

	// Unidades del juego: velocidades en m/s, aceleraciones en m/s², longitudes en metros.
	// 22.22 m/s = 80 km/h · 19.44 = 70 km/h · 30.55 = 110 km/h · 38.89 = 140 km/h
	//
	// Datos reales (v0.10.0):
	// - Norma MM-DT-0-01 'Geometría de Vía' de Metro de Madrid (feb 2004, vía alamys.org):
	//   radio mínimo 300 m en líneas nuevas / 210 m en ampliaciones (las curvas históricas
	//   de L1-L5 bajan a ~90 m), 35 milésimas (3,5%) de pendiente DE PROYECTO, velocidad
	//   de diseño 110 km/h en líneas nuevas, pendiente nula en estaciones.
	// - Pendientes REALES de la red, por encima del criterio de proyecto. En el juego
	//   maxSlopePercentage es un permiso de construcción, así que va el techo real de la
	//   red y no el de proyecto: con 3,5% no se podría reconstruir ni el Ramal ni L7.
	//   · Gálibo estrecho: Ramal Ópera-Príncipe Pío a 52,06 y 51,05 milésimas (5,2%) en
	//     servicio comercial, servido por la misma Serie 3000 que modela el tipo.
	//   · Gran perfil: 4% calificado de "excepcional" en la prolongación de L7 a Pitis
	//     (paso bajo la M-30), en la conexión L8-L10 y en L9 Pavones-Puerta de Arganda.
	//   Ambos de memorias de proyecto sin enlace público localizado (ver README).
	// - Radio del gran perfil: 250 m excepcional en la conexión L8-L10. La memoria lo
	//   concede para "material tipo 5000", no explícitamente para 8000/9000.
	// - Entrevía convencional ibérica: 3,808 m (Instrucción Técnica del Gálibo, 1985).
	//   Entrevía del metro: no publicada; derivada del gálibo oficial de túnel
	//   (estrecho 6,86 m -> ~3,30 m; ancho 7,74 m -> ~3,60 m).
	// - Aceleración lateral: ETI/ADIF dan 0,65 m/s² normal y 1,0 m/s² excepcional de
	//   insuficiencia de peralte. Metros y metros ligeros quedan FUERA del ámbito de las
	//   ETI: el radio de estación de 300 m sale del radio de diseño de MM-DT-0-01, no
	//   de las ETI como decían las versiones anteriores.
	// - S/3000: aceleración 1,0 m/s², 80 km/h, 6 coches = 89,38 m, 734 plazas (Vía Libre / Wikipedia)
	// - S/8000-9000: 110 km/h de servicio (120 de fábrica). En la 8000, 6 coches miden
	//   ~108,8 m con ~1.270 plazas -> ~18,1 m y ~211 plazas por coche (Vía Libre).
	// - Citadis 302 de ML Madrid: 32,156 m, 2,40 m, 186 plazas (54 sentados), 70 km/h,
	//   750 V, radio mínimo 25 m (dossier Vía Libre / Alstom)
	// - S/452 (Alstom X'Trapolis): 140 km/h, caja de 3,10 m, 905-927 plazas por unidad
	//   de 100 m (6 coches, 2 de dos pisos), trenes de 100 o 200 m (Wikipedia/Geotren).
	//   OJO: es la 452, NO la 450 (759 plazas, 106-159 m). carLength y capacityPerCar
	//   de este tipo son promedios (100/6 y 906/6), no longitudes ni plazas por coche.
	// - Mantenimiento: el motor define MAINTENANCE_COST_MULTIPLIER = 2 incrustado en las
	//   definiciones vanilla y NO lo aplica a los tipos de mod. Los valores de aquí van
	//   ya doblados para quedar a la par de los tipos del juego base.
	// - NO añadir elevationMultipliers: el motor NO lee ese campo. La cadena aparece dos
	//   veces en todo el app.asar de la 1.6.0 y ambas son el dato del tram vanilla; los
	//   diez call sites de getElevationMultiplier pasan un solo argumento y el parámetro
	//   de tipo de tren es vestigial. Los cuatro tipos cobran la tabla global de
	//   RULES.CONSTRUCTION_COSTS.ELEVATION_MULTIPLIERS: 4,5 / 2 / 1 / 0,5 / 0,35 / 0,5 / 0,8.
	//   La única palanca real es modifyConstants, que es global y afectaría a los vanilla.

	// -------------------------------------------------------------------------
	// i18n
	//
	// api.utils.i18n.create con dos trampas verificadas en el bundle:
	//  · el lookup es PLANO, así que las claves anidadas no funcionan: t('a.b')
	//    devolvería la cadena "a.b" literal. Aquí 'mig.titulo' es una clave plana,
	//    no una ruta.
	//  · un jugador con el SO en español que no haya tocado el selector tiene
	//    instance.language === 'es-ES', que no casa con 'es'. Se duplica.
	// -------------------------------------------------------------------------
	const STRINGS_ES = {
		"type.estrecho.name": "Metro Madrid (perfil estrecho)",
		"type.ancho.name": "Metro Madrid (gran perfil)",
		"type.ligero.name": "Metro Ligero",
		"type.cercanias.name": "Cercanías Madrid",
		"type.estrecho.desc": "Red de gálibo estrecho de Metro de Madrid (L1-L5 y Ramal). Basado en la Serie 3000 de CAF: caja de 2,30 m, coches de 14,9 m en composiciones de 4 o 6 (59,6-89,4 m en juego; el tren real mide 59,94-89,38 m) para andenes de 60-94 m (los reales son de 60 y 90 m; nota: el preview de construcción muestra la capacidad con un margen de 4 m que la estación construida no aplica, así que un andén de 90 m opera con 6 coches aunque el preview diga 4). Curvas históricas de hasta 90 m de radio (la norma moderna MM-DT-0-01 exige 210-300 m en trazado nuevo) y pendiente de hasta 5,2%: la del Ramal Ópera-Príncipe Pío (52,06 milésimas) en servicio comercial, muy por encima del 3,5% de criterio de proyecto. Túneles más baratos por el gálibo reducido (6,86 m). Los ramales entre líneas de esta red son totalmente compatibles.",
		"type.ancho.desc": "Red de gran perfil de Metro de Madrid (L6-L12). Basado sobre todo en la Serie 8000, con la que cuadran los 18,15 m y las ~200 plazas por coche (la 9000 de AnsaldoBreda tiene cotas algo distintas): caja de 2,80 m, coches de 18,15 m en composiciones de 3 o 6 para andenes de hasta 115 m como los de la L10. Red moderna: 110 km/h de velocidad de servicio (120 de fábrica) y radio de proyecto de 300 m según MM-DT-0-01, pero el tipo permite el radio de 250 m y la pendiente del 4% que la red usa de verdad como excepción (conexión L8-L10, prolongación de L7 a Pitis bajo la M-30, L9 Pavones-Puerta de Arganda).",
		"type.ligero.desc": "Metro Ligero de Madrid (ML1-ML3). Basado en el Alstom Citadis 302: unidades articuladas de 32,16 m y 2,40 m de ancho (más estrechas que el Citadis estándar para el gálibo madrileño), 186 plazas por unidad, en simple o doble composición, 70 km/h y 750 V. Radio mínimo de 25 m, muy por debajo de los 90 m de las curvas más cerradas del metro, y rampas de hasta 6,5% (estimación: los Citadis admiten del 6 al 8%, pero no hay cifra oficial publicada de ML1-ML3). Puede circular en superficie compartiendo calle y cruzar a nivel.",
		"type.cercanias.desc": "Red de Cercanías de Madrid. Basado en la Serie 452 real de Renfe (Alstom X'Trapolis, entregas 2025-2026): unidades de 6 coches y 100 m con 2 coches centrales de dos pisos, ~905 plazas por unidad, caja de 3,10 m y 140 km/h. Trenes de 100 o 200 m (1 o 2 unidades); los 16,67 m y las 151 plazas por coche son promedios de la unidad, no cotas reales de coche. Pendiente máxima 3,5%, radio de vía de 250 m y andenes en curva de radio >= 300 m —ambos criterio propio: el mínimo ETI de líneas nuevas es 150 m y no hay regla publicada de 300 m para andenes— y entrevía convencional de 3,808 m. Admite pasos a nivel. Toda la red de Cercanías es interoperable entre sí.",
		"mig.menuButton": "Migrar líneas a tipos de Madrid",
		"mig.title": "Migración de líneas",
		"mig.intro": "Lleva una línea existente a uno de los tipos de este pack: reetiqueta la vía, ajusta los andenes, adapta las curvas y pendientes que incumplan la norma del tipo, y deja la línea parada para que la vuelvas a poner en servicio.",
		"mig.pickSave": "Elegir un fichero…",
		"mig.yourSaves": "Tus partidas",
		"mig.noSaves": "No se ha encontrado ninguna partida.",
		"mig.loadingList": "Buscando partidas…",
		"mig.orFile": "o abrir un .metro de otro sitio",
		"mig.reading": "Leyendo la partida…",
		"mig.route": "Línea",
		"mig.target": "Tipo destino",
		"mig.choose": "— elige —",
		"mig.extend": "Alargar los andenes al máximo del tipo",
		"mig.fleet": "Coches de los trenes borrados",
		"mig.fleetKeep": "Dejarlos en propiedad (como hace el juego)",
		"mig.fleetRefund": "Reembolsar a precio de compra",
		"mig.kept": "coches conservados:",
		"mig.refunded": "reembolsados",
		"mig.cars": "coches",
		"mig.plan": "Calcular el plan",
		"mig.apply": "Migrar y guardar en mis partidas",
		"mig.applyFile": "Guardar como fichero suelto…",
		"mig.suffix": "migrada",
		"mig.savedTo": "Guardada como",
		"mig.trains": "trenes",
		"reason.vertexStuck": "el vértice {v} (radio {r} m) no cumple ni moviéndolo ni quitándolo dentro de la correa de {l} m",
		"reason.stillBelow": "quedan {n} terna(s) por debajo del radio tras relajar y quitar vértices",
		"reason.slopeImpossible": "el desnivel total ({d} m en {L} m) ya supera el {m}% por sí solo",
		"reason.slopeBetweenFixed": "la pendiente excesiva está entre dos extremos fijos",
		"reason.stillSteep": "el reparto de cotas no converge sin mover nodos clavados",
		"reason.endTangent": "cumplir el radio giraría la entrada del empalme {n}°: se deja como está y se avisa",
		"reason.noCenterLine": "la estación no tiene grupo con centerLine",
		"reason.noRails": "el grupo no tiene vías",
		"reason.badTopology": "topología inesperada: {o} extremos exteriores para {c} carriles",
		"mig.cars": "coches",
		"mig.cancel": "Cancelar",
		"mig.close": "Cerrar",
		"mig.back": "Volver",
		"mig.planTitle": "Esto es lo que va a pasar",
		"mig.platforms": "Andenes",
		"mig.geometry": "Geometría",
		"mig.service": "Servicio",
		"mig.changes": "Cambios en el fichero",
		"mig.blocked": "El juego rechazaría la conversión en estas estaciones",
		"mig.lines": "Líneas",
		"mig.sharedTitle": "Estas líneas comparten infraestructura",
		"mig.sharedNote": "Migrar solo una dejaría a las demás circulando sobre vías y andenes de otro tipo. O se migran todas al mismo destino, o ninguna.",
		"mig.migrateAll": "Planificar la migración conjunta de las {n} líneas",
		"mig.acceptRisks": "Migrar aunque queden {n} problemas",
		"mig.applyNext": "Aplicar y migrar otra línea",
		"mig.appliedSoFar": "Migradas sin guardar:",
		"mig.appliedOk": "Línea aplicada en memoria. Elige otra línea o guarda la partida.",
		"mig.reduceCars": "Si una composición no cabe en sus andenes, bajarla automáticamente",
		"mig.reduced": "Composición reducida",
		"mig.slopeFailed": "Pendientes sin resolver",
		"mig.crossFailed": "Bretelles fuera del radio del destino",
		"mig.crossQuad": "bretelles quad sin regenerar",
		"mig.widened": "bretelles ensanchadas para el radio del destino",
		"panel.intro": "El conversor del juego solo reetiqueta la línea: no toca andenes, ni geometría, ni trenes, y al fallar solo nombra una estación. Elige aquí un destino y este panel te dice antes qué pasaría. La migración completa (andenes, geometría, trenes, flota) vive en el menú de inicio, con la partida sin cargar.",
		"panel.flagReq": "Requiere el flag",
		"panel.flagActive": "activo",
		"panel.flagOff": "apagado — el botón de arriba lo enciende; funciona también en la build estable (el menú Beta Features solo está oculto, el flag no)",
		"panel.flagUnknown": "estado desconocido",
		"panel.noRoutes": "No hay líneas en esta partida.",
		"panel.stateErr": "No se pudo leer el estado de la partida: ",
		"panel.convertTo": "Convertir a",
		"panel.choose": "— elige un tipo —",
		"panel.est": "est.",
		"panel.shortest": "andén más corto",
		"panel.limit": "Al límite: la diferencia con el umbral es menor que el margen de este cálculo (±15 cm).",
		"panel.fits": "El juego lo aceptaría con {n} coches.",
		"panel.fitsShort": "Pero el tren NO cabe físicamente: {m} m de tren en «{s}» ({l} m). El juego lo permite igual; la herramienta del menú puede alargar el andén.",
		"panel.noFit": "No cabe con {n} coches: «{s}» admite {a}.",
		"panel.rescue": "Bajando la línea a {n} coches antes de convertir, pasaría.",
		"panel.noFitNone": "No cabe: «{s}» admite {a} y no hay composición válida por debajo.",
		"panel.geom": "Norma del destino: {r} vía(s) incumplen el radio y {p} la pendiente. El conversor del juego NO las corrige; la herramienta del menú sí.",
		"panel.geomOk": "Radios y pendientes de toda la línea cumplen la norma del destino.",
		"panel.cost": "Coste:",
		"panel.noMoney": "no te llega",
		"panel.budget": "Presupuesto:",
		"panel.footer": "La conversión del juego no toca los trenes ya generados ni el material comprado: borra los trenes de la línea antes de convertir y compra material del tipo nuevo después. La migración completa está en el menú de inicio.",
		"mig.headNote": "La miniatura y la cámara se regeneran al guardar dentro del juego; si la original tenía timelapse, sus fotogramas no se conservan.",
		"mig.autosave": "autoguardado",
		"mig.oldSave": "Partida con esquema v{v}: la migración necesita v3. Ábrela y guárdala una vez dentro del juego para actualizarla.",
		"mig.tooShort": "El tren no cabe físicamente en estos andenes",
		"mig.failed": "No se han podido resolver",
		"mig.saved": "Partida migrada y guardada.",
		"mig.after": "Después de migrar",
		"mig.rebuildHint": "Los tiempos de recorrido de la línea siguen siendo los del tipo antiguo hasta que el juego los recalcule: construye cualquier tramo de vía (luego puedes borrarlo) antes de asignarle trenes.",
		"mig.noElectron": "Esto solo funciona en la versión de escritorio.",
		"mig.flagOn": "Activar la conversión rápida del juego",
		"mig.flagIsOn": "La conversión rápida del juego está activa.",
		"mig.flagRestart": "Activada. Reinicia el juego para que surta efecto.",
		"mig.flagWhat": "Función experimental del juego, apagada de fábrica y sin acceso desde los menús en la versión estable. Solo reetiqueta: no toca andenes, ni geometría, ni trenes."
	};
	const STRINGS_EN = {
		"type.estrecho.name": "Madrid Metro (narrow profile)",
		"type.ancho.name": "Madrid Metro (wide profile)",
		"type.ligero.name": "Metro Ligero (light rail)",
		"type.cercanias.name": "Cercanías Madrid (commuter rail)",
		"type.estrecho.desc": "The narrow-profile network of the Madrid Metro (L1-L5 and the Ramal). Based on CAF's Serie 3000: a 2.30 m body and 14.9 m cars in 4- or 6-car sets (59.6-89.4 m in game; the real train is 59.94-89.38 m) for 60-94 m platforms — the real ones are 60 and 90 m. Note that the construction preview applies a 4 m margin the built station does not, so a 90 m platform runs 6 cars even though the preview says 4. Historic curves down to 90 m radius, well below the 210-300 m the modern MM-DT-0-01 standard requires for new alignments, and gradients up to 5.2%: the Ópera-Príncipe Pío Ramal runs 52.06 per mille in commercial service, far above the 3.5% design criterion. Cheaper per metre than the wide profile thanks to the reduced 6.86 m tunnel gauge. Branches between lines of this network are fully compatible.",
		"type.ancho.desc": "The wide-profile network of the Madrid Metro (L6-L12). Modelled mainly on the Serie 8000, which is what the 18.15 m cars and ~200 seats match — the AnsaldoBreda 9000 has slightly different dimensions: a 2.80 m body and 18.15 m cars in 3- or 6-car sets for platforms up to 115 m, like those on L10. A modern network: 110 km/h in service (120 as built) and a 300 m design radius per MM-DT-0-01, but the type allows the 250 m radius and the 4% gradient the network actually uses as exceptions — the L8-L10 link, the L7 extension to Pitis under the M-30, and L9 between Pavones and Puerta de Arganda.",
		"type.ligero.desc": "Madrid's Metro Ligero (ML1-ML3). Based on the Alstom Citadis 302: articulated 32.16 m units, 2.40 m wide — narrower than the standard Citadis, for the Madrid loading gauge — seating 186, running singly or in pairs at 70 km/h on 750 V. A 25 m minimum radius, far tighter than the 90 m of the sharpest metro curves, and gradients up to 6.5% (an estimate: Citadis units handle 6 to 8%, but no official figure is published for ML1-ML3). Can run on the surface sharing the street and cross at grade.",
		"type.cercanias.desc": "Madrid's Cercanías commuter network. Based on Renfe's real Serie 452 (Alstom X'Trapolis, delivered 2025-2026): 6-car, 100 m units with two double-deck centre cars, ~905 seats per unit, a 3.10 m body and 140 km/h. Trains of 100 or 200 m, one or two units; the 16.67 m and 151 seats per car are unit averages, not real per-car figures. Maximum gradient 3.5%, 250 m track radius and platforms on curves of 300 m or more — both house rules: the TSI minimum for new lines is 150 m and there is no published 300 m platform rule. Conventional Iberian track spacing of 3.808 m. Level crossings allowed. The whole Cercanías network is interoperable with itself.",
		"mig.menuButton": "Migrate lines to Madrid types",
		"mig.title": "Line migration",
		"mig.intro": "Moves an existing line onto one of this pack's types: retypes the track, resizes platforms, brings curves and gradients up to the type's standard, and leaves the line stopped so you can put it back into service.",
		"mig.pickSave": "Choose a file…",
		"mig.yourSaves": "Your saves",
		"mig.noSaves": "No saves found.",
		"mig.loadingList": "Looking for saves…",
		"mig.orFile": "or open a .metro from somewhere else",
		"mig.reading": "Reading the save…",
		"mig.route": "Line",
		"mig.target": "Target type",
		"mig.choose": "— choose —",
		"mig.extend": "Extend platforms to the type's maximum",
		"mig.fleet": "Cars of the deleted trains",
		"mig.fleetKeep": "Keep them owned (as the game does)",
		"mig.fleetRefund": "Refund at purchase price",
		"mig.kept": "cars kept:",
		"mig.refunded": "refunded",
		"mig.cars": "cars",
		"mig.plan": "Work out the plan",
		"mig.apply": "Migrate and save to my saves",
		"mig.applyFile": "Save as a separate file…",
		"mig.suffix": "migrated",
		"mig.savedTo": "Saved as",
		"mig.trains": "trains",
		"reason.vertexStuck": "vertex {v} (radius {r} m) fits neither by moving nor by removing it within the {l} m leash",
		"reason.stillBelow": "{n} triple(s) still under the radius after relaxing and removing vertices",
		"reason.slopeImpossible": "the total drop ({d} m over {L} m) already exceeds {m}% on its own",
		"reason.slopeBetweenFixed": "the excessive gradient sits between two fixed ends",
		"reason.stillSteep": "the elevation redistribution cannot converge without moving pinned nodes",
		"reason.endTangent": "meeting the radius would rotate the joint entry by {n}°: left as is, flagged instead",
		"reason.noCenterLine": "the station has no group with a centerLine",
		"reason.noRails": "the group has no tracks",
		"reason.badTopology": "unexpected topology: {o} outer ends for {c} rails",
		"mig.cars": "cars",
		"mig.cancel": "Cancel",
		"mig.close": "Close",
		"mig.back": "Back",
		"mig.planTitle": "Here is what will happen",
		"mig.platforms": "Platforms",
		"mig.geometry": "Geometry",
		"mig.service": "Service",
		"mig.changes": "Changes to the file",
		"mig.blocked": "The game would refuse the conversion at these stations",
		"mig.lines": "Lines",
		"mig.sharedTitle": "These lines share infrastructure",
		"mig.sharedNote": "Migrating only one would leave the others running on tracks and platforms of a different type. Either all of them migrate to the same target, or none.",
		"mig.migrateAll": "Plan the joint migration of all {n} lines",
		"mig.acceptRisks": "Migrate even though {n} problems remain",
		"mig.applyNext": "Apply and migrate another line",
		"mig.appliedSoFar": "Migrated, not saved yet:",
		"mig.appliedOk": "Line applied in memory. Pick another line or save the game.",
		"mig.reduceCars": "If a train does not fit its platforms, shorten it automatically",
		"mig.reduced": "Consist reduced",
		"mig.slopeFailed": "Unresolved slopes",
		"mig.crossFailed": "Crossovers below the target radius",
		"mig.crossQuad": "quad crossovers not regenerated",
		"mig.widened": "crossovers widened for the target radius",
		"panel.intro": "The game's converter only relabels the line: platforms, geometry and trains stay untouched, and on failure it just names one station. Pick a target here and this panel tells you beforehand what would happen. The full migration (platforms, geometry, trains, fleet) lives in the main menu, with no save loaded.",
		"panel.flagReq": "Requires the flag",
		"panel.flagActive": "on",
		"panel.flagOff": "off — the button above turns it on; it works on the stable build too (the Beta Features menu is hidden, the flag is not)",
		"panel.flagUnknown": "state unknown",
		"panel.noRoutes": "There are no lines in this game.",
		"panel.stateErr": "Could not read the game state: ",
		"panel.convertTo": "Convert to",
		"panel.choose": "— pick a type —",
		"panel.est": "sta.",
		"panel.shortest": "shortest platform",
		"panel.limit": "Borderline: the gap to the threshold is smaller than this estimate\u2019s margin (±15 cm).",
		"panel.fits": "The game would accept it with {n} cars.",
		"panel.fitsShort": "But the train does not physically fit: {m} m of train at \u201c{s}\u201d ({l} m). The game allows it anyway; the menu tool can extend the platform.",
		"panel.noFit": "Does not fit with {n} cars: \u201c{s}\u201d takes {a}.",
		"panel.rescue": "Lowering the line to {n} cars before converting would pass.",
		"panel.noFitNone": "Does not fit: \u201c{s}\u201d takes {a} and no valid consist fits below.",
		"panel.geom": "Target standard: {r} track(s) violate the radius and {p} the gradient. The game\u2019s converter does NOT fix them; the menu tool does.",
		"panel.geomOk": "Radii and gradients of the whole line meet the target standard.",
		"panel.cost": "Cost:",
		"panel.noMoney": "not enough funds",
		"panel.budget": "Budget:",
		"panel.footer": "The game\u2019s conversion touches neither spawned trains nor purchased stock: delete the line\u2019s trains before converting and buy stock of the new type afterwards. The full migration is in the main menu.",
		"mig.headNote": "Thumbnail and camera regenerate on the first save in game; if the original had a timelapse, its frames are not kept.",
		"mig.autosave": "autosave",
		"mig.oldSave": "Save with schema v{v}: migration needs v3. Load and save it once in game to upgrade it.",
		"mig.tooShort": "The train physically does not fit these platforms",
		"mig.failed": "Could not be resolved",
		"mig.saved": "Save migrated and written.",
		"mig.after": "After migrating",
		"mig.rebuildHint": "The line's travel times are still the old type's until the game recomputes them: build any piece of track (you can delete it afterwards) before assigning trains.",
		"mig.noElectron": "This only works in the desktop build.",
		"mig.flagOn": "Turn on the game's quick conversion",
		"mig.flagIsOn": "The game's quick conversion is on.",
		"mig.flagRestart": "Turned on. Restart the game for it to take effect.",
		"mig.flagWhat": "Experimental game feature, off by default and with no menu access in the stable build. It only retypes: it does not touch platforms, geometry or trains."
	};

	let t = (k) => STRINGS_ES[k] || k;
	try {
		if (api.utils && api.utils.i18n && typeof api.utils.i18n.create === "function") {
			const inst = api.utils.i18n.create({ en: STRINGS_EN, es: STRINGS_ES, "es-ES": STRINGS_ES });
			if (typeof inst === "function") t = inst;
			else if (inst && typeof inst.t === "function") t = inst.t.bind(inst);
		}
	} catch (err) {
		console.warn(`${TAG} i18n no disponible, se usa castellano:`, err);
	}


	const TYPES = [
		{
			id: "madrid-metro-estrecho",
			name: "Metro Madrid (perfil estrecho)",
			description:
				"Red de gálibo estrecho de Metro de Madrid (L1-L5 y Ramal). Basado en la Serie 3000 de CAF: caja de 2,30 m, coches de 14,9 m en composiciones de 4 o 6 (59,6-89,4 m en juego; el tren real mide 59,94-89,38 m) para andenes de 60-94 m (los reales son de 60 y 90 m; nota: el preview de construcción muestra la capacidad con un margen de 4 m que la estación construida no aplica, así que un andén de 90 m opera con 6 coches aunque el preview diga 4). Curvas históricas de hasta 90 m de radio (la norma moderna MM-DT-0-01 exige 210-300 m en trazado nuevo) y pendiente de hasta 5,2%: la del Ramal Ópera-Príncipe Pío (52,06 milésimas) en servicio comercial, muy por encima del 3,5% de criterio de proyecto. Túneles más baratos por el gálibo reducido (6,86 m). Los ramales entre líneas de esta red son totalmente compatibles.",
			stats: {
				maxAcceleration: 1.0,
				maxDeceleration: 1.2,
				maxSpeed: 22.22,
				maxSpeedLocalStation: 13,
				capacityPerCar: 122,
				carLength: 14.9,
				minCars: 4,
				maxCars: 6,
				carsPerCarSet: 2,
				carCost: 2300000,
				trainWidth: 2.3,
				minStationLength: 60,
				maxStationLength: 94,
				baseTrackCost: 27000,
				baseStationCost: 45000000,
				trainOperationalCostPerHour: 220,
				carOperationalCostPerHour: 22,
				stopTimeSeconds: 20,
				parallelTrackSpacing: 3.3,
				trackClearance: 0.9,
				maxLateralAcceleration: 1,
				minTurnRadius: 90,
				minStationTurnRadius: 300,
				maxSlopePercentage: 5.2,
				trackMaintenanceCostPerMeter: 320,
				stationMaintenanceCostPerYear: 280000,
				tphLimit: 42,
				crossoverSpeed: 6.7
			},
			compatibleTrackTypes: ["madrid-metro-estrecho"],
			appearance: { color: "#0065bd" },
			allowGradeCrossing: false,
			portalCost: 15000000,
			rampCost: 5000000,
			maxOverpassSpan: 65
		},
		{
			id: "madrid-metro-ancho",
			name: "Metro Madrid (gran perfil)",
			description:
				"Red de gran perfil de Metro de Madrid (L6-L12). Basado sobre todo en la Serie 8000, con la que cuadran los 18,15 m y las ~200 plazas por coche (la 9000 de AnsaldoBreda tiene cotas algo distintas): caja de 2,80 m, coches de 18,15 m en composiciones de 3 o 6 para andenes de hasta 115 m como los de la L10. Red moderna: 110 km/h de velocidad de servicio (120 de fábrica) y radio de proyecto de 300 m según MM-DT-0-01, pero el tipo permite el radio de 250 m y la pendiente del 4% que la red usa de verdad como excepción (conexión L8-L10, prolongación de L7 a Pitis bajo la M-30, L9 Pavones-Puerta de Arganda).",
			stats: {
				maxAcceleration: 1.0,
				maxDeceleration: 1.2,
				maxSpeed: 30.55,
				maxSpeedLocalStation: 13,
				capacityPerCar: 200,
				carLength: 18.15,
				minCars: 3,
				maxCars: 6,
				carsPerCarSet: 3,
				carCost: 2800000,
				trainWidth: 2.8,
				minStationLength: 55,
				maxStationLength: 115,
				baseTrackCost: 30000,
				baseStationCost: 60000000,
				trainOperationalCostPerHour: 250,
				carOperationalCostPerHour: 25,
				stopTimeSeconds: 22,
				parallelTrackSpacing: 3.6,
				trackClearance: 1,
				maxLateralAcceleration: 1,
				minTurnRadius: 250,
				minStationTurnRadius: 300,
				maxSlopePercentage: 4.0,
				trackMaintenanceCostPerMeter: 360,
				stationMaintenanceCostPerYear: 320000,
				tphLimit: 42,
				crossoverSpeed: 6.7
			},
			compatibleTrackTypes: ["madrid-metro-ancho"],
			appearance: { color: "#63b1e5" },
			allowGradeCrossing: false,
			portalCost: 15000000,
			rampCost: 5000000,
			maxOverpassSpan: 65
		},
		{
			id: "madrid-metro-ligero",
			name: "Metro Ligero",
			description:
				"Metro Ligero de Madrid (ML1-ML3). Basado en el Alstom Citadis 302: unidades articuladas de 32,16 m y 2,40 m de ancho (más estrechas que el Citadis estándar para el gálibo madrileño), 186 plazas por unidad, en simple o doble composición, 70 km/h y 750 V. Radio mínimo de 25 m, muy por debajo de los 90 m de las curvas más cerradas del metro, y rampas de hasta 6,5% (estimación: los Citadis admiten del 6 al 8%, pero no hay cifra oficial publicada de ML1-ML3). Puede circular en superficie compartiendo calle y cruzar a nivel.",
			stats: {
				maxAcceleration: 1.03,
				maxDeceleration: 1.5,
				maxSpeed: 19.44,
				maxSpeedLocalStation: 10,
				capacityPerCar: 186,
				carLength: 32.16,
				minCars: 1,
				maxCars: 2,
				carsPerCarSet: 1,
				carCost: 3200000,
				trainWidth: 2.4,
				minStationLength: 33,
				maxStationLength: 70,
				baseTrackCost: 16000,
				baseStationCost: 4000000,
				trainOperationalCostPerHour: 130,
				carOperationalCostPerHour: 20,
				stopTimeSeconds: 15,
				parallelTrackSpacing: 3.0,
				trackClearance: 0.6,
				maxLateralAcceleration: 0.9,
				minTurnRadius: 25,
				minStationTurnRadius: 60,
				maxSlopePercentage: 6.5,
				trackMaintenanceCostPerMeter: 240,
				stationMaintenanceCostPerYear: 50000,
				tphLimit: 40,
				crossoverSpeed: 6.7
			},
			compatibleTrackTypes: ["madrid-metro-ligero"],
			appearance: { color: "#78be20" },
			allowAtGradeRoadCrossing: true,
			allowGradeCrossing: true,
			gradeCrossingBaseCost: 150000,
			gradeCrossingMaintenancePerDay: 2500,
			gradeCrossingTphLimit: { highway: null, major: 20, medium: 20, minor: 20 },
			portalCost: 10000000,
			rampCost: 3000000,
			maxOverpassSpan: 60
		},
		{
			id: "renfe-cercanias",
			name: "Cercanías Madrid",
			description:
				"Red de Cercanías de Madrid. Basado en la Serie 452 real de Renfe (Alstom X'Trapolis, entregas 2025-2026): unidades de 6 coches y 100 m con 2 coches centrales de dos pisos, ~905 plazas por unidad, caja de 3,10 m y 140 km/h. Trenes de 100 o 200 m (1 o 2 unidades); los 16,67 m y las 151 plazas por coche son promedios de la unidad, no cotas reales de coche. Pendiente máxima 3,5%, radio de vía de 250 m y andenes en curva de radio >= 300 m —ambos criterio propio: el mínimo ETI de líneas nuevas es 150 m y no hay regla publicada de 300 m para andenes— y entrevía convencional de 3,808 m. Admite pasos a nivel. Toda la red de Cercanías es interoperable entre sí.",
			stats: {
				maxAcceleration: 1.0,
				maxDeceleration: 1.0,
				maxSpeed: 38.89,
				maxSpeedLocalStation: 15,
				capacityPerCar: 151,
				carLength: 16.67,
				minCars: 6,
				maxCars: 12,
				carsPerCarSet: 6,
				carCost: 1300000,
				trainWidth: 3.1,
				// 101 y no 100: el tren de 6 coches mide 6 x 16,67 = 100,02 m, así que un
				// andén de 100 m solo colaba por el epsilon de +0,2 m que calculateStationMaxCars
				// suma a la longitud útil. Ese epsilon vive ahí y en la comprobación de MÁXIMO
				// (len > maxStationLength + 0,2); la de mínimo es estricta, sin tolerancia.
				// Con 101 hay +0,98 m de margen, en línea con los otros tres tipos.
				minStationLength: 101,
				maxStationLength: 210,
				baseTrackCost: 46750,
				baseStationCost: 63750000,
				trainOperationalCostPerHour: 520,
				carOperationalCostPerHour: 52,
				stopTimeSeconds: 40,
				parallelTrackSpacing: 3.808,
				trackClearance: 1.86,
				// 1.0 y no 1.68: las ETI/ADIF dan 0,65 m/s² de insuficiencia de peralte
				// normal y 1,0 excepcional. El 1.68 heredado era el único outlier del pack
				// (los cuatro tipos vanilla van de 0,8 a 1,0).
				maxLateralAcceleration: 1.0,
				minTurnRadius: 250,
				minStationTurnRadius: 300,
				maxSlopePercentage: 3.5,
				trackMaintenanceCostPerMeter: 300,
				stationMaintenanceCostPerYear: 320000,
				tphLimit: 30,
				crossoverSpeed: 6.7
			},
			compatibleTrackTypes: ["renfe-cercanias"],
			appearance: { color: "#e30613" },
			allowAtGradeRoadCrossing: false,
			allowGradeCrossing: true,
			gradeCrossingBaseCost: 300000,
			gradeCrossingMaintenancePerDay: 5000,
			gradeCrossingTphLimit: { highway: null, major: 12, medium: 14, minor: 16 },
			portalCost: 15000000,
			rampCost: 5000000,
			maxOverpassSpan: 50
		}
	];

	// Los nombres y descripciones se traducen AQUÍ, no en el literal, porque
	// registerTrainType guarda el objeto tal cual: lo que se registre es lo que
	// verá el jugador para el resto de la sesión. Cambiar de idioma en caliente
	// no los retraduce; haría falta recargar los mods.
	const TYPE_KEY = {
		"madrid-metro-estrecho": "estrecho",
		"madrid-metro-ancho": "ancho",
		"madrid-metro-ligero": "ligero",
		"renfe-cercanias": "cercanias"
	};
	for (const type of TYPES) {
		const k = TYPE_KEY[type.id];
		if (!k) continue;
		const n = t("type." + k + ".name"), d = t("type." + k + ".desc");
		if (n && n.indexOf("type.") !== 0) type.name = n;
		if (d && d.indexOf("type.") !== 0) type.description = d;
	}

	let registered = 0;
	for (const type of TYPES) {
		try {
			api.trains.registerTrainType(type);
			registered++;
			console.log(`${TAG} Registered train type: ${type.id}`);
		} catch (err) {
			console.error(`${TAG} Failed to register ${type.id}:`, err);
			api.ui.showNotification(`${TAG} error registrando ${type.id}`, "error");
		}
	}
	console.log(`${TAG} ${registered}/${TYPES.length} train types registered.`);

	// ---------------------------------------------------------------------------
	// Panel de migración
	//
	// El juego trae desde la 1.6.0 una conversión de tipo de tren in situ
	// (botón "Convert train type" en el panel de línea), detrás del flag
	// experimental ROUTE_TYPE_CONVERSION. Acepta tipos registrados por mods, pero
	// no dice de antemano qué destino es viable: solo te deja elegir uno y, si no
	// cabe, falla nombrando UNA estación. Este panel hace ese cálculo por
	// adelantado para todas las líneas y todos los destinos a la vez.
	//
	// La API de mods NO permite ejecutar la conversión (no hay mutador de
	// route.trainType ni de track.trackType, y el store no es alcanzable), así que
	// esto informa y guía; la ejecución sigue siendo del jugador.
	//
	// Réplica exacta de la aritmética del motor (verificada contra el bundle 1.6.0):
	//   coste           = round(Σ longitud de vías distintas de stCombos[].path
	//                           × stats.baseTrackCost del destino × 0,25)
	//   coches          = max(min, round(clamp(actuales, min, max) / set) × set)
	//   andén admite    = max(min(floor(floor((L + 0,2) / carLength) / set) × set, max), set)
	// El epsilon es 0,2 m y el buffer de 4 m NO se aplica aquí (applyBuffer: false).
	//
	// La longitud de andén se deduce como la MEDIA de las longitudes de los
	// carriles de la estación (agrupando station.trackIds por id base, sin el
	// sufijo @@n de partición). La API no expone trackGroups, que es de donde el
	// motor saca su centerLine; medido contra 209 estaciones reales el error de
	// esta media es de ±0,08 m, así que los casos a menos de 0,15 m del umbral se
	// marcan como dudosos en lugar de afirmarlos.
	// ---------------------------------------------------------------------------

	const EPSILON = 0.2;      // tolerancia del motor en calculateStationMaxCars
	const CONV_COST_FACTOR = 0.25;
	const BORDERLINE = 0.15;  // margen de incertidumbre del andén deducido

	function platformLengthOf(station, trackById) {
		const lanes = new Map();
		for (const tid of station.trackIds || []) {
			const t = trackById.get(tid);
			if (!t) continue;
			const base = String(tid).split("@@")[0];
			lanes.set(base, (lanes.get(base) || 0) + (t.length || 0));
		}
		if (lanes.size === 0) return null;
		let sum = 0;
		for (const v of lanes.values()) sum += v;
		return sum / lanes.size;
	}

	function carsAllowedBy(platformLength, type) {
		const s = type.stats;
		const raw = Math.floor((platformLength + EPSILON) / s.carLength);
		const set = Math.min(Math.floor(raw / s.carsPerCarSet) * s.carsPerCarSet, s.maxCars);
		return Math.max(set, s.carsPerCarSet);
	}

	function clampCars(cars, type) {
		const s = type.stats;
		let c = Math.max(s.minCars, Math.min(s.maxCars, cars));
		c = Math.round(c / s.carsPerCarSet) * s.carsPerCarSet;
		return Math.max(s.minCars, c);
	}

	// Vías que el motor factura: solo las de stCombos[].path. (Las de andén, en
	// stNodes[].trackIds, se convierten pero no se cobran.)
	function billableTrackIds(route) {
		const ids = new Set();
		for (const combo of route.stCombos || []) {
			for (const step of combo.path || []) {
				if (step && step.trackId) ids.add(step.trackId);
			}
		}
		return ids;
	}

	function analyseRoute(route, ctx) {
		const types = ctx.types;
		const currentId = route.trainType || "heavy-metro";
		const current = types[currentId];
		const ids = billableTrackIds(route);
		let length = 0;
		for (const id of ids) {
			const t = ctx.trackById.get(id);
			if (t) length += t.length || 0;
		}
		const stations = ctx.stations.filter((s) => (s.routeIds || []).includes(route.id));
		const platforms = stations
			.map((s) => ({ name: s.name, length: platformLengthOf(s, ctx.trackById) }))
			.filter((p) => p.length != null);

		const options = [];
		for (const id of Object.keys(types)) {
			if (id === currentId) continue;
			const target = types[id];
			if (!target || !target.stats) continue;

			const wanted = clampCars(route.carsPerTrain || (current && current.stats.carsPerCarSet) || 1, target);
			let binding = null;      // estación más restrictiva
			let allowedMin = Infinity;
			for (const p of platforms) {
				const allowed = carsAllowedBy(p.length, target);
				if (allowed < allowedMin) { allowedMin = allowed; binding = p; }
			}
			if (!platforms.length) allowedMin = wanted;

			// ¿bajando los coches de la línea se desbloquearía?
			let rescueAt = null;
			if (wanted > allowedMin) {
				for (let c = target.stats.minCars; c <= wanted; c += target.stats.carsPerCarSet) {
					if (clampCars(c, target) <= allowedMin) { rescueAt = c; break; }
				}
			}

			// ¿el veredicto depende de menos de 15 cm?
			let doubtful = false;
			if (binding) {
				const needed = wanted * target.stats.carLength - EPSILON;
				doubtful = Math.abs(binding.length - needed) < BORDERLINE;
			}

			options.push({
				id, name: target.name,
				cars: wanted,
				ok: wanted <= allowedMin,
				doubtful,
				allowed: allowedMin,
				binding: binding ? binding.name : null,
				bindingLength: binding ? binding.length : null,
				rescueAt,
				cost: Math.round(length * target.stats.baseTrackCost * CONV_COST_FACTOR)
			});
		}
		// Sin ordenar por conveniencia ni recomendar nada: se conserva el orden del
		// registro de tipos, el mismo que usa el desplegable del juego. Quien decide
		// el destino es el jugador; este panel solo dice qué pasaría con el que elija.

		const strandedTrains = ctx.trains.filter(
			(t) => t.routeId === route.id && (t.trainType || "heavy-metro") !== currentId
		).length;

		return {
			route, currentId,
			currentName: current ? current.name : currentId,
			length, stationCount: stations.length,
			shortest: platforms.length ? Math.min(...platforms.map((p) => p.length)) : null,
			trainCount: ctx.trains.filter((t) => t.routeId === route.id).length,
			strandedTrains,
			options
		};
	}

	function conversionEnabled() {
		try {
			const raw = localStorage.getItem("featureFlags");
			if (!raw) return false;
			return JSON.parse(raw).ROUTE_TYPE_CONVERSION === true;
		} catch (err) {
			return null; // no se pudo determinar
		}
	}

	function money(n) {
		// Misma unidad que la herramienta del menú y que los mensajes del juego
		// ("$X.XM"): millones con un decimal, sin símbolo que pueda no cuadrar.
		return (n / 1e6).toFixed(1) + " M";
	}

	function renderMigrationBody(selection, setSelection, flagState, setFlagState) {
		const React = api.utils && api.utils.React;
		if (!React) return null;
		const h = React.createElement;

		let ctx;
		try {
			const trackById = new Map();
			for (const t of api.gameState.getTracks() || []) trackById.set(t.id, t);
			ctx = {
				types: api.trains.getTrainTypes() || {},
				trackById,
				stations: api.gameState.getStations() || [],
				trains: api.gameState.getTrains() || [],
				mine: new Set(TYPES.map((t) => t.id))
			};
		} catch (err) {
			return h("div", { className: "p-4 text-sm text-destructive" },
				t("panel.stateErr") + String(err));
		}

		const routes = (api.gameState.getRoutes() || []).filter((r) => !r.tempParentId);
		const flag = conversionEnabled();
		const budget = (() => { try { return api.gameState.getBudget(); } catch (e) { return null; } })();

		const kids = [];

		// Atajo opcional al conversor del juego. Fusiona el objeto de flags, nunca
		// lo sobrescribe: un setItem con una sola clave borraría los flags que el
		// jugador ya tuviera, y si alguno gobierna un tipo de tren en uso ese tipo
		// desaparecería de TRAIN_TYPES y el juego reventaría en el cobro de costes.
		const flagOn = flag === true || flagState === "on";
		kids.push(h("div", { key: "flag", className: "border border-border rounded p-2 space-y-1" }, [
			h("p", { key: "w", className: "text-[11px] text-muted-foreground leading-relaxed" }, t("mig.flagWhat")),
			flagOn
				? h("p", { key: "s", className: "text-[11px] text-green-600" }, t("mig.flagIsOn"))
				: h("button", {
					key: "b",
					className: "px-2 py-1 text-[11px] rounded border border-border hover:bg-muted",
					onClick: () => {
						const r = setConversionFlag(true);
						setFlagState(r.ok ? "on" : "error");
					}
				}, t("mig.flagOn")),
			flagState === "on" ? h("p", { key: "r", className: "text-[11px] text-amber-600" }, t("mig.flagRestart")) : null
		]));

		kids.push(h("div", { key: "hdr", className: "text-xs text-muted-foreground leading-relaxed" }, [
			h("p", { key: "a" }, t("panel.intro")),
			h("p", { key: "b", className: "mt-1" }, [
				t("panel.flagReq") + " ",
				h("code", { key: "c", className: "text-[11px]" }, "ROUTE_TYPE_CONVERSION"),
				flag === true
					? h("span", { key: "d", className: "text-green-600 font-medium" }, " · " + t("panel.flagActive"))
					: flag === false
						? h("span", { key: "d", className: "text-amber-600 font-medium" }, " · " + t("panel.flagOff"))
						: h("span", { key: "d" }, " · " + t("panel.flagUnknown"))
			])
		]));

		if (!routes.length) {
			kids.push(h("p", { key: "none", className: "text-sm text-muted-foreground mt-4" },
				t("panel.noRoutes")));
			return h("div", { className: "p-4 space-y-3" }, kids);
		}

		for (const route of routes) {
			let a;
			try { a = analyseRoute(route, ctx); }
			catch (err) { continue; }

			const chosen = selection[route.id] || "";
			const o = chosen ? a.options.find((x) => x.id === chosen) : null;

			let detail = null;
			if (o) {
				// Veredicto del JUEGO (su conversor, con su laxitud del
				// Math.max(n, carsPerCarSet)) más el encaje FÍSICO, que es lo que
				// de verdad le importa al jugador: un tren de 100 m en un andén de
				// 94 el juego lo acepta, pero sobresale.
				const target2 = ctx.types[o.id];
				const needed = o.cars * target2.stats.carLength - EPSILON;
				const physShort = o.bindingLength != null && o.bindingLength < needed;
				let verdict, cls;
				if (o.ok && physShort) {
					verdict = t("panel.fits").replace("{n}", o.cars) + " " + t("panel.fitsShort")
						.replace("{m}", needed.toFixed(1)).replace("{s}", o.binding).replace("{l}", o.bindingLength.toFixed(1));
					cls = "text-amber-600";
				} else if (o.ok) {
					verdict = t("panel.fits").replace("{n}", o.cars);
					cls = "text-green-600";
				} else if (o.rescueAt != null) {
					verdict = t("panel.noFit").replace("{n}", o.cars).replace("{s}", o.binding).replace("{a}", o.allowed)
						+ " " + t("panel.rescue").replace("{n}", o.rescueAt);
					cls = "text-amber-600";
				} else {
					verdict = t("panel.noFitNone").replace("{s}", o.binding).replace("{a}", o.allowed);
					cls = "text-destructive";
				}
				if (o.doubtful) { verdict += " " + t("panel.limit"); if (cls === "text-green-600") cls = "text-amber-600"; }

				// Radios y pendientes contra la norma del destino, con las mismas
				// réplicas del validador que usa el motor. Solo para el destino
				// elegido: es un recorrido por todas las vías de la línea.
				let geoLine = null;
				try {
					let badR = 0, badP = 0;
					for (const idT of routeTrackIds(route)) {
						const tt2 = ctx.trackById.get(idT);
						if (!tt2 || !tt2.coords || tt2.type === "scissors-crossover") continue;
						const isSt2 = tt2.type === "station" || tt2.type === "express-station";
						const minR2 = isSt2 ? target2.stats.minStationTurnRadius : target2.stats.minTurnRadius;
						if (curvatureViolations(tt2.coords, minR2).length) badR++;
						if (slopePercent(tt2) > target2.stats.maxSlopePercentage) badP++;
					}
					geoLine = (badR || badP)
						? h("p", { key: "g", className: "text-xs text-amber-600" },
							t("panel.geom").replace("{r}", badR).replace("{p}", badP))
						: h("p", { key: "g", className: "text-xs text-green-600" }, t("panel.geomOk"));
				} catch (e) { geoLine = null; }

				const afford = budget == null || budget >= o.cost;
				detail = h("div", { key: "d", className: "space-y-1 pt-1" }, [
					h("p", { key: "v", className: "text-xs " + cls }, verdict),
					geoLine,
					h("p", { key: "c", className: "text-xs tabular-nums" }, [
						t("panel.cost") + " ",
						h("span", { key: "n", className: afford ? "font-medium" : "font-medium text-destructive" }, money(o.cost)),
						afford ? "" : " · " + t("panel.noMoney")
					])
				]);
			}

			kids.push(h("div", {
				key: route.id,
				className: "border border-border rounded p-3 space-y-2"
			}, [
				h("div", { key: "t", className: "flex items-baseline justify-between gap-3" }, [
					h("span", { key: "b", className: "font-semibold text-sm" },
						(route.bullet || "?") + (route.fullName ? " · " + route.fullName : "")),
					h("span", { key: "c", className: "text-xs text-muted-foreground" }, a.currentName)
				]),
				h("div", { key: "m", className: "text-[11px] text-muted-foreground tabular-nums" },
					(a.length / 1000).toFixed(1) + " km · " + a.stationCount + " " + t("panel.est") + " · " +
					(a.shortest != null ? t("panel.shortest") + " " + a.shortest.toFixed(1) + " m · " : "") +
					a.trainCount + " " + t("mig.trains") + " · " +
					(route.carsPerTrain || "?") + " " + t("mig.cars")),
				h("div", { key: "s", className: "flex items-center gap-2" }, [
					h("label", {
						key: "l",
						htmlFor: "mtp-sel-" + route.id,
						className: "text-[11px] text-muted-foreground whitespace-nowrap"
					}, t("panel.convertTo")),
					h("select", {
						key: "sel",
						id: "mtp-sel-" + route.id,
						value: chosen,
						onChange: (e) => setSelection(Object.assign({}, selection, { [route.id]: e.target.value })),
						className: "flex-1 h-7 text-xs rounded border border-border bg-background px-2"
					}, [h("option", { key: "_", value: "" }, t("panel.choose"))].concat(
						a.options.map((x) => h("option", { key: x.id, value: x.id }, x.name))
					))
				]),
				detail
			]));
		}

		kids.push(h("div", { key: "ft", className: "text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-2" }, [
			h("p", { key: "b" }, t("panel.footer")),
			budget != null
				? h("p", { key: "c", className: "mt-1 tabular-nums" }, t("panel.budget") + " " + money(budget))
				: null
		]));

		return h("div", { className: "p-4 space-y-3" }, kids);
	}

	// ===========================================================================
	// MOTOR DE MIGRACIÓN
	//
	// Reescribe un fichero de guardado para llevar una línea entera al tipo de
	// tren destino: retipa la vía, ajusta los andenes, adapta la geometría que
	// incumpla la norma del tipo, borra los trenes y deja la línea parada.
	//
	// No tocamos el contenedor binario: `window.electron.loadGameFromFile()`
	// devuelve el objeto ya parseado y `saveGameToFile(obj)` lo vuelve a
	// codificar. El proceso principal se encarga además de la copia de seguridad
	// y de restaurarla si la escritura falla ("[MetroFormat] Restored from
	// backup after failed save").
	//
	// Los dos canales están bloqueados MIENTRAS se cargan los mods
	// (modContextStart/modContextEnd con nonce), pero ese contexto se cierra al
	// terminar la carga, así que desde un onClick posterior están disponibles.
	// ===========================================================================

	const EARTH_R = 6371008.8;      // el radio que usa turf
	const COORD_PRECISION = 6;      // roundCoordinate del motor

	function toRad(d) { return d * Math.PI / 180; }
	function toDeg(r) { return r * 180 / Math.PI; }

	function roundCoord(c) {
		// Number(toFixed(6)), NO Math.round(x·1e6)/1e6: es lo que hace el juego
		// (roundCoordinate, index.deob.js:95796) y las dos formas difieren justo
		// en los límites de celda — con Math.round, 129 de las 131 bretelles
		// regeneradas salían con vértices saltados una celda (hasta 14,2 cm).
		return [Number(c[0].toFixed(COORD_PRECISION)), Number(c[1].toFixed(COORD_PRECISION))];
	}

	// Réplica de strCoords: así indexa el motor los stNodes y el grafo de vía.
	function coordKey(c) {
		const r = roundCoord(c);
		return "" + (r[1] < 0 ? "S" : "") + r[0] + "-" + Math.abs(r[1]);
	}

	function coordsEqual(a, b) { return a[0] === b[0] && a[1] === b[1]; }

	function distanceM(a, b) {
		const p1 = toRad(a[1]), p2 = toRad(b[1]), dl = toRad(b[0] - a[0]);
		const x = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
		// atan2, no asin: es la forma EXACTA de turf.distance. La diferencia es
		// sub-nanométrica, pero al regenerar bezieres el redondeo a 6 decimales
		// amplifica cualquier desvío a saltos de celda de 7-14 cm.
		return 2 * EARTH_R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
	}

	function bearingDeg(a, b) {
		const p1 = toRad(a[1]), p2 = toRad(b[1]), dl = toRad(b[0] - a[0]);
		return toDeg(Math.atan2(
			Math.sin(dl) * Math.cos(p2),
			Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)
		));
	}

	// Réplica de turf.destination.
	function destination(from, meters, bearing) {
		const d = meters / EARTH_R, b = toRad(bearing);
		const p1 = toRad(from[1]), l1 = toRad(from[0]);
		const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
		const l2 = l1 + Math.atan2(
			Math.sin(b) * Math.sin(d) * Math.cos(p1),
			Math.cos(d) - Math.sin(p1) * Math.sin(p2)
		);
		// SIN redondear: turf.destination devuelve crudo. El redondeo que había
		// aquí movía los puntos de control del bezier de las bretelles hasta
		// 5 cm y, tras redondear la curva, saltaba celdas de 14 cm. Quien
		// necesite la coordenada final redondeada, que la redondee al asignarla.
		return [toDeg(l2), toDeg(p2)];
	}


	function lineLength(coords) {
		let t = 0;
		for (let i = 0; i < coords.length - 1; i++) t += distanceM(coords[i], coords[i + 1]);
		return t;
	}

	// Réplica EXACTA de calculateTurnRadius del motor, incluidos los dos descartes:
	// tramos por debajo de 1 m y deflexiones por debajo de 1°. Densificar por
	// debajo de 1 m no mejora la línea, ciega el comprobador.
	//
	// OJO, esto NO es el radio circunscrito. El motor divide entre sin(θ/2) donde
	// la ley de senos pediría sin(θ), así que devuelve aproximadamente el DOBLE
	// del radio real (verificado: ratio 1,999 a 2,9° por segmento, 1,96 a 22,9°).
	// Un minTurnRadius declarado de 250 m admite por tanto curvas de ~125 m reales.
	// Da igual si es un descuido del juego o una holgura deliberada: la conformidad
	// hay que medirla con ESTA fórmula, porque es la que usa validateTrackCurvature
	// al construir. Corregir una curva al radio verdadero movería la línea el doble
	// de lo necesario.
	function turnRadius(a, b, c) {
		const d1 = distanceM(a, b), d2 = distanceM(b, c);
		if (d1 < 1 || d2 < 1) return null;
		let th = Math.abs(bearingDeg(b, c) - bearingDeg(a, b));
		if (th > 180) th = 360 - th;
		if (th < 1) return null;
		return Math.abs(distanceM(a, c) / (2 * Math.sin(th * Math.PI / 360)));
	}

	// Réplica de validateTrackSlope.
	function slopePercent(track) {
		const L = track.length || lineLength(track.coords || []);
		if (!L) return 0;
		return Math.abs((track.endElevation || 0) - (track.startElevation || 0)) / L * 100;
	}

	// Réplica de validateTrackCurvature: recorre las ternas consecutivas.
	function curvatureViolations(coords, minRadius) {
		const out = [];
		if (!coords || coords.length < 3) return out;
		for (let i = 0; i < coords.length - 2; i++) {
			const r = turnRadius(coords[i], coords[i + 1], coords[i + 2]);
			if (r !== null && r < minRadius) out.push({ index: i + 1, radius: r });
		}
		return out;
	}

	// Las vías que el motor considera de la ruta: las del recorrido y las de andén.
	function routeTrackIds(route) {
		const ids = new Set();
		for (const combo of route.stCombos || []) {
			for (const step of combo.path || []) {
				if (step && step.trackId) ids.add(step.trackId);
			}
		}
		for (const node of route.stNodes || []) {
			for (const id of node.trackIds || []) ids.add(id);
		}
		return ids;
	}

	// -------------------------------------------------------------------------
	// PREFLIGHT
	//
	// Replica lo que el cargador hace con un save malformado. Hay dos familias:
	// las que abortan la carga a medias (dejando el store medio escrito) y las
	// que borran datos EN SILENCIO, que son las peligrosas de verdad.
	// -------------------------------------------------------------------------
	// resc: ids de rutas EN MIGRACIÓN. Sus trenes de tipo no registrado se
	// degradan a aviso — se van a borrar igualmente, y este es el único contexto
	// donde un save así (flag apagado, mod de tipos desinstalado) aún se puede
	// rescatar, porque el juego ni siquiera lo abre.
	function preflight(data, trainTypes, resc) {
		const errors = [], warnings = [];
		const rescSet = resc || new Set();
		const rutasResc = new Set(rescSet);
		for (const r of data.routes || []) if (r.tempParentId && rescSet.has(r.tempParentId)) rutasResc.add(r.id);
		const trackById = new Map((data.tracks || []).map((t) => [t.id, t]));
		const groupById = new Map((data.trackGroups || []).map((g) => [g.id, g]));

		// Silencioso y destructivo: validateRoutesAndTrains tira la ruta ENTERA y
		// todos sus trenes si una sola vía del recorrido no existe.
		for (const route of data.routes || []) {
			for (const combo of route.stCombos || []) {
				for (const step of combo.path || []) {
					if (step && step.trackId && !trackById.has(step.trackId)) {
						errors.push(`La línea ${route.bullet || route.id} referencia la vía ${step.trackId}, que no existe. El juego borraría la línea y sus trenes sin avisar.`);
					}
				}
			}
		}

		// Aborta la carga dentro de backfillStationMaxCars.
		for (const st of data.stations || []) {
			const g = groupById.get(st.trackGroupId);
			if (!g) errors.push(`La estación "${st.name || st.id}" apunta al grupo ${st.trackGroupId}, que no existe. La carga abortaría.`);
			else if (!g.centerLine || g.centerLine.length < 2) errors.push(`El grupo ${g.id} de la estación "${st.name || st.id}" no tiene centerLine. La carga abortaría.`);
		}

		// Revienta en el primer render, no al cargar.
		for (const tr of data.trains || []) {
			const id = tr.trainType;
			if (!id || trainTypes[id]) continue;
			if (rutasResc.has(tr.routeId)) warnings.push(`El tren ${tr.id} usa el tipo "${id}", no registrado: se borrará con la migración.`);
			else errors.push(`El tren ${tr.id} usa el tipo "${id}", que no está registrado. El juego lanzaría "One or more trains are missing important data".`);
		}
		for (const route of data.routes || []) {
			if (!route.trainType || trainTypes[route.trainType]) continue;
			if (rutasResc.has(route.id)) warnings.push(`La línea ${route.bullet || route.id} usa el tipo "${route.trainType}", no registrado: se retipará con la migración.`);
			else errors.push(`La línea ${route.bullet || route.id} usa el tipo "${route.trainType}", que no está registrado.`);
		}

		// Silencioso: removeOrphanTracks borra las vías sin grupo. Y corre ANTES
		// que validateRoutesAndTrains: si la huérfana está en el RECORRIDO de una
		// línea, esa línea cae entera con sus trenes — el modo de fallo más
		// peligroso del cargador. Por eso ahí es error bloqueante, no aviso.
		const grouped = new Set();
		for (const g of data.trackGroups || []) for (const id of g.trackIds || []) grouped.add(id);
		const enPath = new Set();
		for (const route of data.routes || []) {
			for (const combo of route.stCombos || []) {
				for (const step of combo.path || []) if (step && step.trackId) enPath.add(step.trackId);
			}
		}
		let orphansSueltas = 0;
		for (const t of data.tracks || []) {
			if (grouped.has(t.id)) continue;
			if (enPath.has(t.id)) errors.push(`La vía huérfana ${t.id} está en el recorrido de una línea: el juego la borraría al cargar y la línea entera caería con sus trenes.`);
			else orphansSueltas++;
		}
		if (orphansSueltas) warnings.push(`${orphansSueltas} vía(s) sin grupo: el juego las borrará al cargar.`);

		// Aborta dentro de getVMergeSignals.
		for (const g of data.trackGroups || []) {
			for (const id of g.trackIds || []) {
				if (!trackById.has(id)) errors.push(`El grupo ${g.id} referencia la vía ${id}, que no existe. La carga abortaría en getVMergeSignals.`);
			}
		}

		// Longitud declarada contra longitud real: el motor NO la recalcula.
		let stale = 0;
		for (const t of data.tracks || []) {
			if (!t.coords || t.coords.length < 2) continue;
			if (Math.abs((t.length || 0) - lineLength(t.coords)) > 0.5) stale++;
		}
		if (stale) warnings.push(`${stale} vía(s) con track.length desactualizado respecto a sus coords.`);

		return { ok: errors.length === 0, errors, warnings };
	}

	// -------------------------------------------------------------------------
	// RETIPADO Y PARADA DE SERVICIO
	// -------------------------------------------------------------------------
	function retypeRoute(data, route, targetId, trainTypes) {
		const target = trainTypes[targetId];
		const ids = routeTrackIds(route);
		let tracks = 0, groups = 0;

		for (const t of data.tracks || []) {
			if (ids.has(t.id)) { t.trackType = targetId; tracks++; }
		}
		const gruposRetipados = new Set();
		for (const g of data.trackGroups || []) {
			if ((g.trackIds || []).some((id) => ids.has(id))) { g.trackType = targetId; groups++; gruposRetipados.add(g.id); }
		}

		// Un grupo retipado no puede quedarse con vías de otro tipo dentro: el
		// juego jamás produce ese estado al construir y compatibleTrackTypes lo
		// trata como incompatible. Las diagonales de bretelle no están en la ruta
		// (no forman parte de ningún stCombos), así que se retipan aquí aparte.
		const grupoDe = new Map();
		for (const g of data.trackGroups || []) for (const id of g.trackIds || []) grupoDe.set(id, g.id);
		for (const t of data.tracks || []) {
			if (!ids.has(t.id) && gruposRetipados.has(grupoDe.get(t.id)) && t.trackType !== targetId) {
				t.trackType = targetId; tracks++;
			}
		}

		// El retipado invalida station.maxCars (cambia carLength/carsPerCarSet) y
		// backfillStationMaxCars solo SUBE, nunca baja: hay que borrar la clave en
		// TODAS las estaciones de los grupos retipados — no solo en las que se
		// redimensionan — para que el juego la recalcule desde cero al cargar.
		// (El conversor nativo lo consigue con regenStations; nosotros, borrando.)
		let stationsReset = 0;
		for (const st of data.stations || []) {
			if (gruposRetipados.has(st.trackGroupId) && st.maxCars !== undefined) { delete st.maxCars; stationsReset++; }
		}

		route.trainType = targetId;
		route.carsPerTrain = clampCars(route.carsPerTrain || target.stats.minCars, target);
		return { tracks, groups, cars: route.carsPerTrain, stationsReset };
	}

	// Deja la línea sin servicio con la misma mutación que usa el propio juego en
	// duplicateRoute. Con trainSchedule y timetableSchedule ausentes,
	// isScheduleComplete devuelve false y el bucle de spawn ni siquiera calcula
	// cuántos trenes tocarían.
	//
	// Flota: el juego NUNCA resta ownedCarsByType ni ownedTrainCount. buyTrains
	// sube los dos a la par (los dos cuentan COCHES: cobra n × carCost), deleteTrain
	// no toca ninguno, y su propio convertRouteTrainType ni borra trenes ni toca
	// la flota. Los coches en propiedad tampoco cuestan mantenimiento (la partida
	// trainOperational va por trenes en servicio). Así que por defecto se dejan
	// como están, igual que el juego. Con opts.fleet === "refund" se restan los
	// coches de los trenes borrados de los DOS contadores (ownedTrainCount es la
	// suma de ownedCarsByType y hay que mantener la igualdad) y se abona
	// coches × carCost del tipo antiguo, que es lo que costaron.
	function stopService(data, route, trainTypes, opts) {
		const tempIds = new Set((data.routes || []).filter((r) => r.tempParentId === route.id).map((r) => r.id));
		tempIds.add(route.id);

		// Las rutas temporales sobreviven a la migración (solo se borran sus
		// trenes): que no se queden con el trainType viejo — o peor, con uno ya
		// no registrado, que revienta el render.
		for (const r2 of data.routes || []) {
			if (r2.tempParentId === route.id) r2.trainType = route.trainType;
		}

		const removed = (data.trains || []).filter((t) => tempIds.has(t.routeId));
		data.trains = (data.trains || []).filter((t) => !tempIds.has(t.routeId));

		route.idealTrainCount = 0;
		delete route.trainSchedule;
		delete route.timetableSchedule;

		const byType = {};
		for (const t of removed) {
			const ty = t.trainType || "heavy-metro";
			byType[ty] = (byType[ty] || 0) + (t.cars || 0);
		}

		const fleet = opts && opts.fleet === "refund" ? "refund" : "keep";
		const refund = { cars: 0, money: 0 };
		if (fleet === "refund") {
			const owned = data.ownedCarsByType || {};
			for (const ty of Object.keys(byType)) {
				const tt = trainTypes && trainTypes[ty];
				const price = tt && tt.stats && typeof tt.stats.carCost === "number" ? tt.stats.carCost : null;
				// Sin inventario de ese tipo o sin precio conocido no se toca nada:
				// antes dejar la flota como estaba que descuadrarla.
				if (typeof owned[ty] !== "number" || price === null) continue;
				const d = Math.min(owned[ty], byType[ty]);
				owned[ty] -= d;
				refund.cars += d;
				refund.money += d * price;
			}
			data.ownedCarsByType = owned;
			if (typeof data.ownedTrainCount === "number") data.ownedTrainCount = Math.max(0, data.ownedTrainCount - refund.cars);
			if (refund.money > 0) data.money = (data.money || 0) + refund.money;
		}

		return { trains: removed.length, carsByType: byType, fleet, refund };
	}

	// -------------------------------------------------------------------------
	// CONFORMIDAD GEOMÉTRICA
	//
	// El juego evalúa la curvatura POR VÍA: todos los call sites de
	// validateTrackCurvature pasan las coords de una sola vía, y
	// calculateSmoothedTrackRadii igual. Una terna que cruce el empalme entre dos
	// vías NO se evalúa nunca.
	//
	// Eso descompone el problema: basta con mover los vértices INTERIORES de cada
	// vía dejando los extremos clavados. Y como los extremos no se mueven, no se
	// toca la conectividad (igualdad exacta de coordenadas), ni la identidad de
	// los stNodes (indexada por el punto medio del andén), ni los vecinos. Es la
	// diferencia entre un cambio local verificable y reescribir la topología.
	// -------------------------------------------------------------------------

	// Marco plano local en metros. A las escalas de una vía (decenas o centenares
	// de metros) el error es milimétrico, y da igual: el resultado se verifica
	// después llamando a turnRadius, que es la fórmula exacta del motor.
	function localFrame(origin) {
		const phi = toRad(origin[1]);
		const mLat = 111132.92 - 559.82 * Math.cos(2 * phi) + 1.175 * Math.cos(4 * phi);
		const mLon = 111412.84 * Math.cos(phi) - 93.5 * Math.cos(3 * phi);
		return {
			to: (c) => [(c[0] - origin[0]) * mLon, (c[1] - origin[1]) * mLat],
			from: (p) => [origin[0] + p[0] / mLon, origin[1] + p[1] / mLat]
		};
	}

	// Acerca el vértice b a la cuerda a-c lo justo para que la terna cumpla el
	// radio. Bisección sobre el factor perpendicular en vez de invertir la
	// fórmula: es monótono, robusto, y evalúa el radio con la función real.
	function relaxVertex(a, b, c, minRadius) {
		const F = localFrame(b);
		const A = F.to(a), B = F.to(b), C = F.to(c);
		const vx = C[0] - A[0], vy = C[1] - A[1];
		const vv = vx * vx + vy * vy;
		if (vv === 0) return null;
		const t = ((B[0] - A[0]) * vx + (B[1] - A[1]) * vy) / vv;
		const foot = [A[0] + t * vx, A[1] + t * vy];   // pie de la perpendicular

		const at = (s) => F.from([foot[0] + s * (B[0] - foot[0]), foot[1] + s * (B[1] - foot[1])]);
		const okAt = (s) => {
			const r = turnRadius(a, roundCoord(at(s)), c);
			return r === null || r >= minRadius;   // null = el motor no la evalúa
		};
		if (okAt(1)) return null;                  // ya cumple, no se toca
		if (!okAt(0)) return null;                 // ni sobre la cuerda cumple: irresoluble aquí

		let lo = 0, hi = 1;
		for (let i = 0; i < 40; i++) {
			const mid = (lo + hi) / 2;
			if (okAt(mid)) lo = mid; else hi = mid;
		}
		const moved = roundCoord(at(lo));
		return { coord: moved, displacement: distanceM(b, moved) };
	}

	function violatingVertices(coords, minRadius) {
		const bad = [];
		for (let i = 1; i < coords.length - 1; i++) {
			const r = turnRadius(coords[i - 1], coords[i], coords[i + 1]);
			if (r !== null && r < minRadius) bad.push(i);
		}
		return bad;
	}

	// Distancia del vértice i a la cuerda que unirá a sus vecinos si lo borramos:
	// es exactamente la desviación que introduce eliminarlo.
	function vertexOffset(coords, i) {
		const F = localFrame(coords[i]);
		const A = F.to(coords[i - 1]), B = F.to(coords[i]), C = F.to(coords[i + 1]);
		const vx = C[0] - A[0], vy = C[1] - A[1];
		const vv = vx * vx + vy * vy;
		if (vv === 0) return Math.hypot(B[0] - A[0], B[1] - A[1]);
		const t = ((B[0] - A[0]) * vx + (B[1] - A[1]) * vy) / vv;
		return Math.hypot(B[0] - (A[0] + t * vx), B[1] - (A[1] + t * vy));
	}

	// Devuelve coords nuevas o null si no se puede cumplir dentro de la correa.
	//
	// Dos mecanismos, en este orden:
	//   1. Relajación SIMULTÁNEA amortiguada. Mover un vértice rompe la terna del
	//      vecino, así que relajar de uno en uno oscila. Se calcula el objetivo de
	//      todos los vértices que violan y se mueven todos a la vez una fracción
	//      del camino (Jacobi amortiguado), lo que sí converge.
	//   2. Eliminación del vértice. Las coordenadas se guardan a 6 decimales, o sea
	//      ~0,11 m de resolución. En un segmento de pocos metros eso son varios
	//      grados de deflexión irreducibles: hay ternas que NO pueden cumplir un
	//      radio grande por mucho que se muevan. Ahí lo correcto es quitar el
	//      vértice y dejar recta, siempre que la desviación que eso introduce
	//      quepa en la correa.
	function fixCurvature(coords, minRadius, leashM, opts2) {
		if (!coords || coords.length < 3) return { coords, changed: false, moved: 0, idxMap: (coords || []).map((_, i) => i) };
		let work = coords.map((c) => c.slice());
		let disp = new Array(work.length).fill(0);
		let idxMap = work.map((_, i) => i);
		let changed = false, removed = 0;
		const DAMPING = 0.6;

		// Restricción de tangente en los extremos clavados: el vértice adyacente
		// a cada extremo solo puede DESLIZAR sobre la tangente original. Sin
		// esto, la curvatura eliminada reaparecía como codo (hasta 28°) en el
		// empalme — geometría que el validador del juego no mira porque nunca
		// evalúa la terna que cruza dos vías.
		const pinTangents = !opts2 || opts2.endTangents !== false;
		const F0 = localFrame(coords[0]), Fn = localFrame(coords[coords.length - 1]);
		const dir0 = (() => { const v = F0.to(coords[1]); const h = Math.hypot(v[0], v[1]) || 1; return [v[0] / h, v[1] / h]; })();
		const dirN = (() => { const v = Fn.to(coords[coords.length - 2]); const h = Math.hypot(v[0], v[1]) || 1; return [v[0] / h, v[1] / h]; })();
		const b0orig = bearingDeg(coords[0], coords[1]);
		const bNorig = bearingDeg(coords[coords.length - 1], coords[coords.length - 2]);
		// El borrado de vértices esquiva snapTangent: puede dejar una cuerda
		// larga que gira la salida del empalme 25-40°. Si el resultado desvía la
		// tangente de un extremo más de TANGENT_TOL, se declara irresoluble: el
		// codo iría a un empalme que el validador del juego nunca mira, y la
		// política acordada es avisar, no colarlo.
		const TANGENT_TOL = 8;
		const endTangentsOk = (w2) => {
			if (!pinTangents || w2.length < 2) return null;
			let d1 = Math.abs(bearingDeg(w2[0], w2[1]) - b0orig); if (d1 > 180) d1 = 360 - d1;
			let d2 = Math.abs(bearingDeg(w2[w2.length - 1], w2[w2.length - 2]) - bNorig); if (d2 > 180) d2 = 360 - d2;
			const peor = Math.max(d1, d2);
			return peor > TANGENT_TOL ? Math.round(peor) : null;
		};
		const snapTangent = (i, cand) => {
			if (!pinTangents) return cand;
			if (i === 1) {
				const v = F0.to(cand);
				let t2 = v[0] * dir0[0] + v[1] * dir0[1];
				if (t2 < 0.5) t2 = 0.5;
				return roundCoord(F0.from([t2 * dir0[0], t2 * dir0[1]]));
			}
			if (i === work.length - 2) {
				const v = Fn.to(cand);
				let t2 = v[0] * dirN[0] + v[1] * dirN[1];
				if (t2 < 0.5) t2 = 0.5;
				return roundCoord(Fn.from([t2 * dirN[0], t2 * dirN[1]]));
			}
			return cand;
		};

		for (let round = 0; round < 6; round++) {
			// --- fase 1: relajación simultánea amortiguada
			for (let pass = 0; pass < 120; pass++) {
				const bad = violatingVertices(work, minRadius);
				if (!bad.length) break;
				const targets = new Map();
				for (const i of bad) {
					const res = relaxVertex(work[i - 1], work[i], work[i + 1], minRadius);
					if (res) targets.set(i, res.coord);
				}
				if (!targets.size) break;
				let anyMove = false;
				for (const [i, target] of targets) {
					const F = localFrame(work[i]);
					const cur = F.to(work[i]), tgt = F.to(target);
					const next = snapTangent(i, roundCoord(F.from([
						cur[0] + DAMPING * (tgt[0] - cur[0]),
						cur[1] + DAMPING * (tgt[1] - cur[1])
					])));
					const step = distanceM(work[i], next);
					if (step < 1e-4) continue;
					if (disp[i] + step > leashM) continue;   // este vértice ya agotó su correa
					work[i] = next; disp[i] += step; changed = true; anyMove = true;
				}
				if (!anyMove) break;
			}

			const bad = violatingVertices(work, minRadius);
			if (!bad.length) {
				// sin muñones junto a los extremos clavados: un segmento de
				// centímetros define rumbo para el pathfinder igual que uno largo,
				// y girado unos grados es un codo de 40°
				while (work.length > 2 && distanceM(work[0], work[1]) < 0.5) { work.splice(1, 1); disp.splice(1, 1); idxMap.splice(1, 1); }
				while (work.length > 2 && distanceM(work[work.length - 2], work[work.length - 1]) < 0.5) { work.splice(work.length - 2, 1); disp.splice(disp.length - 2, 1); idxMap.splice(idxMap.length - 2, 1); }
				const giro = endTangentsOk(work);
				if (giro !== null) return { coords: null, reason: { code: "endTangent", degrees: giro } };
				return { coords: work, changed, moved: Math.max(...disp, 0), removed, idxMap };
			}

			// --- fase 2: quitar el vértice más irreducible, si cabe en la correa
			let best = null;
			for (const i of bad) {
				const off = vertexOffset(work, i);
				if (off <= leashM && (best === null || off < best.off)) best = { i, off };
			}
			if (!best) {
				const r = turnRadius(work[bad[0] - 1], work[bad[0]], work[bad[0] + 1]);
				return { coords: null, reason: { code: "vertexStuck", vertex: bad[0], radius: r, leash: leashM } };
			}
			work.splice(best.i, 1);
			disp.splice(best.i, 1);
			idxMap.splice(best.i, 1);
			removed++; changed = true;
			if (work.length < 3) return { coords: work, changed, moved: Math.max(...disp, 0), removed, idxMap };
		}

		const left = violatingVertices(work, minRadius);
		if (!left.length) {
			while (work.length > 2 && distanceM(work[0], work[1]) < 0.5) { work.splice(1, 1); disp.splice(1, 1); idxMap.splice(1, 1); }
			while (work.length > 2 && distanceM(work[work.length - 2], work[work.length - 1]) < 0.5) { work.splice(work.length - 2, 1); disp.splice(disp.length - 2, 1); idxMap.splice(idxMap.length - 2, 1); }
			const giro = endTangentsOk(work);
			if (giro !== null) return { coords: null, reason: { code: "endTangent", degrees: giro } };
			return { coords: work, changed, moved: Math.max(...disp, 0), removed, idxMap };
		}
		return { coords: null, reason: { code: "stillBelow", count: left.length } };
	}

	// Campo de desplazamiento de una relajación: para cada vértice ORIGINAL
	// superviviente, su vector de movimiento en metros, indexado por fracción de
	// arco del trazado original. Interpolando ese campo se aplica el MISMO
	// movimiento al carril gemelo y al eje del grupo: el paralelismo se conserva
	// y trackGroup.centerLine no queda desfasado (hallazgos de la revisión).
	function buildWarp(orig, nuevo, idxMap) {
		const total = lineLength(orig);
		if (!total) return () => [0, 0];
		const arcs = [0];
		for (let i = 1; i < orig.length; i++) arcs.push(arcs[i - 1] + distanceM(orig[i - 1], orig[i]));
		const fr = [], dx = [], dy = [];
		for (let k = 0; k < nuevo.length; k++) {
			const oi = idxMap[k];
			const F = localFrame(orig[oi]);
			const v = F.to(nuevo[k]);
			fr.push(arcs[oi] / total); dx.push(v[0]); dy.push(v[1]);
		}
		return (f) => {
			if (f <= fr[0]) return [dx[0], dy[0]];
			for (let k = 1; k < fr.length; k++) {
				if (f <= fr[k]) {
					const w = fr[k] === fr[k - 1] ? 0 : (f - fr[k - 1]) / (fr[k] - fr[k - 1]);
					return [dx[k - 1] + w * (dx[k] - dx[k - 1]), dy[k - 1] + w * (dy[k] - dy[k - 1])];
				}
			}
			return [dx[dx.length - 1], dy[dy.length - 1]];
		};
	}

	// La correspondencia entre el carril líder y lo que recibe su campo NO puede
	// ser por fracción propia: el carril gemelo se guarda INVERTIDO y las
	// mitades @@1/@@2 del mismo lado no solapan el tramo del líder. Se mapea por
	// PUNTO MÁS CERCANO sobre el trazado ORIGINAL del líder, con atenuación
	// fuera del corredor (a >25 m el campo se apaga en 15 m).
	function nearestOnRef(ref, refArcs, refTotal, pt) {
		const F = localFrame(pt);
		const P = F.to(pt);
		let best = { d2: Infinity, arc: 0 };
		for (let i = 0; i + 1 < ref.length; i++) {
			const A = F.to(ref[i]), B = F.to(ref[i + 1]);
			const vx = B[0] - A[0], vy = B[1] - A[1];
			const vv = vx * vx + vy * vy;
			let t2 = vv ? ((P[0] - A[0]) * vx + (P[1] - A[1]) * vy) / vv : 0;
			t2 = Math.max(0, Math.min(1, t2));
			const qx = A[0] + t2 * vx - P[0], qy = A[1] + t2 * vy - P[1];
			const d2 = qx * qx + qy * qy;
			if (d2 < best.d2) best = { d2, arc: refArcs[i] + Math.sqrt(vv) * t2 };
		}
		return { dist: Math.sqrt(best.d2), frac: refTotal ? best.arc / refTotal : 0 };
	}

	function applyWarp(coords, warp, ref) {
		if (!coords || coords.length < 3) return coords;
		const refArcs = [0];
		for (let i = 1; i < ref.length; i++) refArcs.push(refArcs[i - 1] + distanceM(ref[i - 1], ref[i]));
		const refTotal = refArcs[refArcs.length - 1];
		// arcos propios, para ATENUAR el campo junto a los extremos clavados del
		// RECEPTOR: sus extremos no coinciden con los del líder (mitades @@1/@@2),
		// y sin la rampa el vértice pegado al empalme recibía metros de campo con
		// su extremo quieto — un muñón de centímetros girado 40°.
		const own = [0];
		for (let i = 1; i < coords.length; i++) own.push(own[i - 1] + distanceM(coords[i - 1], coords[i]));
		const total = own[own.length - 1];
		const RAMPA = 15;
		const out = [coords[0].slice()];
		for (let i = 1; i < coords.length; i++) {
			if (i === coords.length - 1) { out.push(coords[i].slice()); break; }
			const nr = nearestOnRef(ref, refArcs, refTotal, coords[i]);
			let w = 1;
			if (nr.dist > 25) w = Math.max(0, 1 - (nr.dist - 25) / 15);
			w = Math.min(w, own[i] / RAMPA, (total - own[i]) / RAMPA, 1);
			if (w <= 0) { out.push(coords[i].slice()); continue; }
			const dv = warp(nr.frac);
			const F = localFrame(coords[i]);
			const v = F.to(coords[i]);
			out.push(roundCoord(F.from([v[0] + dv[0] * w, v[1] + dv[1] * w])));
		}
		// sin muñones: fuera vértices interiores a <0,5 m de un extremo clavado
		while (out.length > 2 && distanceM(out[0], out[1]) < 0.5) out.splice(1, 1);
		while (out.length > 2 && distanceM(out[out.length - 2], out[out.length - 1]) < 0.5) out.splice(out.length - 2, 1);
		return out;
	}

	// Corrige la curvatura de un grupo COMO PAREJA: el carril con más
	// violaciones manda, su campo de desplazamiento se aplica por fracción de
	// arco al resto de carriles y al centerLine, y después cada carril liquida
	// su residuo con media correa. Extremos clavados y tangentes restringidas.
	function fixCurvatureGroup(g, railsIn, minRadius, leashM) {
		const rails = railsIn.filter((t) => t.coords && t.coords.length >= 2);
		if (!rails.length) return { ok: false, reason: { code: "noRails" } };
		const origs = new Map(rails.map((t) => [t.id, t.coords.map((c) => c.slice())]));
		const clOrig = g.centerLine ? g.centerLine.map((c) => c.slice()) : null;
		const undo = () => {
			for (const t of rails) { t.coords = origs.get(t.id).map((c) => c.slice()); t.length = lineLength(t.coords); }
			if (clOrig) g.centerLine = clOrig.map((c) => c.slice());
		};

		const orden = [...rails].sort((a, b) =>
			curvatureViolations(b.coords, minRadius).length - curvatureViolations(a.coords, minRadius).length);
		let maxMoved = 0;

		for (let ronda = 0; ronda < orden.length; ronda++) {
			const lider = orden[ronda];
			if (!curvatureViolations(lider.coords, minRadius).length) continue;
			const antes = lider.coords.map((c) => c.slice());
			const res = fixCurvature(lider.coords, minRadius, ronda === 0 ? leashM : leashM / 2);
			if (!res.coords) { undo(); return { ok: false, reason: res.reason }; }
			if (res.moved > maxMoved) maxMoved = res.moved;
			lider.coords = res.coords;
			lider.length = lineLength(res.coords);
			if (!res.changed) continue;
			// Micro-arreglo (centímetros, sin vértices quitados): propagarlo con el
			// warp perturba al gemelo más de lo que corrige — los radios al filo
			// (24,9 vs 25) se re-rompen con desplazamientos de 1 cm. El gemelo no
			// pierde paralelismo apreciable por 9 cm.
			if (res.moved < 0.5 && !res.removed) continue;
			const warp = buildWarp(antes, res.coords, res.idxMap);
			for (const otro of rails) {
				if (otro.id === lider.id) continue;
				otro.coords = applyWarp(otro.coords, warp, antes);
				otro.length = lineLength(otro.coords);
			}
			if (g.centerLine && g.centerLine.length > 2) g.centerLine = applyWarp(g.centerLine, warp, antes);
		}

		// Pulido final: los residuos que el warp haya reabierto se liquidan por
		// vía, SIN propagar (correa corta: son perturbaciones de centímetros).
		for (const t of rails) {
			if (!curvatureViolations(t.coords, minRadius).length) continue;
			const fino = fixCurvature(t.coords, minRadius, Math.min(2, leashM / 4));
			if (fino.coords) { t.coords = fino.coords; t.length = lineLength(t.coords); if (fino.moved > maxMoved) maxMoved = fino.moved; }
		}

		for (const t of rails) {
			if (curvatureViolations(t.coords, minRadius).length) {
				undo();
				return { ok: false, reason: { code: "stillBelow", count: curvatureViolations(t.coords, minRadius).length } };
			}
			if (countFolds(t.coords) > countFolds(origs.get(t.id))) { undo(); return { ok: false, reason: { code: "stillBelow", count: 1 } }; }
		}
		if (g.centerLine && countFolds(g.centerLine) > (clOrig ? countFolds(clOrig) : 0)) { undo(); return { ok: false, reason: { code: "stillBelow", count: 1 } }; }
		return { ok: true, moved: maxMoved };
	}

	// Pendientes: problema 1-D sobre la cadena ORIENTADA de nodos de empalme.
	//
	// Tres reglas que la versión anterior ignoraba (las encontró la revisión):
	//  · path[].reversed — en una vía recorrida a contrasentido la cota de
	//    entrada es endElevation. Leer y escribir sin orientar invertía el
	//    desnivel de esas vías y lo desalineaba de sus empalmes.
	//  · Vías de estación — el límite real del juego al construir un andén no
	//    es maxSlopePercentage: es desnivel ≤ 0,1 m entre sus extremos.
	//  · Nodos que comparten coordenada con vías AJENAS a la cadena (diagonales
	//    de bretelle, la otra línea de un corredor compartido) se CLAVAN:
	//    moverlos dejaría un escalón de cota en una vía que no reescribimos.
	//
	// Y el redondeo final a cm podía devolver un segmento por encima del
	// máximo: se relaja contra un tope con 1,1 cm de margen y se verifica ANTES
	// de escribir nada.
	function fixSlopes(steps, maxSlopePercent, isForeign) {
		if (steps.length < 2) return { changed: false };
		const lens = steps.map((st) => st.t.length || lineLength(st.t.coords || []));
		const entry = (st) => (st.reversed ? st.t.endElevation : st.t.startElevation) || 0;
		const exit = (st) => (st.reversed ? st.t.startElevation : st.t.endElevation) || 0;
		const nodeCoord = (i) => {
			if (i < steps.length) {
				const st = steps[i], c = st.t.coords;
				return st.reversed ? c[c.length - 1] : c[0];
			}
			const st = steps[steps.length - 1], c = st.t.coords;
			return st.reversed ? c[0] : c[c.length - 1];
		};

		const elev = steps.map(entry); elev.push(exit(steps[steps.length - 1]));

		const MARGEN = 0.011;   // dos extremos redondeados a ±0,005 m
		const allowed = steps.map((st, i) => {
			const porPendiente = maxSlopePercent / 100 * lens[i];
			return Math.max(0, (st.isStation ? Math.min(porPendiente, 0.1) : porPendiente) - MARGEN);
		});

		const pinned = elev.map((_, i) => i === 0 || i === elev.length - 1 || isForeign(coordKey(nodeCoord(i))));

		// Factibilidad por sub-cadena entre nodos clavados.
		let a = 0;
		while (a < elev.length - 1) {
			let b = a + 1;
			while (b < elev.length - 1 && !pinned[b]) b++;
			let cap = 0;
			for (let i = a; i < b; i++) cap += allowed[i];
			const drop = Math.abs(elev[b] - elev[a]);
			if (drop > cap + 1e-9) {
				return { changed: false, reason: { code: "slopeImpossible",
					drop: Math.round(drop * 100) / 100, length: Math.round(cap * 100) / 100, max: maxSlopePercent } };
			}
			a = b;
		}

		let touched = false;
		for (let pass = 0; pass < 400; pass++) {
			let worst = -1, worstExcess = 0;
			for (let i = 0; i < steps.length; i++) {
				const ex = Math.abs(elev[i + 1] - elev[i]) - allowed[i];
				if (ex > 1e-9 && ex > worstExcess) { worst = i; worstExcess = ex; }
			}
			if (worst < 0) break;
			const sign = Math.sign(elev[worst + 1] - elev[worst]);
			const canLow = !pinned[worst], canHigh = !pinned[worst + 1];
			if (!canLow && !canHigh) return { changed: false, reason: { code: "slopeBetweenFixed" } };
			const share = worstExcess / ((canLow ? 1 : 0) + (canHigh ? 1 : 0));
			if (canLow) elev[worst] += sign * share;
			if (canHigh) elev[worst + 1] -= sign * share;
			touched = true;
		}

		// Verificación final ANTES de escribir: si tras 400 pasadas queda algo,
		// no se toca ninguna cota.
		for (let i = 0; i < steps.length; i++) {
			if (Math.abs(elev[i + 1] - elev[i]) - allowed[i] > 1e-9) {
				return { changed: false, reason: { code: "stillSteep" } };
			}
		}

		if (touched) {
			for (let i = 0; i < steps.length; i++) {
				const st = steps[i];
				const eIn = Math.round(elev[i] * 100) / 100, eOut = Math.round(elev[i + 1] * 100) / 100;
				if (st.reversed) { st.t.endElevation = eIn; st.t.startElevation = eOut; }
				else { st.t.startElevation = eIn; st.t.endElevation = eOut; }
			}
		}
		return { changed: touched };
	}

	// -------------------------------------------------------------------------
	// ANDENES
	//
	// El andén es el centerLine del grupo de estación (recto de 2 puntos en 69
	// de las 88 estaciones de Sevilla; curvo o quad en el resto). Los carriles
	// son ese eje desplazado lateralmente y partidos por la mitad en @@1/@@2, y
	// los stNodes se indexan por ESE punto de partición.
	//
	// Se redimensiona SIMÉTRICAMENTE y POR LONGITUD DE ARCO: al alargar, cada
	// carril ABSORBE trazado del vecino que lo continúa (re-partir el corte en
	// otro punto del arco, sin inventar geometría); al acortar, le CEDE el
	// sobrante. Los vértices interiores de eje y carriles no se tocan, así que
	// las formas curvas se conservan y el punto de partición — donde anclan
	// stNodes, señales de estación y station.coords — queda intacto.
	//
	// Los extremos exteriores los comparten además las diagonales de la
	// bretelle automática: se REANCLAN recortando lo rebasado, nunca
	// reasignando el vértice a secas — eso plegaba la diagonal en una horquilla
	// de ~180° que ni el juego ni la réplica de turnRadius pueden ver (segmento
	// < 1 m ⇒ null). El guard de aceptación cuenta horquillas aparte, con el
	// umbral DIRECTION_FLIP_MAX_TURN=120° del pathfinder y SIN descartar
	// segmentos cortos. Si el vecino no puede absorber/heredar sin romperse, se
	// recorta la extensión hasta donde sí quepa y se informa.
	// -------------------------------------------------------------------------

	function coordCounts(tracks) {
		const m = new Map();
		for (const t of tracks) {
			for (const c of [t.coords[0], t.coords[t.coords.length - 1]]) {
				const k = coordKey(c);
				m.set(k, (m.get(k) || 0) + 1);
			}
		}
		return m;
	}

	// Longitud objetivo: siempre el máximo del tipo destino; solo se recorta
	// cuando el andén actual lo supera. Nunca por debajo del mínimo.
	function targetPlatformLength(currentLength, type) {
		const max = type.stats.maxStationLength, min = type.stats.minStationLength;
		if (currentLength > max) return max;
		return Math.max(min, max);
	}

	// OJO: aquí NO se usa la correa de curvatura. Esa correa acota la desviación
	// LATERAL del trazado; mover el corte a lo largo del propio arco no es
	// salirse de sitio. Los límites reales son otros: el maxStationLength del
	// tipo, lo que el vecino pueda ceder o heredar, y el tope explícito.

	// ---- utilidades de polilínea por longitud de arco -----------------------

	// Punto a d metros del extremo endIdx (0 o último), siguiendo el trazado.
	function walkFromEnd(coords, endIdx, d) {
		const orient = endIdx === 0 ? coords : [...coords].reverse();
		let acc = 0;
		for (let i = 0; i < orient.length - 1; i++) {
			const seg = distanceM(orient[i], orient[i + 1]);
			if (acc + seg >= d) {
				const f = seg < 1e-9 ? 0 : (d - acc) / seg;
				return {
					point: roundCoord([
						orient[i][0] + (orient[i + 1][0] - orient[i][0]) * f,
						orient[i][1] + (orient[i + 1][1] - orient[i][1]) * f
					]),
					index: i
				};
			}
			acc += seg;
		}
		return null;
	}

	// Recorta d metros del extremo endIdx conservando el resto del trazado.
	function cutFromEnd(coords, endIdx, d) {
		const w = walkFromEnd(coords, endIdx, d);
		if (!w) return null;
		const orient = endIdx === 0 ? coords : [...coords].reverse();
		// 0,5 m, no 0,05: un vértice a centímetros del corte es un muñón que
		// define rumbo para el pathfinder y giraba empalmes hasta 40°.
		const rest = [w.point, ...orient.slice(w.index + 1).filter((c) => distanceM(c, w.point) > 0.5)];
		if (rest.length < 2) return null;
		return endIdx === 0 ? rest : rest.reverse();
	}

	// La pieza de d metros pegada al extremo endIdx, ordenada desde el extremo
	// hacia el corte: piece[0] = extremo original, piece[último] = corte.
	function pieceFromEnd(coords, endIdx, d) {
		const w = walkFromEnd(coords, endIdx, d);
		if (!w) return null;
		const orient = endIdx === 0 ? coords : [...coords].reverse();
		const piece = orient.slice(0, w.index + 1).filter((c) => distanceM(c, w.point) > 0.5);
		piece.push(w.point);
		return piece.length >= 2 ? piece : null;
	}

	// Horquillas: deflexiones > 120° entre segmentos consecutivos. 120 es el
	// DIRECTION_FLIP_MAX_TURN del pathfinder del juego: de ahí en adelante trata
	// la entrada como retroceso. A diferencia de turnRadius, aquí NO se
	// descartan los segmentos < 1 m — esa ceguera es la que dejó pasar los
	// pliegues que detectó la revisión (32 vías plegadas en T1→ML).
	function countFolds(coords) {
		let n = 0;
		for (let i = 0; i + 2 < coords.length; i++) {
			const d1 = distanceM(coords[i], coords[i + 1]), d2 = distanceM(coords[i + 1], coords[i + 2]);
			if (d1 < 0.05 || d2 < 0.05) continue;
			let diff = Math.abs(bearingDeg(coords[i + 1], coords[i + 2]) - bearingDeg(coords[i], coords[i + 1]));
			if (diff > 180) diff = 360 - diff;
			if (diff > 120) n++;
		}
		return n;
	}

	// Reancla el extremo endIdx en newCoord sin dejar horquilla: los vértices de
	// la cabeza que el desplazamiento rebasa se recortan.
	function reAnchor(coords, endIdx, newCoord) {
		const orient = endIdx === 0 ? coords.map((c) => c.slice()) : [...coords].reverse().map((c) => c.slice());
		orient[0] = newCoord;
		while (orient.length > 2) {
			const d1 = distanceM(orient[0], orient[1]);
			let diff = Math.abs(bearingDeg(orient[1], orient[2]) - bearingDeg(orient[0], orient[1]));
			if (diff > 180) diff = 360 - diff;
			if (d1 < 0.5 || diff > 120) orient.splice(1, 1);
			else break;
		}
		if (orient.length < 2 || lineLength(orient) < 1) return null;
		return endIdx === 0 ? orient : orient.reverse();
	}

	// Corta el tramo [fromM, toM] (por longitud de arco) de una polilínea.
	function slicePolyline(coords, fromM, toM) {
		const total = lineLength(coords);
		if (fromM < -1e-9 || toM > total + 1e-9 || toM - fromM < 0.05) return null;
		const a = walkFromEnd(coords, 0, Math.max(0, fromM));
		const b = walkFromEnd(coords, 0, Math.min(total, toM));
		if (!a || !b) return null;
		const mid = coords.slice(a.index + 1, b.index + 1)
			.filter((c) => distanceM(c, a.point) > 0.5 && distanceM(c, b.point) > 0.5);
		const out = [a.point, ...mid, b.point];
		return out.length >= 2 ? out : null;
	}

	// Redimensiona el andén DESLIZANDO LA CADENA del corredor: al alargar, el
	// carril absorbe arco y cada vía que continúa (ventanas de bretelle
	// incluidas) CONSERVA su longitud y se desliza; solo la primera vía "llana"
	// más allá (fuera de grupos scissors) cede el resto. Al acortar, lo mismo
	// hacia dentro. Así las bretelles no se comen ni se estiran: sus diagonales
	// se regeneran después a partir de los corners nuevos (regenerateCrossovers),
	// y los centerLine de los grupos se deslizan con la misma mecánica para que
	// la adyacencia por igualdad exacta de extremos no se rompa.
	function resizePlatform(data, station, targetType, opts) {
		const maxExtend = (opts && typeof opts.maxExtendM === "number") ? opts.maxExtendM : Infinity;
		const trackById = new Map((data.tracks || []).map((t) => [t.id, t]));
		const group = (data.trackGroups || []).find((g) => g.id === station.trackGroupId);
		if (!group || !group.centerLine || group.centerLine.length < 2) {
			return { ok: false, reason: { code: "noCenterLine" } };
		}

		const current = lineLength(group.centerLine);
		const wanted = targetPlatformLength(current, targetType);
		let delta = wanted - current;
		if (Math.abs(delta) < 0.01) { delete station.maxCars; return { ok: true, changed: false, length: current }; }
		if (Math.abs(delta) > maxExtend) delta = Math.sign(delta) * maxExtend;

		const rails = (group.trackIds || []).map((id) => trackById.get(id)).filter(Boolean);
		if (!rails.length) { delete station.maxCars; return { ok: false, reason: { code: "noRails" } }; }

		const counts = coordCounts(rails);
		const outer = [];
		for (const t of rails) {
			for (const idx of [0, t.coords.length - 1]) {
				if (counts.get(coordKey(t.coords[idx])) === 1) outer.push({ track: t, idx, coord: t.coords[idx] });
			}
		}
		if (outer.length !== rails.length) {
			return { ok: false, reason: { code: "badTopology", outer: outer.length, rails: rails.length } };
		}

		// Índices globales sobre el estado PRÍSTINO (cada apply parte de él).
		const endIndex = new Map();
		for (const t of data.tracks || []) {
			if (!t.coords || t.coords.length < 2) continue;
			for (const idx of [0, t.coords.length - 1]) {
				const k = coordKey(t.coords[idx]);
				if (!endIndex.has(k)) endIndex.set(k, []);
				endIndex.get(k).push({ t, idx });
			}
		}
		const groupOf = new Map();
		for (const g of data.trackGroups || []) for (const id of g.trackIds || []) groupOf.set(id, g);
		const isDiag = (t) => t.type === "scissors-crossover";
		const isStationTrack = (t) => t.type === "station" || t.type === "express-station";
		const inScissors = (t) => { const g = groupOf.get(t.id); return !!g && g.type === "scissors-crossover"; };
		// Solo las bretelles parallel (2 carriles + 2 diagonales) se pueden
		// regenerar con certeza; las quad dependen del cursor de construcción
		// (investigación, incógnita 2) y sus diagonales se REANCLAN en su lugar.
		const regenerable = new Set();
		for (const g of data.trackGroups || []) {
			if (g.type !== "scissors-crossover") continue;
			const objs = (g.trackIds || []).map((id) => trackById.get(id)).filter(Boolean);
			if (objs.filter((t) => t.type !== "scissors-crossover").length === 2 &&
				objs.filter((t) => t.type === "scissors-crossover").length === 2) regenerable.add(g.id);
		}
		const stationMinR = targetType.stats.minStationTurnRadius || targetType.stats.minTurnRadius;
		const minRFor = (t) => (isStationTrack(t) ? stationMinR : targetType.stats.minTurnRadius);

		// Deshacer perezoso + líneas base del criterio de NO EMPEORAR.
		const undoT = new Map(), undoG = new Map(), curvBase = new Map(), foldBase = new Map();
		let slidScissors = new Set();
		const touchT = (t) => {
			if (undoT.has(t.id)) return;
			undoT.set(t.id, { t, coords: t.coords.map((c) => c.slice()), length: t.length });
			curvBase.set(t.id, curvatureViolations(t.coords, minRFor(t)).length);
			foldBase.set(t.id, countFolds(t.coords));
		};
		const touchG = (g) => { if (!undoG.has(g.id)) undoG.set(g.id, { g, cl: g.centerLine.map((c) => c.slice()) }); };
		const rollback = () => {
			for (const u of undoT.values()) { u.t.coords = u.coords.map((c) => c.slice()); u.t.length = u.length; }
			for (const u of undoG.values()) { u.g.centerLine = u.cl.map((c) => c.slice()); }
			undoT.clear(); undoG.clear(); curvBase.clear(); foldBase.clear(); slidScissors = new Set();
		};

		const orient = (t, idx) => (idx === 0 ? t.coords.map((c) => c.slice()) : [...t.coords].reverse().map((c) => c.slice()));
		const deOrient = (coords, idx) => (idx === 0 ? coords : [...coords].reverse());

		function contAt(coord, brOut, excl) {
			let best = null, bestDiff = 30;
			for (const cand of endIndex.get(coordKey(coord)) || []) {
				if (excl.has(cand.t.id) || isDiag(cand.t)) continue;
				const c = cand.t.coords;
				const nx = cand.idx === 0 ? c[1] : c[c.length - 2];
				let diff = Math.abs(bearingDeg(coord, nx) - brOut);
				if (diff > 180) diff = 360 - diff;
				if (diff < bestDiff) { bestDiff = diff; best = cand; }
			}
			return best;
		}

		let maxReanchorM = 0;

		function apply(d) {
			rollback();
			const T = (opts && opts.trace) ? ((m) => console.log("[resize]", m, "d=", Math.round(d*10)/10)) : (() => {});
			maxReanchorM = 0;
			const slidTracks = new Set();
			const half = Math.abs(d) / 2;
			const clBase = group.centerLine.map((c) => c.slice());
			const newCornerByKey = new Map();
			const claimed = new Set(rails.map((r) => r.id));

			// ---- 1) carriles: deslizar la cadena de cada extremo exterior
			for (const o of outer) {
				const t = o.track;
				const inner = o.idx === 0 ? t.coords[1] : t.coords[t.coords.length - 2];
				const brOut = bearingDeg(inner, o.coord);

				const chain = [];
				let lastFound = false;
				{
					let coord = o.coord, br = brOut;
					const excl = new Set(claimed);
					for (let hop = 0; hop < 40; hop++) {
						const nx = contAt(coord, br, excl);
						if (!nx || isStationTrack(nx.t)) break;
						chain.push(nx);
						excl.add(nx.t.id);
						const oc = orient(nx.t, nx.idx);
						coord = oc[oc.length - 1];
						br = bearingDeg(oc[oc.length - 2], oc[oc.length - 1]);
						const lenNx = nx.t.length || lineLength(nx.t.coords);
						if (!inScissors(nx.t) && (d < 0 || lenNx >= half + 10)) { lastFound = true; break; }
					}
				}

				let corner = null;

				if (chain.length && lastFound) {
					for (const s2 of chain) claimed.add(s2.t.id);
					const oriented = chain.map((s2) => orient(s2.t, s2.idx));
					const lens = oriented.map((oc) => lineLength(oc));
					let corridor, acc;

					if (d > 0) {
						corridor = [o.coord.slice()];
						for (const oc of oriented) corridor.push(...oc.slice(1));
						const total = lineLength(corridor);
						if (half + 10 > total) { T(1); return false; }
						const gan = slicePolyline(corridor, 0, half);
						if (!gan) { T(2); return false; }
						corner = gan[gan.length - 1];
						touchT(t);
						if (o.idx === 0) t.coords = [...[...gan].reverse().slice(0, -1), ...t.coords];
						else t.coords = [...t.coords, ...gan.slice(1)];
						t.length = lineLength(t.coords);
						acc = half;
						for (let k = 0; k < chain.length; k++) {
							const to = k === chain.length - 1 ? total : acc + lens[k];
							const nc = slicePolyline(corridor, acc, to);
							if (!nc || (k === chain.length - 1 && lineLength(nc) < 10)) { T(3); return false; }
							touchT(chain[k].t);
							slidTracks.add(chain[k].t.id);
							chain[k].t.coords = deOrient(nc, chain[k].idx);
							chain[k].t.length = lineLength(chain[k].t.coords);
							if (inScissors(chain[k].t)) slidScissors.add(groupOf.get(chain[k].t.id).id);
							acc = to;
						}
					} else {
						const piece = pieceFromEnd(t.coords, o.idx, half);
						const rest = cutFromEnd(t.coords, o.idx, half);
						if (!piece || !rest || lineLength(rest) < 1) { T(4); return false; }
						corner = piece[piece.length - 1];
						corridor = [...piece].reverse();
						for (const oc of oriented) corridor.push(...oc.slice(1));
						const total = lineLength(corridor);
						touchT(t);
						t.coords = rest; t.length = lineLength(rest);
						acc = 0;
						for (let k = 0; k < chain.length; k++) {
							const to = k === chain.length - 1 ? total : acc + lens[k];
							const nc = slicePolyline(corridor, acc, to);
							if (!nc) { T(5); return false; }
							touchT(chain[k].t);
							slidTracks.add(chain[k].t.id);
							chain[k].t.coords = deOrient(nc, chain[k].idx);
							chain[k].t.length = lineLength(chain[k].t.coords);
							if (inScissors(chain[k].t)) slidScissors.add(groupOf.get(chain[k].t.id).id);
							acc = to;
						}
					}

					// Empalmes desplazados: reanclar lo que cuelga de ellos. Las
					// diagonales de bretelle no se reanclan: se regeneran después.
					let accOld = 0;
					for (let k = 0; k < chain.length; k++) {
						const oldArc = d > 0 ? accOld : half + accOld;
						const newArc = d > 0 ? half + accOld : accOld;
						const wOld = walkFromEnd(corridor, 0, oldArc), wNew = walkFromEnd(corridor, 0, newArc);
						if (!wOld || !wNew) { T(6); return false; }
						for (const cand of endIndex.get(coordKey(wOld.point)) || []) {
							if (claimed.has(cand.t.id)) continue;
							if (isDiag(cand.t)) {
								const g2 = groupOf.get(cand.t.id);
								if (g2 && regenerable.has(g2.id)) { slidScissors.add(g2.id); continue; }
								// quad: no hay regeneración fiable; se reancla como una vía más
							}
							touchT(cand.t);
							// cand.idx viene del índice PRÍSTINO y esta vía puede haber
							// sido reanclada ya en este mismo apply (menos vértices).
							const cc = cand.t.coords;
							const idxNow = (cand.idx < cc.length && coordKey(cc[cand.idx]) === coordKey(wOld.point)) ? cand.idx
								: (coordKey(cc[0]) === coordKey(wOld.point) ? 0 : cc.length - 1);
							if (coordKey(cc[idxNow]) !== coordKey(wOld.point)) continue;   // ya movida por otro empalme
							const moved = distanceM(cc[idxNow], wNew.point);
							const re = reAnchor(cand.t.coords, idxNow, wNew.point);
							if (!re) { T(7); return false; }
							if (moved > maxReanchorM) maxReanchorM = moved;
							cand.t.coords = re; cand.t.length = lineLength(re);
						}
						accOld += lens[k];
					}
					newCornerByKey.set(coordKey(o.coord), corner);
				} else if (d < 0 && !(endIndex.get(coordKey(o.coord)) || []).some((cand) => !claimed.has(cand.t.id))) {
					// Fin de línea al ACORTAR: el sobrante no tiene destino porque no
					// hay nada más allá — se corta y ya (una terminal que encoge).
					const rest = cutFromEnd(t.coords, o.idx, half);
					if (!rest || lineLength(rest) < 1) { T(8); return false; }
					corner = rest[o.idx === 0 ? 0 : rest.length - 1];
					touchT(t);
					t.coords = rest; t.length = lineLength(rest);
					newCornerByKey.set(coordKey(o.coord), corner);
				} else if (d > 0) {
					// Fin de línea: tangente (fuera no hay nada que plegar).
					touchT(t);
					corner = roundCoord(destination(o.coord, half, brOut));
					if (o.idx === 0) t.coords = [corner, ...t.coords]; else t.coords = [...t.coords, corner];
					t.length = lineLength(t.coords);
					newCornerByKey.set(coordKey(o.coord), corner);
					for (const cand of endIndex.get(coordKey(o.coord)) || []) {
						if (claimed.has(cand.t.id)) continue;
						if (isDiag(cand.t)) {
							const g2 = groupOf.get(cand.t.id);
							if (g2 && regenerable.has(g2.id)) { slidScissors.add(g2.id); continue; }
						}
						touchT(cand.t);
						const cc = cand.t.coords;
						const idxNow = (cand.idx < cc.length && coordKey(cc[cand.idx]) === coordKey(o.coord)) ? cand.idx
							: (coordKey(cc[0]) === coordKey(o.coord) ? 0 : cc.length - 1);
						if (coordKey(cc[idxNow]) !== coordKey(o.coord)) continue;
						const moved = distanceM(cc[idxNow], corner);
						const re = reAnchor(cc, idxNow, corner);
						if (!re) { T(9); return false; }
						if (moved > maxReanchorM) maxReanchorM = moved;
						cand.t.coords = re; cand.t.length = lineLength(re);
					}
				} else {
					{ T(10); return false; }
				}
			}

			// ---- 2) ejes de grupo, con la misma mecánica de cadena
			const sideOfOuter = (o) =>
				distanceM(o.coord, clBase[0]) <= distanceM(o.coord, clBase[clBase.length - 1]) ? 0 : 1;
			touchG(group);
			let newCl = clBase.map((c) => c.slice());
			for (const sd of [0, 1]) {
				const endCoord = sd === 0 ? clBase[0] : clBase[clBase.length - 1];
				const chainG = [];
				let lastG = false;
				{
					let coord = endCoord;
					const gExcl = new Set([group.id]);
					for (let hop = 0; hop < 40; hop++) {
						let nx = null;
						for (const g2 of data.trackGroups || []) {
							if (gExcl.has(g2.id) || !g2.centerLine || g2.centerLine.length < 2) continue;
							if (coordKey(g2.centerLine[0]) === coordKey(coord)) { nx = { g: g2, idx: 0 }; break; }
							if (coordKey(g2.centerLine[g2.centerLine.length - 1]) === coordKey(coord)) { nx = { g: g2, idx: 1 }; break; }
						}
						if (!nx || nx.g.type === "station") break;
						chainG.push(nx); gExcl.add(nx.g.id);
						const oc = nx.idx === 0 ? nx.g.centerLine : [...nx.g.centerLine].reverse();
						coord = oc[oc.length - 1];
						const lenG = lineLength(nx.g.centerLine);
						if (nx.g.type !== "scissors-crossover" && (d < 0 || lenG >= half + 1)) { lastG = true; break; }
					}
				}
				if (chainG.length && lastG) {
					const orientedG = chainG.map((s2) => (s2.idx === 0 ? s2.g.centerLine.map((c) => c.slice()) : [...s2.g.centerLine].reverse().map((c) => c.slice())));
					const lensG = orientedG.map((oc) => lineLength(oc));
					let corridorG, acc;
					if (d > 0) {
						corridorG = [endCoord.slice()];
						for (const oc of orientedG) corridorG.push(...oc.slice(1));
						const totalG = lineLength(corridorG);
						if (half + 0.5 > totalG) { T(11); return false; }
						const ext = slicePolyline(corridorG, 0, half);
						if (!ext) { T(12); return false; }
						newCl = sd === 0 ? [...[...ext].reverse().slice(0, -1), ...newCl] : [...newCl, ...ext.slice(1)];
						acc = half;
					} else {
						const piece = pieceFromEnd(newCl, sd === 0 ? 0 : newCl.length - 1, half);
						const rest = cutFromEnd(newCl, sd === 0 ? 0 : newCl.length - 1, half);
						if (!piece || !rest) { T(13); return false; }
						newCl = rest;
						corridorG = [...piece].reverse();
						for (const oc of orientedG) corridorG.push(...oc.slice(1));
						acc = 0;
					}
					const totalG = lineLength(corridorG);
					for (let k = 0; k < chainG.length; k++) {
						const to = k === chainG.length - 1 ? totalG : acc + lensG[k];
						const nc = slicePolyline(corridorG, acc, to);
						if (!nc) { T(14); return false; }
						touchG(chainG[k].g);
						chainG[k].g.centerLine = chainG[k].idx === 0 ? nc : [...nc].reverse();
						acc = to;
					}
				} else if (d > 0) {
					const corners = outer.filter((o) => sideOfOuter(o) === sd)
						.map((o) => newCornerByKey.get(coordKey(o.coord))).filter(Boolean);
					if (!corners.length) { T(15); return false; }
					const mid = corners.length === 2
						? roundCoord([(corners[0][0] + corners[1][0]) / 2, (corners[0][1] + corners[1][1]) / 2])
						: corners[0];
					newCl = sd === 0 ? [mid, ...newCl] : [...newCl, mid];
				} else {
					// Acortar en fin de línea: si ningún grupo casa con este extremo,
					// el eje simplemente se corta.
					const hayAdyacente = (data.trackGroups || []).some((g2) => g2.id !== group.id &&
						g2.centerLine && g2.centerLine.length > 1 &&
						(coordKey(g2.centerLine[0]) === coordKey(endCoord) ||
						 coordKey(g2.centerLine[g2.centerLine.length - 1]) === coordKey(endCoord)));
					if (hayAdyacente) { T(16); return false; }
					const rest = cutFromEnd(newCl, sd === 0 ? 0 : newCl.length - 1, half);
					if (!rest) { T(17); return false; }
					newCl = rest;
				}
			}
			group.centerLine = newCl;

			// ---- 3) aceptación: sin horquillas nuevas, curvatura no peor,
			// longitudes legales. Las diagonales quedan fuera: se regeneran.
			if (countFolds(group.centerLine) > 0) { T(18); return false; }
			for (const u of undoT.values()) {
				const t2 = u.t;
				if (isDiag(t2)) continue;
				if (countFolds(t2.coords) > (foldBase.get(t2.id) || 0)) { T(19); return false; }
				// Las deslizadas re-particionan el mismo corredor: su recuento de
				// curvatura por vía baila sin cambio real; carriles y reancladas sí
				// responden del suyo.
				if (!slidTracks.has(t2.id) &&
					curvatureViolations(t2.coords, minRFor(t2)).length > (curvBase.get(t2.id) || 0)) { T(20); return false; }
				// Mínimo de longitud con LÍNEA BASE: la partida trae conectores de
				// 4-7 m junto a las bretelles (a6709481: 4,2 m) que ya nacen por
				// debajo del MIN_TRACK_LENGTH del juego. Solo es fallo ENCOGER una
				// vía por debajo de 10 m, no tocar una que ya era corta.
				const lenMin = rails.some((r) => r.id === t2.id) ? 1 : 10;
				if (t2.length < lenMin && t2.length < u.length - 0.5) { T("21 corto: " + t2.id.slice(0, 10) + " " + t2.length.toFixed(2) + "m (base " + u.length.toFixed(2) + ")"); return false; }
			}
			return true;
		}

		let applied = delta;
		if (!apply(delta)) {
			let lo = 0, hi = delta;
			for (let i = 0; i < 24; i++) {
				const mid = (lo + hi) / 2;
				if (apply(mid)) lo = mid; else hi = mid;
			}
			applied = lo;
			if (Math.abs(applied) < 0.01 || !apply(lo)) { rollback(); applied = 0; }
		}

		const finalLen = lineLength(group.centerLine);
		delete station.maxCars;

		return {
			ok: true,
			changed: Math.abs(applied) > 0.01,
			from: current,
			length: finalLen,
			wanted: wanted,
			capped: Math.abs(applied - delta) > 0.01,
			touched: undoT.size,
			slidScissors: [...slidScissors],
			maxReanchorM: Math.round(maxReanchorM * 10) / 10
		};
	}

	// -------------------------------------------------------------------------
	// BRETELLES (scissors crossovers)
	//
	// Réplica exacta de la generación del juego, verificada por la investigación
	// contra las 162 bretelles de la partida real con error 0,000000 m:
	//  · La geometría de cada diagonal depende SOLO de las 4 esquinas de los dos
	//    carriles del grupo (getTrackCorners): bezier CÚBICO en lon/lat con
	//    controles a D/2 sobre el interiorBearing de cada esquina, n+1 muestras
	//    (26 para una pareja paralela), redondeado a 6 decimales al guardar y
	//    con length medido sobre las coords CRUDAS.
	//  · Las señales scissors NO llevan ventanas numéricas: solo coords (punto
	//    medio del carril paralelo, no de la diagonal) y signalTracks por id.
	//  · Regenerar tras mover un andén = re-derivar de las esquinas nuevas.
	//    Mismos ids, mismos signalTracks: solo cambian coords/length/elevaciones
	//    de las 2 diagonales y las coords de las 2 señales.
	// -------------------------------------------------------------------------

	function normalizeBearing(b) { let x = b % 360; if (x > 180) x -= 360; else if (x < -180) x += 360; return x; }
	function reverseBearing(b) { return normalizeBearing(b + 180); }

	function lineMidpoint(coords) {
		const w = walkFromEnd(coords, 0, lineLength(coords) / 2);
		return w ? w.point : roundCoord(coords[0]);
	}

	// GameMain:75880 — número de muestras del bezier (emite n+1 puntos).
	function bezierSamples(b1, b2, directo) {
		const x1 = b1 !== null ? normalizeBearing(b1) : directo;
		const x2 = b2 !== null ? normalizeBearing(b2) : directo;
		let diff = Math.abs(x2 - x1); if (diff > 180) diff = 360 - diff;
		let out = 3;
		if (diff <= 30) out += Math.ceil(diff / 10) * 2;
		else { out += 6; out += Math.ceil((diff - 30) / 10) * 3; }
		if (b1 !== null && b2 !== null) out += 20;
		return out;
	}

	// GameMain:75835, rama cúbica (la única que usan las bretelles).
	function cubicTrackCoords(startCoords, endCoords, startBearing, endBearing) {
		if (distanceM(startCoords, endCoords) < 1) return [startCoords, endCoords];
		const directo = bearingDeg(startCoords, endCoords);
		const nPts = bezierSamples(startBearing, endBearing, directo);
		const half = distanceM(startCoords, endCoords) / 2;
		const C1 = destination(startCoords, half, startBearing);
		const C2 = destination(endCoords, half, reverseBearing(endBearing));
		const out = [];
		for (let i = 0; i <= nPts; i++) {
			const tt = i / nPts, u = 1 - tt, u2 = u * u, u3 = u2 * u, t2 = tt * tt, t3 = t2 * tt;
			out.push([
				u3 * startCoords[0] + 3 * u2 * tt * C1[0] + 3 * u * t2 * C2[0] + t3 * endCoords[0],
				u3 * startCoords[1] + 3 * u2 * tt * C1[1] + 3 * u * t2 * C2[1] + t3 * endCoords[1]
			]);
		}
		return out;
	}

	// GameMain:76116 — esquinas de un carril: extremos + rumbo hacia DENTRO.
	function trackCorners(track) {
		const c = track.coords;
		return {
			start: { coords: c[0], interiorBearing: bearingDeg(c[0], c[1]), elevation: track.startElevation || 0 },
			end: { coords: c[c.length - 1], interiorBearing: bearingDeg(c[c.length - 1], c[c.length - 2]), elevation: track.endElevation || 0 }
		};
	}

	// GameMain:76127 — el emparejamiento CRUZADO (parece invertido; no lo está).
	function pairCorners(A, B) {
		const dSS = distanceM(A.start.coords, B.start.coords);
		const dSE = distanceM(A.start.coords, B.end.coords);
		return dSS >= dSE ? [[A.start, B.start], [A.end, B.end]] : [[A.start, B.end], [A.end, B.start]];
	}

	// GameMain:76131 — el reverseBearing de endBearing se cancela con el de la
	// rama cúbica: C2 sale sobre el interiorBearing de la esquina destino.
	function crossoverDiagonal(c1, c2) {
		return cubicTrackCoords(c1.coords, c2.coords, c1.interiorBearing, reverseBearing(c2.interiorBearing));
	}

	// Regenera in situ las bretelles de los grupos scissors tocados. Solo cubre
	// la forma parallel (2 carriles + 2 diagonales); quad queda pendiente porque
	// el emparejamiento de carriles del juego ahí depende del cursor y no es
	// reproducible con certeza desde el fichero (investigación, incógnita 2).
	function regenerateCrossovers(data, groupIds, target) {
		const trackById = new Map((data.tracks || []).map((t) => [t.id, t]));
		const out = { regen: 0, quad: 0, invalid: [] };
		for (const g of data.trackGroups || []) {
			if (g.type !== "scissors-crossover" || !groupIds.has(g.id)) continue;
			const objs = (g.trackIds || []).map((id) => trackById.get(id)).filter(Boolean);
			const rails = objs.filter((t) => t.type !== "scissors-crossover");
			const diags = objs.filter((t) => t.type === "scissors-crossover");
			if (rails.length !== 2 || diags.length !== 2) { out.quad++; continue; }

			// rails conserva el orden de trackIds (verificado 131/131); diags[0]
			// arranca en rails[0].coords[0].
			const [p1, p2] = pairCorners(trackCorners(rails[0]), trackCorners(rails[1]));
			const g1 = crossoverDiagonal(p1[0], p1[1]);
			const g2 = crossoverDiagonal(p2[0], p2[1]);
			const malas = curvatureViolations(g1, target.stats.minTurnRadius).length
				+ curvatureViolations(g2, target.stats.minTurnRadius).length;
			const upd = (old, gg, pp) => {
				old.coords = gg.map((c) => roundCoord(c));
				old.length = lineLength(gg);   // el juego mide sobre las coords crudas
				old.startElevation = pp[0].elevation;
				old.endElevation = pp[1].elevation;
			};
			upd(diags[0], g1, p1);
			upd(diags[1], g2, p2);
			out.regen++;
			if (malas > 0) out.invalid.push({ groupId: g.id, violations: malas });

			// Las 2 señales del grupo: coords = punto medio de SU carril. Se
			// emparejan por signalTracks[0].trackId (verificado 324/324).
			for (const sg of data.signals || []) {
				if (sg.type !== "scissors-crossover" || !sg.signalTracks || !sg.signalTracks.length) continue;
				const railId = sg.signalTracks[0].trackId;
				const rail = rails.find((r) => r.id === railId);
				if (rail) sg.coords = lineMidpoint(rail.coords);
			}
		}
		return out;
	}

	// Ensancha la ventana de una bretelle por su lado LEJANO a la estación,
	// deslizando la cadena del corredor igual que resizePlatform: cada vía
	// intermedia conserva su longitud; la primera vía llana más allá cede el
	// arco. Si no lo consigue, lo deja todo intacto y devuelve false.
	// (Duplica a sabiendas la mecánica de resizePlatform: extraerla a un núcleo
	// común es un refactor para cuando las dos estén asentadas.)
	function extendCrossoverWindow(data, group, addM, targetType, trace) {
		const T = trace ? (m) => console.log("[extend]", m) : () => {};
		const trackById = new Map((data.tracks || []).map((t) => [t.id, t]));
		const objs = (group.trackIds || []).map((id) => trackById.get(id)).filter(Boolean);
		const rails = objs.filter((t) => t.type !== "scissors-crossover");
		const diagIds = new Set(objs.filter((t) => t.type === "scissors-crossover").map((t) => t.id));
		if (rails.length !== 2 || !group.centerLine || group.centerLine.length < 2) { T(13); return false; }

		const endIndex = new Map();
		for (const t of data.tracks || []) {
			if (!t.coords || t.coords.length < 2) continue;
			for (const idx of [0, t.coords.length - 1]) {
				const k = coordKey(t.coords[idx]);
				if (!endIndex.has(k)) endIndex.set(k, []);
				endIndex.get(k).push({ t, idx });
			}
		}
		const groupOf = new Map();
		for (const g of data.trackGroups || []) for (const id of g.trackIds || []) groupOf.set(id, g);
		const isDiag = (t) => t.type === "scissors-crossover";
		const isStationTrack = (t) => t.type === "station" || t.type === "express-station";
		const inScissors = (t) => { const g = groupOf.get(t.id); return !!g && g.type === "scissors-crossover"; };

		const undoT = new Map(), undoG = new Map(), foldBase = new Map(), curvBase = new Map();
		const touchT = (t) => {
			if (undoT.has(t.id)) return;
			undoT.set(t.id, { t, coords: t.coords.map((c) => c.slice()), length: t.length });
			foldBase.set(t.id, countFolds(t.coords));
			curvBase.set(t.id, curvatureViolations(t.coords, targetType.stats.minTurnRadius).length);
		};
		const touchG = (g) => { if (!undoG.has(g.id)) undoG.set(g.id, { g, cl: g.centerLine.map((c) => c.slice()) }); };
		const rollback = () => {
			for (const u of undoT.values()) { u.t.coords = u.coords.map((c) => c.slice()); u.t.length = u.length; }
			for (const u of undoG.values()) { u.g.centerLine = u.cl.map((c) => c.slice()); }
		};

		// Lado lejano de cada carril: el extremo cuyo empalme no toca vía de estación.
		const farOf = (t) => {
			const cands = [];
			for (const idx of [0, t.coords.length - 1]) {
				const toca = (endIndex.get(coordKey(t.coords[idx])) || []).some((c) => c.t.id !== t.id && isStationTrack(c.t));
				if (!toca) cands.push(idx);
			}
			if (cands.length === 1) return cands[0];
			if (cands.length === 2) {
				// Bretelle de mitad de corredor: ningún extremo toca estación. Se
				// ensancha por el lado que tenga continuación llana.
				for (const idx of cands) {
					const hayCont = (endIndex.get(coordKey(t.coords[idx])) || [])
						.some((c) => c.t.id !== t.id && !isDiag(c.t) && !rails.some((r) => r.id === c.t.id));
					if (hayCont) return idx;
				}
			}
			return null;   // entre dos estaciones: no hay por dónde crecer
		};

		const claimed = new Set([...rails.map((r) => r.id), ...diagIds]);
		const slid = new Set([...rails.map((r) => r.id)]);
		const orient = (t, idx) => (idx === 0 ? t.coords.map((c) => c.slice()) : [...t.coords].reverse().map((c) => c.slice()));
		const deOrient = (coords, idx) => (idx === 0 ? coords : [...coords].reverse());

		for (const rail of rails) {
			const farIdx = farOf(rail);
			if (farIdx === null) { T(1); rollback(); return false; }
			const corner = rail.coords[farIdx];
			const inner = farIdx === 0 ? rail.coords[1] : rail.coords[rail.coords.length - 2];
			const brOut = bearingDeg(inner, corner);

			const chain = [];
			let lastFound = false;
			{
				let coord = corner, br = brOut;
				const excl = new Set(claimed);
				for (let hop = 0; hop < 40; hop++) {
					let best = null, bestDiff = 30;
					for (const cand of endIndex.get(coordKey(coord)) || []) {
						if (excl.has(cand.t.id) || isDiag(cand.t)) continue;
						const c = cand.t.coords;
						const nx = cand.idx === 0 ? c[1] : c[c.length - 2];
						let diff = Math.abs(bearingDeg(coord, nx) - br);
						if (diff > 180) diff = 360 - diff;
						if (diff < bestDiff) { bestDiff = diff; best = cand; }
					}
					if (!best || isStationTrack(best.t)) break;
					chain.push(best); excl.add(best.t.id);
					const oc = orient(best.t, best.idx);
					coord = oc[oc.length - 1];
					br = bearingDeg(oc[oc.length - 2], oc[oc.length - 1]);
					const lenNx = best.t.length || lineLength(best.t.coords);
					if (!inScissors(best.t) && lenNx >= addM + 10) { lastFound = true; break; }
				}
			}
			if (!chain.length || !lastFound) { T(2); rollback(); return false; }

			for (const s2 of chain) claimed.add(s2.t.id);
			const oriented = chain.map((s2) => orient(s2.t, s2.idx));
			const lens = oriented.map((oc) => lineLength(oc));
			const corridor = [corner.slice()];
			for (const oc of oriented) corridor.push(...oc.slice(1));
			const total = lineLength(corridor);
			if (addM + 10 > total) { T(3); rollback(); return false; }

			const gan = slicePolyline(corridor, 0, addM);
			if (!gan) { T(4); rollback(); return false; }
			touchT(rail);
			if (farIdx === 0) rail.coords = [...[...gan].reverse().slice(0, -1), ...rail.coords];
			else rail.coords = [...rail.coords, ...gan.slice(1)];
			rail.length = lineLength(rail.coords);

			let acc = addM;
			for (let k = 0; k < chain.length; k++) {
				const to = k === chain.length - 1 ? total : acc + lens[k];
				const nc = slicePolyline(corridor, acc, to);
				if (!nc || (k === chain.length - 1 && lineLength(nc) < 10)) { T(5); rollback(); return false; }
				touchT(chain[k].t);
				slid.add(chain[k].t.id);
				chain[k].t.coords = deOrient(nc, chain[k].idx);
				chain[k].t.length = lineLength(chain[k].t.coords);
				acc = to;
			}

			// reanclar lo colgado de los empalmes desplazados (las diagonales de
			// OTRO grupo parallel se regenerarán; las quad se reanclan)
			let accOld = 0;
			for (let k = 0; k < chain.length; k++) {
				const wOld = walkFromEnd(corridor, 0, accOld), wNew = walkFromEnd(corridor, 0, addM + accOld);
				if (!wOld || !wNew) { T(6); rollback(); return false; }
				for (const cand of endIndex.get(coordKey(wOld.point)) || []) {
					if (claimed.has(cand.t.id)) continue;
					touchT(cand.t);
					const cc = cand.t.coords;
					const idxNow = (cand.idx < cc.length && coordKey(cc[cand.idx]) === coordKey(wOld.point)) ? cand.idx
						: (coordKey(cc[0]) === coordKey(wOld.point) ? 0 : cc.length - 1);
					if (coordKey(cc[idxNow]) !== coordKey(wOld.point)) continue;
					const re = reAnchor(cc, idxNow, wNew.point);
					if (!re) { T(7); rollback(); return false; }
					cand.t.coords = re; cand.t.length = lineLength(re);
				}
				accOld += lens[k];
			}
		}

		// eje del grupo: alargar su lado lejano y deslizar la cadena de ejes
		{
			const clase = group.centerLine;
			const nearKeys = new Set();
			for (const g2 of data.trackGroups || []) {
				if (g2.type !== "station" || !g2.centerLine || g2.centerLine.length < 2) continue;
				nearKeys.add(coordKey(g2.centerLine[0]));
				nearKeys.add(coordKey(g2.centerLine[g2.centerLine.length - 1]));
			}
			const sd = nearKeys.has(coordKey(clase[0])) ? 1 : 0;   // lejos = el que NO casa con una estación
			const endCoord = sd === 0 ? clase[0] : clase[clase.length - 1];
			const chainG = [];
			let lastG = false;
			{
				let coord = endCoord;
				const gExcl = new Set([group.id]);
				for (let hop = 0; hop < 40; hop++) {
					let nx = null;
					for (const g2 of data.trackGroups || []) {
						if (gExcl.has(g2.id) || !g2.centerLine || g2.centerLine.length < 2) continue;
						if (coordKey(g2.centerLine[0]) === coordKey(coord)) { nx = { g: g2, idx: 0 }; break; }
						if (coordKey(g2.centerLine[g2.centerLine.length - 1]) === coordKey(coord)) { nx = { g: g2, idx: 1 }; break; }
					}
					if (!nx || nx.g.type === "station") break;
					chainG.push(nx); gExcl.add(nx.g.id);
					const oc = nx.idx === 0 ? nx.g.centerLine : [...nx.g.centerLine].reverse();
					coord = oc[oc.length - 1];
					if (nx.g.type !== "scissors-crossover" && lineLength(nx.g.centerLine) >= addM + 1) { lastG = true; break; }
				}
			}
			if (!chainG.length || !lastG) { T(8); rollback(); return false; }
			const orientedG = chainG.map((s2) => (s2.idx === 0 ? s2.g.centerLine.map((c) => c.slice()) : [...s2.g.centerLine].reverse().map((c) => c.slice())));
			const lensG = orientedG.map((oc) => lineLength(oc));
			const corridorG = [endCoord.slice()];
			for (const oc of orientedG) corridorG.push(...oc.slice(1));
			const totalG = lineLength(corridorG);
			const ext = slicePolyline(corridorG, 0, addM);
			if (!ext) { T(9); rollback(); return false; }
			touchG(group);
			group.centerLine = sd === 0 ? [...[...ext].reverse().slice(0, -1), ...group.centerLine] : [...group.centerLine, ...ext.slice(1)];
			let acc = addM;
			for (let k = 0; k < chainG.length; k++) {
				const to = k === chainG.length - 1 ? totalG : acc + lensG[k];
				const nc = slicePolyline(corridorG, acc, to);
				if (!nc) { T(10); rollback(); return false; }
				touchG(chainG[k].g);
				chainG[k].g.centerLine = chainG[k].idx === 0 ? nc : [...nc].reverse();
				acc = to;
			}
		}

		// Aceptación: sin horquillas nuevas; y curvatura no peor SOLO en las vías
		// reancladas. Las deslizadas re-particionan el mismo corredor (misma
		// geometría de conjunto): su recuento por vía baila sin que nada cambie,
		// y la conformidad real la evalúa la segunda pasada de conformRoute.
		for (const u of undoT.values()) {
			const t2 = u.t;
			if (isDiag(t2)) continue;
			if (countFolds(t2.coords) > (foldBase.get(t2.id) || 0)) { T(11); rollback(); return false; }
			if (slid.has(t2.id)) continue;
			if (curvatureViolations(t2.coords, targetType.stats.minTurnRadius).length > (curvBase.get(t2.id) || 0)) { T(12); rollback(); return false; }
		}
		return true;
	}

	// Orquesta la conformidad de una línea entera contra el tipo destino.
	function conformRoute(data, route, targetId, trainTypes, opts) {
		const target = trainTypes[targetId];
		const leash = (opts && opts.leashM) || 15;
		const trackById = new Map((data.tracks || []).map((t) => [t.id, t]));
		const ids = routeTrackIds(route);

		const report = { curvature: [], slope: [], fixed: 0, failed: 0 };

		// --- curvatura: por PAREJAS cuando la vía pertenece a un grupo con dos o
		// más carriles (el gemelo y el centerLine reciben el mismo campo de
		// desplazamiento); suelta en caso contrario.
		const groupOfTrack = new Map();
		for (const g of data.trackGroups || []) for (const tid of g.trackIds || []) groupOfTrack.set(tid, g);
		const gruposHechos = new Set();
		for (const id of ids) {
			const t = trackById.get(id);
			if (!t || !t.coords || t.coords.length < 3) continue;
			// Las diagonales de bretelle no se relajan aquí: su conformidad es
			// cosa de regenerateCrossovers/extendCrossoverWindow, que las rehace
			// desde los corners con el bezier del juego.
			if (t.type === "scissors-crossover") continue;
			const isStation = t.type === "station" || t.type === "express-station";
			const minR = isStation ? target.stats.minStationTurnRadius : target.stats.minTurnRadius;
			const bad = curvatureViolations(t.coords, minR);
			if (!bad.length) continue;

			const g = groupOfTrack.get(t.id);
			const railsG = g ? (g.trackIds || []).map((x) => trackById.get(x)).filter((x) => x && x.type !== "scissors-crossover") : [];
			if (g && railsG.length >= 2) {
				if (gruposHechos.has(g.id)) continue;
				gruposHechos.add(g.id);
				const resG = fixCurvatureGroup(g, railsG, minR, leash);
				if (resG.ok) {
					report.fixed++;
					report.curvature.push({ trackId: id, ok: true, before: bad[0].radius, moved: resG.moved, station: isStation, group: g.id });
				} else {
					report.failed++;
					report.curvature.push({ trackId: id, ok: false, before: bad[0].radius, reason: resG.reason, station: isStation, group: g.id });
				}
				continue;
			}

			const res = fixCurvature(t.coords, minR, leash);
			if (res.coords) {
				t.coords = res.coords;
				t.length = lineLength(res.coords);
				report.fixed++;
				report.curvature.push({ trackId: id, ok: true, before: bad[0].radius, moved: res.moved, station: isStation });
			} else {
				report.failed++;
				report.curvature.push({ trackId: id, ok: false, before: bad[0].radius, reason: res.reason, station: isStation });
			}
		}

		// --- pendientes, sobre la cadena ORIENTADA que da stCombos[].path
		const endpointOwners = new Map();
		for (const t of data.tracks || []) {
			if (!t.coords || t.coords.length < 2) continue;
			for (const c of [t.coords[0], t.coords[t.coords.length - 1]]) {
				const k = coordKey(c);
				if (!endpointOwners.has(k)) endpointOwners.set(k, new Set());
				endpointOwners.get(k).add(t.id);
			}
		}
		for (const combo of route.stCombos || []) {
			const steps = (combo.path || []).map((p) => {
				const t = trackById.get(p.trackId);
				return t ? { t, reversed: !!p.reversed, isStation: t.type === "station" || t.type === "express-station" } : null;
			});
			if (steps.some((st) => !st) || steps.length < 2) continue;
			const inChain = new Set(steps.map((st) => st.t.id));
			const isForeign = (key) => {
				const own = endpointOwners.get(key);
				if (!own) return false;
				for (const id of own) if (!inChain.has(id)) return true;
				return false;
			};
			const bad = steps.filter((st) => slopePercent(st.t) > target.stats.maxSlopePercentage
				|| (st.isStation && Math.abs((st.t.endElevation || 0) - (st.t.startElevation || 0)) > 0.1));
			if (!bad.length) continue;
			const res = fixSlopes(steps, target.stats.maxSlopePercentage, isForeign);
			report.slope.push({ combo: combo.startStNodeId, tracks: bad.length, ok: res.changed, reason: res.reason });
		}

		// El path cachea la longitud por vía y el motor no la recalcula al cargar.
		for (const combo of route.stCombos || []) {
			for (const step of combo.path || []) {
				const t = trackById.get(step.trackId);
				if (t && typeof step.length === "number") step.length = t.length;
			}
			combo.distance = (combo.path || []).reduce((a, p) => a + (p.length || 0), 0);
		}

		return report;
	}

	// -------------------------------------------------------------------------
	// POSTFLIGHT
	//
	// El plan original decía "releer el fichero escrito y compararlo". Con el IPC
	// real eso no encaja: saveGameToFile abre un diálogo, así que releer obligaría
	// a pedir el fichero otra vez. Y el fallo que de verdad hay que atrapar no es
	// que el disco mienta, es que hayamos tocado algo que no tocaba.
	//
	// Así que se compara el objeto mutado contra una copia del original y se exige
	// que solo hayan cambiado las claves previstas. Más el barrido de valores no
	// serializables, que es la otra forma de escribir un save roto.
	// -------------------------------------------------------------------------

	const TOP_LEVEL_ESPERADO = new Set(["tracks", "trackGroups", "routes", "stations", "trains", "ownedCarsByType", "signals"]);

	function indexById(arr) {
		const m = new Map();
		for (const x of arr || []) if (x && x.id) m.set(x.id, x);
		return m;
	}

	function changedFields(a, b) {
		const out = [];
		for (const k of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
			if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push(k);
		}
		return out;
	}

	// Busca NaN, Infinity y undefined dentro de arrays: las tres formas de que
	// JSON.stringify escriba null donde debería ir un número.
	function findBadNumbers(node, path, out, depth) {
		if (out.length > 20 || (depth || 0) > 12) return out;
		if (typeof node === "number") {
			if (!Number.isFinite(node)) out.push(`${path} = ${node}`);
			return out;
		}
		if (Array.isArray(node)) {
			for (let i = 0; i < node.length; i++) {
				if (node[i] === undefined) out.push(`${path}[${i}] = undefined`);
				else findBadNumbers(node[i], `${path}[${i}]`, out, (depth || 0) + 1);
			}
			return out;
		}
		if (node && typeof node === "object") {
			for (const k of Object.keys(node)) findBadNumbers(node[k], `${path}.${k}`, out, (depth || 0) + 1);
		}
		return out;
	}

	// extraAllowed: claves de data que ESTA migración concreta sí puede tocar
	// (money y ownedTrainCount cuando hay reembolso de flota). Fuera de ese caso
	// siguen protegidas: un cambio inesperado en money es un error del motor.
	function verifyMutation(before, after, extraAllowed) {
		const errors = [], summary = {};
		const permitido = new Set([...TOP_LEVEL_ESPERADO, ...(extraAllowed || [])]);

		// 1. ninguna clave de data fuera de la lista prevista puede haber cambiado
		const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
		for (const k of keys) {
			if (permitido.has(k)) continue;
			if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
				errors.push(`data.${k} ha cambiado y no debería: la migración solo toca ${[...permitido].join(", ")}.`);
			}
		}

		// 2. desglose de lo que sí ha cambiado, para enseñárselo al usuario
		for (const col of ["tracks", "trackGroups", "routes", "stations"]) {
			const A = indexById(before[col]), B = indexById(after[col]);
			const mod = [], added = [], removed = [];
			for (const [id, x] of A) {
				if (!B.has(id)) removed.push(id);
				else { const f = changedFields(x, B.get(id)); if (f.length) mod.push({ id, fields: f }); }
			}
			for (const id of B.keys()) if (!A.has(id)) added.push(id);
			summary[col] = { modificados: mod.length, añadidos: added.length, eliminados: removed.length, campos: mod.slice(0, 3) };
			if (added.length) errors.push(`Se han añadido ${added.length} elemento(s) a ${col}: la migración no crea objetos nuevos.`);
			if (removed.length && col !== "tracks") errors.push(`Se han eliminado ${removed.length} elemento(s) de ${col}.`);
		}

		const trenesAntes = (before.trains || []).length, trenesDespues = (after.trains || []).length;
		summary.trains = { antes: trenesAntes, después: trenesDespues, borrados: trenesAntes - trenesDespues };
		if (trenesDespues > trenesAntes) errors.push("Han aparecido trenes nuevos, cosa que la migración no hace.");

		// 3. valores no serializables
		const bad = findBadNumbers(after, "data", [], 0);
		if (bad.length) errors.push(`Valores no serializables (${bad.length}): ${bad.slice(0, 5).join(", ")}`);

		// 4. y una segunda pasada del preflight sobre el resultado
		return { ok: errors.length === 0, errors, summary };
	}

	// -------------------------------------------------------------------------
	// PLAN DE MIGRACIÓN
	//
	// Calcula todo lo que va a pasar SIN tocar el objeto real, para poder
	// enseñarlo antes de confirmar. Se trabaja sobre una copia profunda; si el
	// usuario acepta, esa copia es exactamente lo que se escribe.
	// -------------------------------------------------------------------------
	// Grupo compartido: cierre transitivo de líneas que comparten grupo de vías
	// o estación con la pedida. Migrar una sola dejaría a las demás circulando
	// sobre infraestructura retipada y redimensionada de otro tipo (C2 y C5
	// comparten 49 vías y 4 estaciones en la partida real), así que la política
	// acordada es: o TODAS al mismo destino, o ninguna.
	function sharedRouteClosure(data, routeId) {
		const real = (data.routes || []).filter((r) => !r.tempParentId);
		const groupsOf = new Map(), stationsOf = new Map();
		for (const r of real) {
			const ids = routeTrackIds(r);
			const gs = new Set();
			for (const g of data.trackGroups || []) {
				if ((g.trackIds || []).some((id) => ids.has(id))) gs.add(g.id);
			}
			groupsOf.set(r.id, gs);
			stationsOf.set(r.id, new Set((data.stations || [])
				.filter((st) => (st.routeIds || []).includes(r.id)).map((st) => st.id)));
		}
		const linked = (a, b) => {
			for (const g of groupsOf.get(a)) if (groupsOf.get(b).has(g)) return true;
			for (const st of stationsOf.get(a)) if (stationsOf.get(b).has(st)) return true;
			return false;
		};
		const dentro = new Set([routeId]);
		let crecio = true;
		while (crecio) {
			crecio = false;
			for (const r of real) {
				if (dentro.has(r.id)) continue;
				for (const id of dentro) {
					if (linked(r.id, id)) { dentro.add(r.id); crecio = true; break; }
				}
			}
		}
		return real.filter((r) => dentro.has(r.id));
	}

	function planMigration(saveObj, routeId, targetId, trainTypes, opts) {
		const target = trainTypes[targetId];
		const before = saveObj.mainSave ? saveObj.mainSave.data : saveObj.data;
		const copy = JSON.parse(JSON.stringify(before));
		const route = (copy.routes || []).find((r) => r.id === routeId);
		if (!route) return { ok: false, errors: ["La línea ya no está en la partida."] };

		// El cierre compartido se calcula ANTES del preflight: los trenes y rutas
		// de tipo no registrado que pertenezcan a la migración se degradan a
		// aviso (rescate de saves que el juego ya no puede abrir).
		const closure = sharedRouteClosure(copy, routeId);
		const pre = preflight(copy, trainTypes, new Set(closure.map((r) => r.id)));
		if (!pre.ok) return { ok: false, errors: pre.errors, warnings: pre.warnings, phase: "preflight" };


		if (closure.length > 1 && !(opts && opts.migrateGroup)) {
			return {
				ok: false,
				needsGroup: closure.map((r) => ({ id: r.id, bullet: r.bullet, trainType: r.trainType || "heavy-metro" })),
				errors: [], warnings: pre.warnings
			};
		}
		const rutas = closure.length > 1 ? closure : [route];

		// extendPlatforms: true (por defecto) alarga los andenes al máximo del tipo
		// destino; false los deja como están y se limita a informar de cuáles se
		// quedan cortos, que es la otra mitad de la decisión.
		const extend = !opts || opts.extendPlatforms !== false;
		const stations = (copy.stations || []).filter((s) => rutas.some((r) => (s.routeIds || []).includes(r.id)));
		const platforms = [];
		for (const st of stations) {
			if (!extend) {
				const g0 = (copy.trackGroups || []).find((x) => x.id === st.trackGroupId);
				platforms.push({ name: st.name, ok: true, changed: false,
					length: g0 && g0.centerLine ? lineLength(g0.centerLine) : 0 });
				continue;
			}
			const r = resizePlatform(copy, st, target, opts);
			platforms.push({ name: st.name, ...r });
		}

		// Retipar TODAS las líneas del grupo antes de conformar, para que la
		// conformidad vea el estado final del corredor compartido.
		const retype = { tracks: 0, groups: 0, cars: route.carsPerTrain, stationsReset: 0, perRoute: [] };
		for (const r of rutas) {
			const rr = retypeRoute(copy, r, targetId, trainTypes);
			retype.tracks += rr.tracks; retype.groups += rr.groups; retype.stationsReset += rr.stationsReset || 0;
			if (r.id === routeId) retype.cars = rr.cars;
			retype.perRoute.push({ bullet: r.bullet, ...rr });
		}

		// Si la composición no cabe en algún andén de su línea, opcionalmente se
		// baja a la mayor que sí quepa (casilla explícita en la UI). Si ni la
		// mínima cabe, se deja y quedará en blocking/tooShort, que es la señal.
		const reductions = [];
		if (opts && opts.reduceCars) {
			const gById = new Map((copy.trackGroups || []).map((g) => [g.id, g]));
			for (const r of rutas) {
				let fit = r.carsPerTrain;
				for (const st of stations) {
					if (!(st.routeIds || []).includes(r.id)) continue;
					const g = gById.get(st.trackGroupId);
					if (!g || !g.centerLine || g.centerLine.length < 2) continue;
					const L = lineLength(g.centerLine);
					let c = Math.floor((L + EPSILON) / target.stats.carLength);
					c = Math.floor(c / target.stats.carsPerCarSet) * target.stats.carsPerCarSet;
					if (c < fit) fit = c;
				}
				fit = clampCars(Math.max(target.stats.minCars, fit), target);
				if (fit < r.carsPerTrain) {
					reductions.push({ bullet: r.bullet, from: r.carsPerTrain, to: fit });
					r.carsPerTrain = fit;
				}
			}
			retype.cars = route.carsPerTrain;
		}

		const geom = { fixed: 0, failed: 0, curvature: [], slope: [] };
		for (const r of rutas) {
			const g = conformRoute(copy, r, targetId, trainTypes, opts);
			geom.fixed += g.fixed; geom.failed += g.failed;
			geom.curvature.push(...g.curvature); geom.slope.push(...g.slope);
		}

		// Bretelles de los grupos tocados: regenerar con la geometría final de
		// los carriles (después de andenes y conformidad, que es la que cuenta).
		const gruposTocados = new Set();
		for (const g of copy.trackGroups || []) if (g.trackType === targetId) gruposTocados.add(g.id);
		for (const pf of platforms) for (const gid of pf.slidScissors || []) gruposTocados.add(gid);
		let bretelles = regenerateCrossovers(copy, gruposTocados, target);
		// Las inválidas para el radio del destino se ensanchan a pasos de 4 m
		// (CROSSOVER_LENGTH_GROWTH_STEP del juego) deslizando el corredor, y se
		// regeneran tras cada paso. Si el corredor no da más de sí, quedan como
		// problema explícito del plan.
		if (bretelles.invalid.length) {
			const porId = new Map((copy.trackGroups || []).map((g) => [g.id, g]));
			const aun = [];
			let widened = 0;
			for (const inv of bretelles.invalid) {
				const g = porId.get(inv.groupId);
				let ok2 = false;
				for (let paso = 0; paso < 60 && !ok2 && g; paso++) {
					if (!extendCrossoverWindow(copy, g, 4, target)) break;
					const r2 = regenerateCrossovers(copy, new Set([g.id]), target);
					ok2 = r2.invalid.length === 0;
				}
				if (ok2) widened++; else aun.push(inv);
			}
			bretelles = { regen: bretelles.regen, quad: bretelles.quad, invalid: aun, widened };
		}
		// Segunda pasada de conformidad: el ensanche re-particiona vías del
		// corredor DESPUÉS de la primera, y lo que reaparezca debe arreglarse o
		// constar como problema (sin duplicar entradas del informe).
		if (bretelles.widened > 0 || (bretelles.invalid && bretelles.invalid.length)) {
			for (const r of rutas) {
				const g2 = conformRoute(copy, r, targetId, trainTypes, opts);
				geom.fixed += g2.fixed;
				const ya = new Set(geom.curvature.map((x) => x.trackId));
				for (const cvx of g2.curvature) if (!ya.has(cvx.trackId)) { geom.curvature.push(cvx); if (!cvx.ok) geom.failed++; }
			}
		}

		// Refrescar las longitudes cacheadas del path DESPUÉS de todo movimiento
		// de vías (conformRoute ya lo hizo, pero el ensanche llega más tarde).
		{
			const tb2 = new Map((copy.tracks || []).map((t) => [t.id, t]));
			for (const r of rutas) {
				for (const combo of r.stCombos || []) {
					for (const step of combo.path || []) {
						const t2 = tb2.get(step.trackId);
						if (t2 && typeof step.length === "number") step.length = t2.length;
					}
					combo.distance = (combo.path || []).reduce((a2, p2) => a2 + (p2.length || 0), 0);
				}
			}
		}

		const service = { trains: 0, carsByType: {}, fleet: "keep", refund: { cars: 0, money: 0 }, perRoute: [] };
		for (const r of rutas) {
			const sv = stopService(copy, r, trainTypes, opts);
			service.trains += sv.trains;
			for (const k of Object.keys(sv.carsByType)) service.carsByType[k] = (service.carsByType[k] || 0) + sv.carsByType[k];
			service.fleet = sv.fleet;
			service.refund.cars += sv.refund.cars; service.refund.money += sv.refund.money;
			service.perRoute.push({ bullet: r.bullet, ...sv });
		}

		const post = verifyMutation(before, copy, service.fleet === "refund" ? ["money", "ownedTrainCount"] : undefined);
		const pre2 = preflight(copy, trainTypes, new Set(rutas.map((r) => r.id)));

		// Dos listas distintas, y la diferencia importa:
		//
		//  · blocking  = lo que el JUEGO rechazaría al convertir.
		//  · tooShort  = lo que físicamente no cabe.
		//
		// No coinciden. calculateStationMaxCars termina con Math.max(n, carsPerCarSet),
		// así que nunca devuelve menos de un juego de coches por corto que sea el
		// andén. Reproducir esa laxitud no le sirve de nada al jugador, así que se
		// avisa aparte de lo que no cabe de verdad, línea a línea del grupo.
		const groupById = new Map((copy.trackGroups || []).map((g) => [g.id, g]));
		const blocking = [], tooShort = [];
		for (const r of rutas) {
			for (const st of stations) {
				if (!(st.routeIds || []).includes(r.id)) continue;
				const g = groupById.get(st.trackGroupId);
				if (!g || !g.centerLine || g.centerLine.length < 2) continue;
				const L = lineLength(g.centerLine);
				const allowed = carsAllowedBy(L, target);
				if (r.carsPerTrain > allowed) blocking.push({ name: st.name, route: r.bullet, allowed, length: L });
				const necesita = r.carsPerTrain * target.stats.carLength - EPSILON;
				if (L < necesita) tooShort.push({ name: st.name, route: r.bullet, length: L, needs: necesita });
			}
		}

		return {
			ok: post.ok && pre2.ok,
			errors: [...post.errors, ...pre2.errors],
			warnings: pre.warnings,
			data: copy,
			group: rutas.map((r) => r.bullet),
			reductions, bretelles,
			platforms, retype, geom, service, blocking, tooShort,
			diff: post.summary
		};
	}

	// -------------------------------------------------------------------------
	// FLAG DE CONVERSIÓN DEL JUEGO
	//
	// La conversión in situ del juego existe desde la 1.6.0 pero su flag viene
	// apagado y el panel de Beta Features está tras isBetaVersion(), que en una
	// build estable de Steam es falso: no hay ninguna ruta de UI para encenderlo.
	//
	// Se FUSIONA el objeto, nunca se sobrescribe. Un setItem con una sola clave
	// borraría los flags que el jugador ya tuviera puestos, y si alguno de ellos
	// gobierna un tipo de tren en uso (ENABLE_TRAM, por ejemplo), ese tipo
	// desaparecería de TRAIN_TYPES y el juego reventaría en el bucle de cobro de
	// costes con los trenes que lo usaran.
	// -------------------------------------------------------------------------
	const FLAG_CONVERSION = "ROUTE_TYPE_CONVERSION";

	function readFlags() {
		try {
			const raw = localStorage.getItem("featureFlags");
			return raw ? JSON.parse(raw) : {};
		} catch (err) { return null; }
	}

	function setConversionFlag(on) {
		const flags = readFlags();
		if (flags === null) return { ok: false, reason: "no se pudo leer featureFlags" };
		flags[FLAG_CONVERSION] = !!on;
		try {
			localStorage.setItem("featureFlags", JSON.stringify(flags));
		} catch (err) { return { ok: false, reason: String(err) }; }
		// flagsCache se memoiza al evaluar el módulo, mucho antes de que corra
		// ningún mod: el cambio no surte efecto hasta reiniciar.
		return { ok: true, requiresRestart: true };
	}

	const ENGINE = {
		distanceM, bearingDeg, destination, lineLength, roundCoord, coordKey, coordsEqual,
		turnRadius, slopePercent, curvatureViolations, routeTrackIds,
		carsAllowedBy, clampCars, platformLengthOf,
		preflight, retypeRoute, stopService,
		localFrame, relaxVertex, vertexOffset, violatingVertices, fixCurvature, fixCurvatureGroup, buildWarp, applyWarp, fixSlopes, conformRoute, resizePlatform, targetPlatformLength, coordCounts, walkFromEnd, cutFromEnd, pieceFromEnd, reAnchor, countFolds, sharedRouteClosure, trackCorners, pairCorners, crossoverDiagonal, regenerateCrossovers, extendCrossoverWindow, lineMidpoint, verifyMutation, findBadNumbers, planMigration, readFlags, setConversionFlag, t, STRINGS_ES, STRINGS_EN
	};

	// -------------------------------------------------------------------------
	// HERRAMIENTA DEL MENÚ DE INICIO
	//
	// Vive aquí y no dentro de partida porque es el único sitio donde se puede
	// reescribir un fichero de guardado: los canales de partida del proceso
	// principal están bloqueados mientras se cargan los mods, y ese contexto ya
	// está cerrado cuando el jugador pulsa un botón.
	//
	// El menú de inicio renderiza los componentes de mod en una rejilla con
	// scroll (max-h-48), así que aquí va un BOTÓN; el trabajo se hace en una
	// capa propia por encima.
	// -------------------------------------------------------------------------
	// Los motivos de fallo del motor viajan como {code, ...params} y se traducen
	// aquí, no en el motor: si no, el panel en inglés mostraba frases sueltas en
	// castellano, que es justo lo que se veía en pantalla.
	function reasonText(r) {
		if (!r) return "";
		if (typeof r === "string") return r;
		const plantilla = t("reason." + r.code);
		if (!plantilla || plantilla === "reason." + r.code) return r.code;
		const n = (x, d) => (typeof x === "number" ? x.toFixed(d) : x);
		return plantilla
			.replace("{v}", r.vertex).replace("{r}", n(r.radius, 0)).replace("{l}", n(r.leash, 0))
			.replace("{n}", r.count)
			.replace("{d}", n(r.drop, 1)).replace("{L}", n(r.length, 0)).replace("{m}", r.max)
			.replace("{o}", r.outer).replace("{c}", r.rails);
	}

	function MigrationTool() {
		const React = api.utils && api.utils.React;
		const h = React.createElement;
		const [open, setOpen] = React.useState(false);
		const [save, setSave] = React.useState(null);
		const [busy, setBusy] = React.useState(null);
		const [routeId, setRouteId] = React.useState("");
		const [targetId, setTargetId] = React.useState("");
		const [extend, setExtend] = React.useState(true);
		const [plan, setPlan] = React.useState(null);
		const [msg, setMsg] = React.useState(null);
		const [saveList, setSaveList] = React.useState(null);
		// Estos van AL FINAL del bloque: los bancos de pruebas pilotan los hooks
		// por índice y añadir uno en medio los desplaza todos.
		const [fleet, setFleet] = React.useState("keep");
		const [acceptRisks, setAcceptRisks] = React.useState(false);
		const [reduce, setReduce] = React.useState(false);
		const [applied, setApplied] = React.useState([]);

		const types = (() => { try { return api.trains.getTrainTypes() || {}; } catch (e) { return {}; } })();
		const mine = new Set(TYPES.map((x) => x.id));

		const reset = () => { setSave(null); setPlan(null); setRouteId(""); setTargetId(""); setMsg(null); setSaveList(null); setApplied([]); };

		// El diálogo del sistema no sabe dónde están las partidas, así que la lista
		// se pide por IPC y se carga por id, sin diálogo. Los canales de partida
		// están bloqueados MIENTRAS se cargan los mods, pero ese contexto ya está
		// cerrado cuando el jugador pulsa aquí.
		async function listSaves() {
			if (!window.electron || !window.electron.getMostRecentSaves) { setSaveList([]); return; }
			setBusy(t("mig.loadingList"));
			try {
				const res = await window.electron.getMostRecentSaves(50);
				const arr = (res && res.success && res.saves) ? res.saves : [];
				if (arr.length) console.log(`${TAG} forma de una entrada de partida:`, Object.keys(arr[0]).join(", "));
				setSaveList(arr);
			} catch (err) {
				setSaveList([]);
				setMsg({ bad: true, text: String(err && err.message ? err.message : err) });
			} finally { setBusy(null); }
		}

		async function openById(entry) {
			setBusy(t("mig.reading"));
			try {
				const res = await window.electron.loadGameFromPath(entry.id, undefined);
				if (!res || !res.success || !res.data) throw new Error((res && res.error) || "?");
				// La investigación del main dice que este canal entrega el head
				// COMPLETO (routeThumbnail, viewport, timelapse incluidos) y que la
				// pérdida vista en el fichero migrado fue nuestra. Este log lo
				// verifica en juego.
				const hh = res.data.mainSave || res.data;
				console.log(`${TAG} claves del head recibido:`, Object.keys(hh).join(", "));
				// El motor asume el esquema v3 (ownedCarsByType, carsPerTrain…); una
				// partida más vieja se planificaría sobre campos que no existen.
				if (hh.version !== undefined && hh.version < 3) {
					setMsg({ bad: true, text: t("mig.oldSave").replace("{v}", hh.version) });
					return;
				}
				setSave(res.data); setPlan(null); setMsg(null);
			} catch (err) {
				setMsg({ bad: true, text: String(err && err.message ? err.message : err) });
			} finally { setBusy(null); }
		}

		async function pickSave() {
			if (!window.electron || !window.electron.loadGameFromFile) { setMsg({ bad: true, text: t("mig.noElectron") }); return; }
			setBusy(t("mig.reading"));
			try {
				const res = await window.electron.loadGameFromFile();
				if (!res || !res.success || !res.data) throw new Error((res && res.error) || "?");
				setSave(res.data); setPlan(null); setMsg(null);
			} catch (err) {
				setMsg({ bad: true, text: String(err && err.message ? err.message : err) });
			} finally { setBusy(null); }
		}

		function makePlan(withGroup) {
			try {
				// Ojo: como onClick, withGroup llega siendo el evento; solo el botón
				// de la migración conjunta pasa true de verdad.
				const p = planMigration(save, routeId, targetId, types,
					{ leashM: 15, extendPlatforms: extend, fleet, reduceCars: reduce, migrateGroup: withGroup === true });
				setPlan(p); setAcceptRisks(false);
				setMsg(p.ok || p.needsGroup ? null : { bad: true, text: (p.errors || []).join(" · ") });
			} catch (err) {
				setMsg({ bad: true, text: String(err && err.message ? err.message : err) });
			}
		}

		// Se escribe una partida NUEVA, nunca encima de la original: id propio,
		// nombre con sufijo y marca de tiempo al día, para que salga la primera en
		// la lista y se distinga de un vistazo.
		// Aplica el plan actual al save de trabajo EN MEMORIA, sin escribir nada:
		// así se encadenan varias líneas sobre el mismo estado y al final se
		// escribe UN solo fichero, en vez de una partida nueva por línea.
		function applyPlanToWorking() {
			if (!plan || !plan.data) return null;
			const head = save.mainSave || save;
			head.data = plan.data;
			const next = [...applied, { group: plan.group || [], target: targetId }];
			setApplied(next);
			setPlan(null); setRouteId("");
			return next;
		}

		function buildOutput(migs) {
			const out = JSON.parse(JSON.stringify(save));
			const head = out.mainSave || out;
			head.id = (typeof crypto !== "undefined" && crypto.randomUUID)
				? crypto.randomUUID()
				: "migrated-" + Date.now();
			// Sin separadores raros: el main sanea {name}_{id}.metro y un " · "
			// acababa en "sevilla___migrada"; el guion sobrevive limpio. Y sin
			// prefijo de autoguardado: isAutosave clasifica por el NOMBRE, así que
			// una migrada llamada "[Auto] …" la borraría la limpieza de
			// maxAutosaves a los pocos minutos. El nombre lleva todas las líneas
			// migradas y su destino, agrupadas: "sevilla-T1+T2-metro-ligero".
			let base = String(head.name || "save")
				.replace(/^\s*\[auto\]\s*/i, "").replace(/^\s*autosave[\s_-]*/i, "").trim() || "save";
			if (base.length > 48) base = base.slice(0, 48);
			const porDestino = new Map();
			for (const m of migs) {
				const d2 = String(m.target).replace(/^madrid-|^renfe-/, "");
				if (!porDestino.has(d2)) porDestino.set(d2, []);
				porDestino.get(d2).push(...m.group);
			}
			const seg = [...porDestino.entries()].map(([d2, gs]) => gs.join("+") + "-" + d2).join("-");
			head.name = base + "-" + (seg || "migrada");
			head.timestamp = Date.now();
			// El main recalcula el metadata de la CABECERA desde data, pero escribe
			// el cuerpo gzip tal cual: si no refrescamos head.metadata, el cuerpo
			// del fichero queda con los recuentos de ANTES de migrar (se vio con
			// trains 44 vs 42 en el primer fichero migrado).
			if (head.metadata && typeof head.metadata === "object") {
				if (head.metadata.trains !== undefined) head.metadata.trains = (head.data.trains || []).length;
				if (head.metadata.routes !== undefined) head.metadata.routes = (head.data.routes || []).length;
				if (head.metadata.stations !== undefined) head.metadata.stations = (head.data.stations || []).length;
				if (head.metadata.money !== undefined && typeof head.data.money === "number") head.metadata.money = head.data.money;
			}
			return out.mainSave ? out : head;
		}

		// saveGameAuto es el guardado NORMAL del juego, no solo el autoguardado:
		// saveService.save() lo usa, y con el segundo argumento sin definir genera
		// el nombre y escribe en la carpeta de partidas. saveGameToFile, en cambio,
		// abre un diálogo que por defecto apunta a Descargas y acaba duplicando la
		// extensión (.metro.metro), con lo que el fichero ni siquiera aparece en la
		// lista de partidas del juego.
		async function apply(toFile) {
			let migs = applied;
			if (plan && plan.data) migs = applyPlanToWorking();
			if (!migs || !migs.length) return;
			setBusy(t(toFile ? "mig.applyFile" : "mig.apply"));
			try {
				const out = buildOutput(migs);
				let res;
				if (toFile) {
					if (!window.electron.saveGameToFile) throw new Error(t("mig.noElectron"));
					res = await window.electron.saveGameToFile(out);
				} else {
					if (!window.electron.saveGameAuto) throw new Error(t("mig.noElectron"));
					res = await window.electron.saveGameAuto(out, undefined);
				}
				if (!res || !res.success) throw new Error((res && res.error) || "?");
				// Windows devuelve rutas con \\, macOS y Linux con /.
				const donde = res.filePath
					? (" " + t("mig.savedTo") + " " + String(res.filePath).split(/[\\/]/).pop())
					: "";
				setMsg({ bad: false, text: t("mig.saved") + donde + " " + t("mig.rebuildHint") + " " + t("mig.headNote") });
				setPlan(null); setSaveList(null); setApplied([]);
			} catch (err) {
				setMsg({ bad: true, text: String(err && err.message ? err.message : err) });
			} finally { setBusy(null); }
		}

		const btn = (label, onClick, extra) => h("button", {
			onClick, disabled: !!busy,
			className: "px-3 py-1.5 text-xs rounded border border-border bg-background hover:bg-muted disabled:opacity-50 " + (extra || "")
		}, label);

		if (!open) {
			return h("button", {
				onClick: () => setOpen(true),
				className: "w-full text-left px-3 py-2 text-sm rounded border border-border hover:bg-muted"
			}, t("mig.menuButton"));
		}

		const data = save && (save.mainSave ? save.mainSave.data : save.data);
		const routes = (data && data.routes || []).filter((r) => !r.tempParentId);
		const kids = [];

		kids.push(h("div", { key: "h", className: "flex items-baseline justify-between gap-4" }, [
			h("h2", { key: "t", className: "text-base font-semibold" }, t("mig.title")),
			btn(t("mig.close"), () => { setOpen(false); reset(); })
		]));
		kids.push(h("p", { key: "i", className: "text-xs text-muted-foreground leading-relaxed" }, t("mig.intro")));

		if (!save) {
			if (saveList === null) {
				kids.push(h("div", { key: "l" }, btn(t("mig.yourSaves"), listSaves)));
			} else if (!saveList.length) {
				kids.push(h("p", { key: "n", className: "text-xs text-muted-foreground" }, t("mig.noSaves")));
			} else {
				kids.push(h("div", { key: "sl", className: "max-h-64 overflow-y-auto border border-border rounded divide-y divide-border" },
					saveList.map((sv) => {
						// El campo se llama `stats` en la respuesta real de getMostRecentSaves
						// (id, name, timestamp, cityCode, gameSessionId, path, format,
						// thumbnail, stats, isTutorialGame). Se acepta `metadata` por si
						// cambia, pero el bueno es `stats`.
						const m = sv.stats || sv.metadata || {};
						const fecha = sv.timestamp ? new Date(sv.timestamp).toLocaleString() : "";
						const esAuto = /^\s*\[auto\]/i.test(sv.name || "") || /_auto_/.test(sv.path || "");
						const detalle = [esAuto ? t("mig.autosave") : null, sv.cityCode, m.routes != null ? m.routes + " " + t("mig.route").toLowerCase() + "s" : null,
							m.stations != null ? m.stations + " est." : null, fecha].filter(Boolean).join(" · ");
						return h("button", {
							key: sv.id, onClick: () => openById(sv), disabled: !!busy,
							className: "w-full text-left px-3 py-2 hover:bg-muted disabled:opacity-50"
						}, [
							h("div", { key: "n", className: "text-xs font-medium" }, sv.name || sv.id),
							h("div", { key: "d", className: "text-[11px] text-muted-foreground" }, detalle)
						]);
					})));
			}
			kids.push(h("div", { key: "p", className: "flex items-center gap-2" }, [
				h("span", { key: "o", className: "text-[11px] text-muted-foreground" }, t("mig.orFile")),
				btn(t("mig.pickSave"), pickSave)
			]));
		} else {
			const nombre = (save.name || (save.mainSave && save.mainSave.name) || "?");
			kids.push(h("p", { key: "n", className: "text-xs" }, nombre + " · " + routes.length + " " + t("mig.route").toLowerCase() + "s"));

			kids.push(h("div", { key: "sel", className: "grid grid-cols-2 gap-2" }, [
				h("select", {
					key: "r", value: routeId, onChange: (e) => { setRouteId(e.target.value); setPlan(null); },
					className: "h-8 text-xs rounded border border-border bg-background px-2"
				}, [h("option", { key: "_", value: "" }, t("mig.route") + " " + t("mig.choose"))].concat(
					routes.map((r) => h("option", { key: r.id, value: r.id },
						(r.bullet || "?") + " · " + ((types[r.trainType || "heavy-metro"] || {}).name || r.trainType))))),
				h("select", {
					key: "t", value: targetId, onChange: (e) => { setTargetId(e.target.value); setPlan(null); },
					className: "h-8 text-xs rounded border border-border bg-background px-2"
				}, [h("option", { key: "_", value: "" }, t("mig.target") + " " + t("mig.choose"))].concat(
					TYPES.map((x) => x.id).filter((id) => types[id]).map((id) =>
						h("option", { key: id, value: id }, types[id].name))))
			]));

			kids.push(h("label", { key: "ext", className: "flex items-center gap-2 text-xs" }, [
				h("input", { key: "c", type: "checkbox", checked: extend, onChange: (e) => { setExtend(e.target.checked); setPlan(null); } }),
				t("mig.extend")
			]));

			kids.push(h("label", { key: "red", className: "flex items-center gap-2 text-xs" }, [
				h("input", { key: "c", type: "checkbox", checked: reduce, onChange: (e) => { setReduce(e.target.checked); setPlan(null); } }),
				t("mig.reduceCars")
			]));

			kids.push(h("label", { key: "fleet", className: "flex items-center gap-2 text-xs" }, [
				t("mig.fleet"),
				h("select", { key: "s", className: "border border-border rounded px-1 py-0.5 bg-background", value: fleet, onChange: (e) => { setFleet(e.target.value); setPlan(null); } }, [
					h("option", { key: "keep", value: "keep" }, t("mig.fleetKeep")),
					h("option", { key: "refund", value: "refund" }, t("mig.fleetRefund"))
				])
			]));

			kids.push(h("div", { key: "act", className: "flex gap-2" }, [
				btn(t("mig.plan"), makePlan, routeId && targetId ? "" : "opacity-40 pointer-events-none"),
				btn(t("mig.back"), reset)
			]));

			if (applied.length) {
				kids.push(h("div", { key: "app", className: "border border-amber-600/40 rounded p-2 space-y-1" }, [
					h("p", { key: "t", className: "text-xs text-amber-600" },
						t("mig.appliedSoFar") + " " + applied.map((m) =>
							m.group.join("+") + " → " + ((types[m.target] || { name: m.target }).name)).join(" · ")),
					!plan ? h("div", { key: "b", className: "flex flex-wrap gap-2" }, [
						btn(t("mig.apply"), () => apply(false)),
						btn(t("mig.applyFile"), () => apply(true))
					]) : null
				]));
			}
		}

		if (plan && plan.needsGroup) {
			const bloque = [];
			bloque.push(h("h3", { key: "t", className: "text-sm font-semibold" }, t("mig.sharedTitle")));
			bloque.push(h("p", { key: "n", className: "text-xs text-amber-600" }, t("mig.sharedNote")));
			bloque.push(h("ul", { key: "l", className: "text-xs list-disc pl-4" },
				plan.needsGroup.map((r) => h("li", { key: r.id },
					`${r.bullet} (${(types[r.trainType] || { name: r.trainType }).name})`))));
			bloque.push(h("div", { key: "a", className: "flex flex-wrap gap-2 pt-1" }, [
				btn(t("mig.migrateAll").replace("{n}", plan.needsGroup.length), () => makePlan(true)),
				btn(t("mig.cancel"), () => setPlan(null))
			]));
			kids.push(h("div", { key: "plan", className: "border border-border rounded p-3 space-y-1" }, bloque));
		} else if (plan) {
			const P = plan.platforms || [];
			const cambiados = P.filter((x) => x.changed).length;
			const lens = P.map((x) => x.length).filter((x) => typeof x === "number");
			const linea = (k, v) => h("p", { key: k, className: "text-xs" }, [
				h("span", { key: "a", className: "text-muted-foreground" }, k + ": "), v
			]);
			const bloque = [];
			bloque.push(h("h3", { key: "t", className: "text-sm font-semibold" }, t("mig.planTitle")));
			if (plan.group && plan.group.length > 1) bloque.push(linea(t("mig.lines"), plan.group.join(", ")));
			if (lens.length) bloque.push(linea(t("mig.platforms"),
				`${cambiados}/${P.length} · ${Math.min(...lens).toFixed(1)}–${Math.max(...lens).toFixed(1)} m`));
			bloque.push(linea(t("mig.geometry"),
				`${plan.geom.fixed} ✓ · ${plan.geom.failed} ✗`));
			const coches = Object.entries(plan.service.carsByType).map(([k, v]) => `${k} ${v}`).join(", ") || "—";
			const flota = plan.service.fleet === "refund"
				? `${t("mig.refunded")} ${plan.service.refund.cars} ${t("mig.cars")} · +${(plan.service.refund.money / 1e6).toFixed(1)} M`
				: `${t("mig.kept")} ${coches}`;
			bloque.push(linea(t("mig.service"), `${plan.service.trains} ${t("mig.trains")} · ${flota}`));
			bloque.push(linea(t("mig.changes"),
				Object.entries(plan.diff).map(([k, v]) => k + " " + (v.modificados !== undefined ? v.modificados : v.borrados)).join(" · ")));

			const lista = (titulo, arr, fmt, tono) => arr && arr.length
				? h("div", { key: titulo, className: "text-xs " + tono }, [
					h("p", { key: "t", className: "font-medium" }, titulo + " (" + arr.length + ")"),
					h("ul", { key: "l", className: "list-disc pl-4" }, arr.slice(0, 6).map((x, i) => h("li", { key: i }, fmt(x))))
				]) : null;

			bloque.push(lista(t("mig.tooShort"), plan.tooShort,
				(x) => `${x.name}: ${x.length.toFixed(1)} m / ${x.needs.toFixed(1)} m`, "text-amber-600"));
			bloque.push(lista(t("mig.blocked"), plan.blocking,
				(x) => `${x.name}: ${x.allowed} coches`, "text-destructive"));
			bloque.push(lista(t("mig.failed"), (plan.geom.curvature || []).filter((c) => !c.ok),
				(x) => `${x.trackId.slice(0, 8)}: ${reasonText(x.reason)}`, "text-amber-600"));
			bloque.push(lista(t("mig.slopeFailed"), (plan.geom.slope || []).filter((x) => !x.ok),
				(x) => `${String(x.combo).slice(0, 8)}: ${reasonText(x.reason)}`, "text-amber-600"));
			bloque.push(lista(t("mig.reduced"), plan.reductions,
				(x) => `${x.bullet}: ${x.from} → ${x.to}`, "text-amber-600"));
			if (plan.bretelles) bloque.push(lista(t("mig.crossFailed"), plan.bretelles.invalid,
				(x) => `${x.groupId.slice(0, 8)}: ${x.violations}`, "text-amber-600"));
			if (plan.bretelles && plan.bretelles.widened > 0) bloque.push(h("p", { key: "wid", className: "text-[11px] text-muted-foreground" },
				plan.bretelles.widened + " " + t("mig.widened")));
			if (plan.bretelles && plan.bretelles.quad > 0) bloque.push(h("p", { key: "quad", className: "text-[11px] text-muted-foreground" },
				plan.bretelles.quad + " " + t("mig.crossQuad")));

			// El cargador llama setTracks sin regenRoutesWithTrackIDs, así que los
			// stComboTimings (tiempos por parada) no se recalculan al cargar: solo
			// los reescribe updateRoute, y la única acción que lo dispara para todas
			// las líneas es buildBlueprints (construir algo, con "every"). Mientras
			// la línea está parada no afecta; se avisa aquí y al guardar.
			if (plan.ok) bloque.push(h("p", { key: "after", className: "text-xs text-amber-600" },
				t("mig.after") + ": " + t("mig.rebuildHint")));

			// «Parar y preguntar»: con problemas pendientes (andenes cortos, curvas
			// o pendientes sin resolver, composiciones que no caben) el botón se
			// desbloquea solo con la casilla de aceptación explícita.
			const problemas = (plan.tooShort ? plan.tooShort.length : 0)
				+ (plan.blocking ? plan.blocking.length : 0)
				+ plan.geom.failed
				+ (plan.geom.slope || []).filter((x) => !x.ok).length
				+ (plan.bretelles ? plan.bretelles.invalid.length : 0);
			if (plan.ok && problemas > 0) {
				bloque.push(h("label", { key: "acc", className: "flex items-center gap-2 text-xs text-amber-600" }, [
					h("input", { key: "c", type: "checkbox", checked: acceptRisks, onChange: (e) => setAcceptRisks(e.target.checked) }),
					t("mig.acceptRisks").replace("{n}", problemas)
				]));
			}
			const puedeMigrar = plan.ok && (problemas === 0 || acceptRisks);
			bloque.push(h("div", { key: "a", className: "flex flex-wrap gap-2 pt-1" }, [
				btn(t("mig.applyNext"), () => { if (applyPlanToWorking()) setMsg({ bad: false, text: t("mig.appliedOk") }); },
					puedeMigrar ? "" : "opacity-40 pointer-events-none"),
				btn(t("mig.apply"), () => apply(false), puedeMigrar ? "" : "opacity-40 pointer-events-none"),
				btn(t("mig.applyFile"), () => apply(true), puedeMigrar ? "" : "opacity-40 pointer-events-none"),
				btn(t("mig.cancel"), () => setPlan(null))
			]));
			kids.push(h("div", { key: "plan", className: "border border-border rounded p-3 space-y-1" }, bloque));
		}

		if (busy) kids.push(h("p", { key: "b", className: "text-xs text-muted-foreground animate-pulse" }, busy));
		if (msg) kids.push(h("p", { key: "m", className: "text-xs " + (msg.bad ? "text-destructive" : "text-green-600") }, msg.text));

		return h("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" },
			h("div", { className: "w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded border border-border bg-background p-5 space-y-3" }, kids));
	}

	// El panel es un componente propio para que los hooks vivan en su propia fibra
	// y no dependan de cómo invoque el juego a `render`.
	function MigrationPanel() {
		const React = api.utils && api.utils.React;
		const [selection, setSelection] = React.useState({});
		const [flagState, setFlagState] = React.useState(null);
		return renderMigrationBody(selection, setSelection, flagState, setFlagState);
	}

	try {
		if (api.ui && typeof api.ui.addToolbarPanel === "function") {
			api.ui.addToolbarPanel({
				id: "madrid-transit-pack-migration",
				icon: "RefreshCw",
				tooltip: "Migración de líneas",
				title: "Migrar líneas a tipos de Madrid",
				width: 560,
				render: () => api.utils.React.createElement(MigrationPanel),
				// El juego solo lee id/icon/tooltip/title/width/render; esta clave extra
				// la ignora. Existe para que el banco de pruebas en Node pueda ejercitar
				// el motor sin tener que abrir el juego.
				__engine: ENGINE
			});
			console.log(`${TAG} Migration panel registered.`);
		} else {
			console.log(`${TAG} api.ui.addToolbarPanel no disponible; panel de migración omitido.`);
		}
	} catch (err) {
		console.error(`${TAG} Failed to register migration panel:`, err);
	}

	try {
		if (api.ui && typeof api.ui.registerComponent === "function") {
			api.ui.registerComponent("main-menu", {
				id: "madrid-transit-pack-migration-tool",
				component: MigrationTool
			});
			console.log(`${TAG} Migration tool registered in the main menu.`);
		} else {
			console.log(`${TAG} api.ui.registerComponent no disponible; herramienta de migración omitida.`);
		}
	} catch (err) {
		console.error(`${TAG} Failed to register migration tool:`, err);
	}
})();
