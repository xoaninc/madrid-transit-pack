(function () {
	const api = window.SubwayBuilderAPI;
	const TAG = "[madrid-transit-pack]";

	// Unidades del juego: velocidades en m/s, aceleraciones en m/s², longitudes en metros.
	// 22.22 m/s = 80 km/h · 19.44 = 70 km/h · 38.89 = 140 km/h
	//
	// Datos reales (v0.9.0):
	// - Red Metro de Madrid: radio mínimo 90 m, pendiente máxima 5% (Normativa Técnica Básica de Vía, Metro de Madrid 2017)
	// - S/3000: aceleración 1,0 m/s², 80 km/h, 6 coches = 89,38 m, 734 plazas (Vía Libre / Wikipedia)
	// - S/8000-9000: 80 km/h, ~200 plazas/coche gálibo ancho (Wikipedia)
	// - Citadis 302: 32,5 m, 2,65 m, 70 km/h, radio mínimo 25 m (Alstom/Trainspo)
	// - S/452 (Alstom X'Trapolis): 140 km/h, caja de 3,10 m, 905-927 plazas por unidad
	//   de 100 m (6 coches, 2 de dos pisos), trenes de 100 o 200 m (Wikipedia/Geotren)

	const TYPES = [
		{
			id: "madrid-metro-estrecho",
			name: "Metro Madrid (perfil estrecho)",
			description:
				"Red de gálibo estrecho de Metro de Madrid (L1-L5 y Ramal). Basado en la Serie 3000 de CAF: caja de 2,30 m, coches de 14,9 m en composiciones de 4-6 (59,94-89,38 m reales) para andenes de 60-90 m. Radio mínimo 90 m y pendiente máxima 5%, según la normativa técnica real de Metro de Madrid. Túneles más baratos por el gálibo reducido (6,86 m). Los ramales entre líneas de esta red son totalmente compatibles.",
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
				maxStationLength: 90,
				baseTrackCost: 27000,
				baseStationCost: 45000000,
				trainOperationalCostPerHour: 220,
				carOperationalCostPerHour: 22,
				stopTimeSeconds: 20,
				parallelTrackSpacing: 3.4,
				trackClearance: 0.9,
				maxLateralAcceleration: 1,
				minTurnRadius: 90,
				minStationTurnRadius: 400,
				maxSlopePercentage: 5,
				trackMaintenanceCostPerMeter: 160,
				stationMaintenanceCostPerYear: 140000,
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
				"Red de gran perfil de Metro de Madrid (L6-L12). Basado en las Series 8000/9000: caja de 2,80 m, coches de ~18 m en composiciones de 3-6 para andenes de hasta 115 m como los de la L10. Radio mínimo 90 m y pendiente máxima 5%, según la normativa técnica real de Metro de Madrid.",
			stats: {
				maxAcceleration: 1.0,
				maxDeceleration: 1.2,
				maxSpeed: 22.22,
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
				parallelTrackSpacing: 3.81,
				trackClearance: 1,
				maxLateralAcceleration: 1,
				minTurnRadius: 90,
				minStationTurnRadius: 400,
				maxSlopePercentage: 5,
				trackMaintenanceCostPerMeter: 180,
				stationMaintenanceCostPerYear: 160000,
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
				"Metro Ligero de Madrid (ML1-ML3). Basado en el Alstom Citadis 302: unidades articuladas de 32,5 m y 2,65 m de ancho, en simple o doble composición, 70 km/h. Radio mínimo real de 25 m (exento de la norma de 90 m de la red de metro) y rampas de hasta 6,5%. Puede circular en superficie compartiendo calle y cruzar a nivel.",
			stats: {
				maxAcceleration: 1.03,
				maxDeceleration: 1.5,
				maxSpeed: 19.44,
				maxSpeedLocalStation: 10,
				capacityPerCar: 200,
				carLength: 32.5,
				minCars: 1,
				maxCars: 2,
				carsPerCarSet: 1,
				carCost: 3200000,
				trainWidth: 2.65,
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
				trackMaintenanceCostPerMeter: 120,
				stationMaintenanceCostPerYear: 25000,
				tphLimit: 40,
				crossoverSpeed: 6.7
			},
			compatibleTrackTypes: ["madrid-metro-ligero"],
			appearance: { color: "#78be20" },
			elevationMultipliers: { AT_GRADE: 0.2, ELEVATED: 1.5 },
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
				"Red de Cercanías de Madrid. Basado en la Serie 452 real de Renfe (Alstom X'Trapolis, entregas 2025-2026): unidades de 6 coches y 100 m con 2 coches centrales de dos pisos, ~905 plazas por unidad, caja de 3,10 m y 140 km/h. Trenes de 100 o 200 m (1 o 2 unidades). Pendiente máxima 3% (estimación de proyecto; sin dato oficial publicado). Admite pasos a nivel. Toda la red de Cercanías es interoperable entre sí.",
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
				minStationLength: 105,
				maxStationLength: 210,
				baseTrackCost: 46750,
				baseStationCost: 63750000,
				trainOperationalCostPerHour: 520,
				carOperationalCostPerHour: 52,
				scissorsCrossoverCost: 12750000,
				stopTimeSeconds: 40,
				parallelTrackSpacing: 3.76,
				trackClearance: 1.86,
				maxLateralAcceleration: 1.68,
				minTurnRadius: 90,
				minStationTurnRadius: 1400,
				maxSlopePercentage: 3.5,
				trackMaintenanceCostPerMeter: 200,
				stationMaintenanceCostPerYear: 50000,
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
