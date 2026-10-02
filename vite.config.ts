import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Actions supplies /repository-name/; relative paths also support arbitrary static folders.
export default defineConfig({ plugins: [react()], base: process.env.VITE_BASE_PATH || './' })
