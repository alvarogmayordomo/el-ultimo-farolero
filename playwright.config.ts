import { defineConfig, devices } from '@playwright/test';

//  Pruebas de punta a punta: abren el juego en un Chromium sin ventana y lo juegan.
//  Usan el servidor de desarrollo porque ahí existe `window.juego` para inspeccionarlo.
export default defineConfig({
    testDir: 'e2e',
    timeout: 60_000,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: 'http://localhost:8080',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000
    }
});
