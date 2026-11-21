import { defineConfig } from 'vitest/config';

//  Vitest solo mira los tests de src/ (la lógica y los datos). Las pruebas de
//  e2e/ son de Playwright y se ejecutan con `npm run e2e`.
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts']
    }
});
