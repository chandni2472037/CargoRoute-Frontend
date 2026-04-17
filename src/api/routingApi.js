import axios from 'axios';

// RoutingService runs on port 8085
const BASE_URL = process.env.REACT_APP_ROUTING_API_URL || 'http://localhost:8085';

const getErr = (e, fallback) =>
  typeof e?.response?.data === 'string' ? e.response.data : (e?.response?.data?.message || fallback);

/* ── LOADS ─ base: /loads ───────────────────────────────────────── */

/** GET /loads → List<RequiredResponseDTO {load, route}> */
export const getAllLoads = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/loads`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load loads. Is RoutingService running on port 8085?')); }
};

/** GET /loads/:id → RequiredResponseDTO */
export const getLoadById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/loads/${id}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, `Could not load load #${id}.`)); }
};

/** POST /loads → LoadDTO */
export const createLoad = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/loads`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not create load.')); }
};

/** PUT /loads/:id → LoadDTO */
export const updateLoad = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/loads/${id}`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not update load.')); }
};

/** DELETE /loads/:id */
export const deleteLoad = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/loads/${id}`);
  } catch (e) { throw new Error(getErr(e, 'Could not delete load.')); }
};

/* ── ROUTES ─ base: /routes ─────────────────────────────────────── */

/** GET /routes → List<RouteDTO> */
export const getAllRoutes = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/routes`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load routes.')); }
};

/** GET /routes/:id → RouteDTO */
export const getRouteById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/routes/${id}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, `Could not load route #${id}.`)); }
};

/** GET /routes/load/:loadId → List<RouteDTO> */
export const getRoutesByLoad = async (loadId) => {
  try {
    const res = await axios.get(`${BASE_URL}/routes/load/${loadId}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load routes for load.')); }
};

/** GET /routes/vehicle/:vehicleId → List<RouteDTO> */
export const getRoutesByVehicle = async (vehicleId) => {
  try {
    const res = await axios.get(`${BASE_URL}/routes/vehicle/${vehicleId}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load routes for vehicle.')); }
};

/** POST /routes → RouteDTO */
export const createRoute = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/routes`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not create route.')); }
};

/** PUT /routes/:id → RouteDTO */
export const updateRoute = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/routes/${id}`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not update route.')); }
};

/** DELETE /routes/:id */
export const deleteRoute = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/routes/${id}`);
  } catch (e) { throw new Error(getErr(e, 'Could not delete route.')); }
};

/* ── ROUTING RULES ─ base: /routingRules ────────────────────────── */

/** GET /routingRules → List<RoutingRuleDTO> */
export const getAllRoutingRules = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/routingRules`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load routing rules.')); }
};

/** GET /routingRules/active → List<RoutingRuleDTO> */
export const getActiveRoutingRules = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/routingRules/active`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load active routing rules.')); }
};

/** GET /routingRules/:id → RoutingRuleDTO */
export const getRoutingRuleById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/routingRules/${id}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, `Could not load routing rule #${id}.`)); }
};

/** POST /routingRules → RoutingRuleDTO */
export const createRoutingRule = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/routingRules`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not create routing rule.')); }
};

/** PUT /routingRules/:id → RoutingRuleDTO */
export const updateRoutingRule = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/routingRules/${id}`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not update routing rule.')); }
};

/** DELETE /routingRules/:id */
export const deleteRoutingRule = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/routingRules/${id}`);
  } catch (e) { throw new Error(getErr(e, 'Could not delete routing rule.')); }
};
