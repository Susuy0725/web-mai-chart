import { defineConfig } from 'vite'

import fs from 'fs'
import path from 'path'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
    },
    host: '0.0.0.0', // 可以改成 0.0.0.0 若要其他設備訪問
    port: 5173,
  },
})
