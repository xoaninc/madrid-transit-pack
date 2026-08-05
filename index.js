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
			elevationMultipliers: {
				DEEP_BORE: 3.8,
				STANDARD_TUNNEL: 1.7,
				CUT_AND_COVER: 0.9,
				TRENCHED: 0.5,
				AT_GRADE: 0.35,
				RAMP: 0.5,
				ELEVATED: 0.8
			},
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
			// ELEVATED a 0.8 (el default del motor) y no al 1.5 del tram vanilla: con 1.5
			// el viaducto de metro ligero salía a 24.000 €/m, igual que el de gran perfil
			// y por encima del de gálibo estrecho (21.600). Un viaducto ligero es el más
			// barato de los cuatro, no el más caro.
			elevationMultipliers: { AT_GRADE: 0.2, ELEVATED: 0.8 },
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
				// andén de 100 m dejaba -0,02 m de margen y solo colaba por el epsilon de
				// +0,2 m del motor. Con 101 hay +0,98 m, en línea con los otros tres tipos.
				minStationLength: 101,
				maxStationLength: 210,
				baseTrackCost: 46750,
				baseStationCost: 63750000,
				trainOperationalCostPerHour: 520,
				carOperationalCostPerHour: 52,
				scissorsCrossoverCost: 12750000,
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
			elevationMultipliers: {
				DEEP_BORE: 6.01,
				STANDARD_TUNNEL: 2.67,
				CUT_AND_COVER: 1.41,
				AT_GRADE: 0.3,
				ELEVATED: 0.8
			},
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
})();
