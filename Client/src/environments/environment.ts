export const environment = {
  production: false,
  // Relative path — ng serve's proxy.conf.json forwards this to
  // http://localhost:8080 in local development, so the backend can
  // run on its normal port without any CORS involvement at all.
  apiUrl: '/api/blog'
};