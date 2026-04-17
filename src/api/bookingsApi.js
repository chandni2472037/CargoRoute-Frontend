import axios from 'axios';

// BookingService runs on port 7070
const BASE_URL = process.env.REACT_APP_BOOKINGS_API_URL || 'http://localhost:7070';

const getErr = (e, fallback) =>
  typeof e?.response?.data === 'string' ? e.response.data : (e?.response?.data?.message || fallback);

/* ── Bookings ── controller base: /cargoRoute/booking ─────────── */

/** GET /cargoRoute/booking/getBookings */
export const getAllBookings = () =>
  axios.get(`${BASE_URL}/cargoRoute/booking/getBookings`).then(r => r.data);

/** GET /cargoRoute/booking/getBooking/:id */
export const getBookingById = (id) =>
  axios.get(`${BASE_URL}/cargoRoute/booking/getBooking/${id}`).then(r => r.data);

/** POST /cargoRoute/booking/addBooking */
export const createBooking = (data) =>
  axios.post(`${BASE_URL}/cargoRoute/booking/addBooking`, data).then(r => r.data);

/** PATCH /cargoRoute/booking/updateBookingStatus/:id?status=STATUS */
export const updateBookingStatus = (id, status) =>
  axios.patch(`${BASE_URL}/cargoRoute/booking/updateBookingStatus/${id}`, null, {
    params: { status },
  }).then(r => r.data);

/** GET /cargoRoute/booking/getBookingsByStatus/:status */
export const getBookingsByStatus = (status) =>
  axios.get(`${BASE_URL}/cargoRoute/booking/getBookingsByStatus/${status}`).then(r => r.data);

/** GET /cargoRoute/booking/getBookingsByShipper/:shipperId */
export const getBookingsByShipper = (shipperId) =>
  axios.get(`${BASE_URL}/cargoRoute/booking/getBookingsByShipper/${shipperId}`).then(r => r.data);

/** POST /cargoRoute/booking/importBookings (multipart) */
export const importBookings = (formData) =>
  axios.post(`${BASE_URL}/cargoRoute/booking/importBookings`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);

/* ── Shippers ── controller base: /cargoRoute/shipper ─────────── */

/** GET /cargoRoute/shipper/getShippers */
export const getAllShippers = () =>
  axios.get(`${BASE_URL}/cargoRoute/shipper/getShippers`).then(r => r.data);

/** GET /cargoRoute/shipper/getShipper/:id */
export const getShipperById = (id) =>
  axios.get(`${BASE_URL}/cargoRoute/shipper/getShipper/${id}`).then(r => r.data);

/** POST /cargoRoute/shipper/addShipper */
export const createShipper = (data) =>
  axios.post(`${BASE_URL}/cargoRoute/shipper/addShipper`, data).then(r => r.data);

/** PUT /cargoRoute/shipper/updateShipper/:id */
export const updateShipper = (id, data) =>
  axios.put(`${BASE_URL}/cargoRoute/shipper/updateShipper/${id}`, data).then(r => r.data);

/** GET /cargoRoute/shipper/getShippersByStatus/:status */
export const getShippersByStatus = (status) =>
  axios.get(`${BASE_URL}/cargoRoute/shipper/getShippersByStatus/${status}`).then(r => r.data);
