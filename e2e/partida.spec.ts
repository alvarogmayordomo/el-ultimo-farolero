import { expect, type Page, test } from '@playwright/test';

//  La prueba del plan, automatizada: empezar, encender un brasero, morir, «cerrar el
//  navegador» (recargar) y continuar desde ese brasero. Además, que no salga ningún error.

type Juego = {
    scene: {
        getScenes(activas: boolean): { sys: { settings: { key: string } } }[];
        getScene(clave: string): unknown;
    };
};

//  Lo que se lee de la escena Game desde el navegador
type EscenaGame = {
    jugador: {
        x: number;
        y: number;
        body: { reset(x: number, y: number): void };
        luchador: { perderPv(n: number): void };
    };
    braseros: { x: number; y: number; encendido: boolean }[];
};

async function escenasActivas(pagina: Page): Promise<string[]> {
    return pagina.evaluate(() =>
        (window as unknown as { juego: Juego }).juego.scene.getScenes(true).map((s) => s.sys.settings.key)
    );
}

//  Pulsa una tecla como una persona: la mantiene 100 ms (varios fotogramas del juego)
async function pulsar(pagina: Page, tecla: string) {
    await pagina.keyboard.down(tecla);
    await pagina.waitForTimeout(100);
    await pagina.keyboard.up(tecla);
}

async function esperarEscena(pagina: Page, clave: string) {
    await expect.poll(() => escenasActivas(pagina), { timeout: 15_000 }).toContain(clave);
}

test('se juega, se guarda en un brasero y se continúa tras cerrar el navegador', async ({ page }) => {
    const errores: string[] = [];
    page.on('pageerror', (error) => errores.push(error.message));
    page.on('console', (mensaje) => {
        if (mensaje.type() === 'error' && !mensaje.text().includes('WebSocket')) {
            errores.push(mensaje.text());
        }
    });

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    //  Título → Nueva partida (es la primera opción si no hay partida guardada)
    await esperarEscena(page, 'MainMenu');
    await pulsar(page, 'Enter');
    await esperarEscena(page, 'Game');
    await esperarEscena(page, 'Hud');

    //  Ir junto al primer brasero y encenderlo con E
    await page.evaluate(() => {
        const juego = (window as unknown as { juego: Juego }).juego;
        const game = juego.scene.getScene('Game') as EscenaGame;
        const brasero = game.braseros[0];
        game.jugador.body.reset(brasero.x, brasero.y + 18);
    });
    await page.waitForTimeout(100);
    await pulsar(page, 'KeyE');

    await expect
        .poll(() => page.evaluate(() => localStorage.getItem('el-ultimo-farolero:partida')))
        .toContain('"brasero":"nivel-1:');

    //  Moverse un poco con el teclado y atacar, para ejercitar el bucle normal
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyD');
    await pulsar(page, 'KeyJ');
    await pulsar(page, 'KeyK');

    //  Morir → «Has caído»
    await page.evaluate(() => {
        const juego = (window as unknown as { juego: Juego }).juego;
        (juego.scene.getScene('Game') as EscenaGame).jugador.luchador.perderPv(9999);
    });
    await esperarEscena(page, 'GameOver');

    //  «Cerrar el navegador» y volver: el título ofrece Continuar
    await page.reload();
    await esperarEscena(page, 'MainMenu');
    await pulsar(page, 'Enter');
    await esperarEscena(page, 'Game');

    //  Aparece junto al brasero encendido, no en el inicio del nivel
    const estado = await page.evaluate(() => {
        const juego = (window as unknown as { juego: Juego }).juego;
        const game = juego.scene.getScene('Game') as EscenaGame;
        const brasero = game.braseros[0];
        return {
            encendido: brasero.encendido,
            distancia: Math.hypot(game.jugador.x - brasero.x, game.jugador.y - brasero.y)
        };
    });

    expect(estado.encendido).toBe(true);
    expect(estado.distancia).toBeLessThan(30);
    expect(errores).toEqual([]);
});

//  Fallo real encontrado jugando: la Lanza de Luz contra la Guardiana colgaba el juego
//  («lanza.apagar is not a function») porque Phaser pasaba los objetos al revés.
test('la Lanza de Luz daña a la Guardiana sin colgar el juego', async ({ page }) => {
    const errores: string[] = [];
    page.on('pageerror', (error) => errores.push(error.message));

    await page.goto('/');
    await esperarEscena(page, 'MainMenu');

    //  Empieza directamente en el Pozo, a nivel alto y con la Guardiana a tiro
    await page.evaluate(() => {
        const juego = (window as unknown as { juego: Juego & { registry: { set(k: string, v: unknown): void } } })
            .juego;
        juego.registry.set('partida', {
            nivel: 'pozo',
            brasero: null,
            experiencia: 400,
            equipo: ['gran-espada'],
            pociones: 0,
            braseros: [],
            recogidos: [],
            estadisticas: { muertes: 0, enemigosVencidos: 0, tiempo: 0 }
        });
        (juego.scene.getScene('MainMenu') as { scene: { start(k: string): void } }).scene.start('Game');
    });
    await esperarEscena(page, 'Game');

    const pvGuardiana = () =>
        page.evaluate(() => {
            const juego = (window as unknown as { juego: Juego }).juego;
            const game = juego.scene.getScene('Game') as { guardiana: { luchador: { pv: number } } };
            return game.guardiana.luchador.pv;
        });
    const pvInicial = await pvGuardiana();

    await page.evaluate(() => {
        const juego = (window as unknown as { juego: Juego }).juego;
        const game = juego.scene.getScene('Game') as EscenaGame & {
            guardiana: { x: number; y: number };
            jugador: { mirando: string };
        };
        game.jugador.body.reset(game.guardiana.x - 60, game.guardiana.y + 12);
        game.jugador.mirando = 'derecha';
    });
    await pulsar(page, 'KeyL');

    await expect.poll(pvGuardiana).toBeLessThan(pvInicial);
    //  El juego sigue vivo: el bucle avanza y no hay errores
    await page.waitForTimeout(500);
    expect(await escenasActivas(page)).toContain('Game');
    expect(errores).toEqual([]);
});

test('los créditos se abren desde el título', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await esperarEscena(page, 'MainMenu');

    await pulsar(page, 'ArrowDown');
    await pulsar(page, 'Enter');
    await esperarEscena(page, 'Creditos');
});
