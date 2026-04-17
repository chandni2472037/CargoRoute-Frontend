import axios from 'axios';

// DispatchService runs on port 7001
const BASE_URL = process.env.REACT_APP_DISPATCH_API_URL || 'http://localhost:7001';

const getErr = (e, fallback) =>
  typeof e?.response?.data === 'string' ? e.response.data : (e?.response?.data?.message || fallback);

/* ── DISPATCHES ─ base: /cargoRoute/dispatches ──────────────────── */

/** GET /cargoRoute/dispatches/getAllDispatches → List<DispatchResponseDTO> */
export const getAllDispatches = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/dispatches/getAllDispatches`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load dispatches. Is DispatchService running on port 7001?')); }
};

/** GET /cargoRoute/dispatches/getDispatchById/:id → DispatchResponseDTO */
export const getDispatchById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/dispatches/getDispatchById/${id}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, `Could not load dispatch #${id}.`)); }
};

/** GET /cargoRoute/dispatches/getDispatchByStatus/:status → List<DispatchResponseDTO> */
export const getDispatchesByStatus = async (status) => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/dispatches/getDispatchByStatus/${status}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load dispatches by status.')); }
};

/** GET /cargoRoute/dispatches/getAssigned-by/:assignedBy → List<DispatchResponseDTO> */
export const getDispatchesByAssignedBy = async (assignedBy) => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/dispatches/getAssigned-by/${assignedBy}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load dispatches.')); }
};

/** POST /cargoRoute/dispatches/createDispatch → DispatchDTO */
export const createDispatch = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/cargoRoute/dispatches/createDispatch`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not create dispatch.')); }
};

/** PUT /cargoRoute/dispatches/updateDispatch/:id → DispatchDTO */
export const updateDispatch = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/cargoRoute/dispatches/updateDispatch/${id}`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not update dispatch.')); }
};

/** DELETE /cargoRoute/dispatches/DeleteDispatch/:id */
export const deleteDispatch = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/cargoRoute/dispatches/DeleteDispatch/${id}`);
  } catch (e) { throw new Error(getErr(e, 'Could not delete dispatch.')); }
};

/* ── DRIVERS ─ base: /cargoRoute/drivers ────────────────────────── */

/** GET /cargoRoute/drivers/getAllDrivers → List<DriverDTO> */
export const getAllDrivers = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/drivers/getAllDrivers`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load drivers.')); }
};

/** GET /cargoRoute/drivers/getDriverByDriverId/:id → DriverDTO */
export const getDriverById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/drivers/getDriverByDriverId/${id}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, `Could not load driver #${id}.`)); }
};

/** GET /cargoRoute/drivers/getDriverByStatus/:status → List<DriverDTO> */
export const getDriversByStatus = async (status) => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/drivers/getDriverByStatus/${status}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load drivers by status.')); }
};

/** POST /cargoRoute/drivers/createDriver → DriverDTO */
export const createDriver = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/cargoRoute/drivers/createDriver`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not create driver.')); }
};

/** PUT /cargoRoute/drivers/updateDriver/:id → DriverDTO */
export const updateDriver = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/cargoRoute/drivers/updateDriver/${id}`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not update driver.')); }
};

/** DELETE /cargoRoute/drivers/deleteById/:id */
export const deleteDriver = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/cargoRoute/drivers/deleteById/${id}`);
  } catch (e) { throw new Error(getErr(e, 'Could not delete driver.')); }
};

/* ── DRIVER ACKNOWLEDGEMENTS ─ base: /cargoRoute/driver-acknowledgement */

/** GET /cargoRoute/driver-acknowledgement/getAllDriverAcknowledgement → List<DriverAckResponseDTO> */
export const getAllDriverAcks = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/driver-acknowledgement/getAllDriverAcknowledgement`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load driver acknowledgements.')); }
};

/** GET /cargoRoute/driver-acknowledgement/getByAckId/:id → DriverAckResponseDTO */
export const getDriverAckById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/driver-acknowledgement/getByAckId/${id}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, `Could not load ack #${id}.`)); }
};

/** GET /cargoRoute/driver-acknowledgement/getByDispatchId/:id → DriverAckResponseDTO */
export const getDriverAckByDispatch = async (dispatchId) => {
  try {
    const res = await axios.get(`${BASE_URL}/cargoRoute/driver-acknowledgement/getByDispatchId/${dispatchId}`);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not load ack for dispatch.')); }
};

/** POST /cargoRoute/driver-acknowledgement/createDriverAcknowledgement → DriverAckDTO */
export const createDriverAck = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/cargoRoute/driver-acknowledgement/createDriverAcknowledgement`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not create driver acknowledgement.')); }
};

/** PUT /cargoRoute/driver-acknowledgement/updateDriverAcknowledgement/:id → DriverAckDTO */
export const updateDriverAck = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/cargoRoute/driver-acknowledgement/updateDriverAcknowledgement/${id}`, data);
    return res.data;
  } catch (e) { throw new Error(getErr(e, 'Could not update driver acknowledgement.')); }
};

/** DELETE /cargoRoute/driver-acknowledgement/deleteDriverAck/:id */
export const deleteDriverAck = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/cargoRoute/driver-acknowledgement/deleteDriverAck/${id}`);
  } catch (e) { throw new Error(getErr(e, 'Could not delete driver acknowledgement.')); }
};
