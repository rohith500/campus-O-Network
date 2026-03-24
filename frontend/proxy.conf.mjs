export default {
  '/mock': {
    target: 'https://mocka.ouim.me',
    changeOrigin: true,
    secure: true,
  },
  '/study': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false,
  },
};
