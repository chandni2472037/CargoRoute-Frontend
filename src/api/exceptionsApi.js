import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8084';

// ── Exceptions ──────────────────────────────────────────────────────────────

/** GET /cargoRoute/exception/getExceptions → List<RequiredResponseDTO> */
export const getAllExceptions = () =>
  axios.get(`${BASE_URL}/cargoRoute/exception/getExceptions`).then((r) => r.data);

/** GET /cargoRoute/exception/getExceptionByID/:id → RequiredResponseDTO */
export const getExceptionById = (id) =>
  axios.get(`${BASE_URL}/cargoRoute/exception/getExceptionByID/${id}`).then((r) => r.data);

/** POST /cargoRoute/exception/addException → ExceptionRecordDTO (201) */
export const createException = (data) =>
  axios.post(`${BASE_URL}/cargoRoute/exception/addException`, data).then((r) => r.data);

/** PATCH /cargoRoute/exception/updateExceptionStatus/:id  { status } */
export const updateExceptionStatus = (id, status) =>
  axios
    .patch(`${BASE_URL}/cargoRoute/exception/updateExceptionStatus/${id}`, { status })
    .then((r) => r.data);

/** GET /cargoRoute/exception/getExceptionByBookingID/:bookingId → List<RequiredResponseDTO> */
export const getExceptionsByBooking = (bookingId) =>
  axios
    .get(`${BASE_URL}/cargoRoute/exception/getExceptionByBookingID/${bookingId}`)
    .then((r) => r.data);

/** GET /cargoRoute/exception/getExceptionByStatus/:status → List<RequiredResponseDTO> */
export const getExceptionsByStatus = (status) =>
  axios
    .get(`${BASE_URL}/cargoRoute/exception/getExceptionByStatus/${status}`)
    .then((r) => r.data);

// ── Claims ───────────────────────────────────────────────────────────────────

/** GET /cargoRoute/claim/getClaims → List<ClaimDTO> */
export const getAllClaims = () =>
  axios.get(`${BASE_URL}/cargoRoute/claim/getClaims`).then((r) => r.data);

/** GET /cargoRoute/claim/getClaimByID/:id → ClaimDTO */
export const getClaimById = (id) =>
  axios.get(`${BASE_URL}/cargoRoute/claim/getClaimByID/${id}`).then((r) => r.data);

/** POST /cargoRoute/claim/addClaim → ClaimDTO (201) */
export const createClaim = (data) =>
  axios.post(`${BASE_URL}/cargoRoute/claim/addClaim`, data).then((r) => r.data);

/** PATCH /cargoRoute/claim/updateClaimStatus/:id  { status } */
export const updateClaimStatus = (id, status) =>
  axios
    .patch(`${BASE_URL}/cargoRoute/claim/updateClaimStatus/${id}`, { status })
    .then((r) => r.data);

/** GET /cargoRoute/claim/getClaimByExceptionID/:exceptionId → List<ClaimDTO> */
export const getClaimsByException = (exceptionId) =>
  axios
    .get(`${BASE_URL}/cargoRoute/claim/getClaimByExceptionID/${exceptionId}`)
    .then((r) => r.data);

/** GET /cargoRoute/claim/getClaimByStatus/:status → List<ClaimDTO> */
export const getClaimsByStatus = (status) =>
  axios.get(`${BASE_URL}/cargoRoute/claim/getClaimByStatus/${status}`).then((r) => r.data);
