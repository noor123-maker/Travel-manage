module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ps', 'fa'],
  },
  fallbackLng: {
    default: ['en'],
    ps: ['en'],
    fa: ['en'],
  },
  debug: false,
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}
