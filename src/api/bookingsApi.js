import axios from 'axios';

// BookingService runs on port 7070 (no Spring Security – no auth header needed)
const BASE_URL = process.env.REACT_APP_BOOKINGS_API_URL || 'http://localhost:7070';

/** GET /cargoRoute/getBookings */
export const getAllBookings = () =>
  axios.get(`${BASE_URL}/cargoRoute/getBookings`).then(r => r.data);

/** GET /cargoRoute/getBooking/:id */
export const getBookingById = (id) =>
  axios.get(`${BASE_URL}/cargoRoute/getBooking/${id}`).then(r => r.data);

/** POST /cargoRoute/addBooking */
export const createBooking = (data) =>
  axios.post(`${BASE_URL}/cargoRoute/addBooking`, data).then(r => r.data);

/** PATCH /cargoRoute/updateBookingStatus/:id?status=STATUS */
export const updateBookingStatus = (id, status) =>
  axios.patch(`${BASE_URL}/cargoRoute/updateBookingStatus/${id}`, null, {
    params: { status },
  }).then(r => r.data);

/** GET /cargoRoute/getBookingsByStatus/:status */
export const getBookingsByStatus = (status) =>
  axios.get(`${BASE_URL}/cargoRoute/getBookingsByStatus/${status}`).then(r => r.data);

/** GET /cargoRoute/getBookingsByShipper/:shipperId */
export const getBookingsByShipper = (shipperId) =>
  axios.get(`${BASE_URL}/cargoRoute/getBookingsByShipper/${shipperId}`).then(r => r.data);

/* ── Shippers ───────────────────────────────────────────────────── */

/** GET /cargoRoute/getShippers */
export const getAllShippers = () =>
  axios.get(`${BASE_URL}/cargoRoute/getShippers`).then(r => r.data);

/** GET /cargoRoute/getShipper/:id */
export const getShipperById = (id) =>
  axios.get(`${BASE_URL}/cargoRoute/getShipper/${id}`).then(r => r.data);

/** POST /cargoRoute/addShipper */
export const createShipper = (data) =>
  axios.post(`${BASE_URL}/cargoRoute/addShipper`, data).then(r => r.data);

/** PUT /cargoRoute/updateShipper/:id */
export const updateShipper = (id, data) =>
  axios.put(`${BASE_URL}/cargoRoute/updateShipper/${id}`, data).then(r => r.data);
