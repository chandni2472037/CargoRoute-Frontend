import axios from 'axios';

// FleetService runs on port 8083
const BASE_URL = process.env.REACT_APP_FLEET_API_URL || 'http://localhost:8083';

const getErr = (e, fallback) =>
  typeof e?.response?.data === 'string' ? e.response.data : (e?.response?.data?.message || fallback);

/* ── VEHICLES ─ base: /vehicles ─────────────────────────────────── */

/** GET /vehicles → List<VehicleDTO> */
export const getAllVehicles = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/vehicles`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load vehicles. Is FleetService running on port 8083?')); }
};

/** GET /vehicles/:id → VehicleDTO */
export const getVehicleById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/vehicles/${id}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, `Could not load vehicle #${id}.`)); }
};

/** POST /vehicles → VehicleDTO */
export const createVehicle = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/vehicles`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not create vehicle.')); }
};

/* ── VEHICLE AVAILABILITY ─ base: /vehicleAvailability ──────────── */

/** GET /vehicleAvailability → List<VehicleAvailability> */
export const getAllVehicleAvailabilities = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/vehicleAvailability`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load vehicle availability.')); }
};

/** GET /vehicleAvailability/:id → VehicleAvailability */
export const getVehicleAvailabilityById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/vehicleAvailability/${id}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, `Could not load availability #${id}.`)); }
};

/** GET /vehicleAvailability/vehicle/:vehicleId → List<VehicleAvailability> */
export const getAvailabilitiesByVehicle = async (vehicleId) => {
  try {
    const res = await axios.get(`${BASE_URL}/vehicleAvailability/vehicle/${vehicleId}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, `Could not load availability for vehicle #${vehicleId}.`)); }
};

/** POST /vehicleAvailability → VehicleAvailability */
export const createVehicleAvailability = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/vehicleAvailability`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not create vehicle availability.')); }
};

/** PUT /vehicleAvailability/:id → VehicleAvailability */
export const updateVehicleAvailability = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/vehicleAvailability/${id}`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not update vehicle availability.')); }
};

/** DELETE /vehicleAvailability/:id */
export const deleteVehicleAvailability = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/vehicleAvailability/${id}`);
  } catch (e) { throw new Error(getErr(e, 'Could not delete vehicle availability.')); }
};
