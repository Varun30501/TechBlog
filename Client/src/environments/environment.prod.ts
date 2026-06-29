export const environment = {
  production: true,
  // Frontend (Vercel) and backend (Render) are on separate domains, so this
  // MUST be the full absolute URL of your deployed backend — a relative path
  // like '/api/blog' would resolve against Vercel's own domain and 404.
  // Replace with your actual Render URL before deploying.
  apiUrl: 'https://techblog-gg6f.onrender.com/api/blog'
};