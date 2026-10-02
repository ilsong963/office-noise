// Encode each segment separately so category folders also work on GitHub Pages.
export const soundUrl = (file: string) => `${import.meta.env.BASE_URL}assets/sounds/${file.split('/').map(encodeURIComponent).join('/')}`
