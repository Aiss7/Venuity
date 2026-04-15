// ---------------------------------------------------------------------------
// OSRM Routing Types
// Mirrors the response shape of:
// https://router.project-osrm.org/route/v1/driving/...?steps=true&geometries=geojson&overview=full
// ---------------------------------------------------------------------------

export interface OsrmManeuver {
  /** Human-readable driving instruction, e.g. "Turn left onto Main St" */
  instruction: string;
  type: string;
  modifier?: string;
  bearing_after: number;
  bearing_before: number;
  location: [number, number]; // [lng, lat]
}

export interface OsrmStep {
  name: string;
  distance: number;   // metres
  duration: number;   // seconds
  maneuver: OsrmManeuver;
  mode: string;
}

export interface OsrmLeg {
  distance: number;  // metres
  duration: number;  // seconds
  steps: OsrmStep[];
  summary: string;
}

/** GeoJSON LineString geometry returned by OSRM with geometries=geojson */
export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] pairs
}

export interface OsrmRoute {
  distance: number;       // total metres
  duration: number;       // total seconds
  geometry: RouteGeometry;
  legs: OsrmLeg[];
}

export interface OsrmResponse {
  code: string;           // 'Ok' on success
  routes: OsrmRoute[];
  waypoints: Array<{
    hint: string;
    distance: number;
    name: string;
    location: [number, number];
  }>;
}
