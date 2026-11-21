import { describe, expect, it } from 'vitest';
import {
    ALCANCE_ZARPAZO,
    ComportamientoGuardiana,
    DETECCION_GUARDIANA,
    dentroDelZarpazo,
    INTERVALO_APAGAR,
    RAPIDEZ_FASE_2,
    TIEMPOS_GUARDIANA as T
} from './guardiana';

//  Avanza la Guardiana desde «ahora» hasta que cambie de estado, con el jugador a «distancia»
function avanzar(g: ComportamientoGuardiana, desde: number, ms: number, distancia: number, pv = 1) {
    const eventos: string[] = [];
    for (let t = desde; t <= desde + ms; t += 10) {
        const evento = g.actualizar(t, distancia, pv);
        if (evento) {
            eventos.push(evento);
        }
    }
    return eventos;
}

describe('Guardiana del Pozo: fase 1', () => {
    it('duerme hasta que el farolero se acerca', () => {
        const g = new ComportamientoGuardiana();
        g.actualizar(0, DETECCION_GUARDIANA + 1, 1);
        expect(g.estado).toBe('dormida');
        expect(g.vulnerable).toBe(false);

        g.actualizar(10, DETECCION_GUARDIANA, 1);
        expect(g.estado).toBe('acechar');
    });

    it('cerca, prepara un zarpazo y golpea al terminar el aviso', () => {
        const g = new ComportamientoGuardiana();
        g.actualizar(0, 30, 1);
        g.actualizar(T.acechar, 30, 1);
        expect(g.estado).toBe('prepararZarpazo');

        expect(g.actualizar(T.acechar + T.prepararZarpazo, 30, 1)).toBe('golpeZarpazo');
        expect(g.estado).toBe('zarpazo');
    });

    it('lejos, salta: en el aire no recibe daño y al caer avisa del aterrizaje', () => {
        const g = new ComportamientoGuardiana();
        g.actualizar(0, 100, 1);
        g.actualizar(T.acechar, 100, 1);
        expect(g.estado).toBe('prepararSalto');

        g.actualizar(T.acechar + T.prepararSalto, 100, 1);
        expect(g.estado).toBe('salto');
        expect(g.vulnerable).toBe(false);

        expect(g.actualizar(T.acechar + T.prepararSalto + T.salto, 100, 1)).toBe('aterrizaje');
        expect(g.estado).toBe('recuperar');
    });

    it('encender un brasero en la fase 1 no la aturde', () => {
        const g = new ComportamientoGuardiana();
        g.actualizar(0, 30, 1);

        expect(g.braseroEncendido(10)).toBe(false);
        expect(g.estado).toBe('acechar');
    });

    it('un golpe la despierta', () => {
        const g = new ComportamientoGuardiana();
        g.despertar(0);

        expect(g.estado).toBe('acechar');
    });
});

describe('Guardiana del Pozo: fase 2', () => {
    it('con la mitad de PV pasa a la fase 2 y apaga los braseros', () => {
        const g = new ComportamientoGuardiana();
        g.actualizar(0, 30, 1);
        g.actualizar(10, 30, 0.5);
        expect(g.fase).toBe(2);
        expect(g.estado).toBe('apagando');

        expect(avanzar(g, 20, T.apagando, 30, 0.5)).toContain('apagarBraseros');
        expect(g.estado).toBe('acechar');
    });

    it('encender un brasero la aturde', () => {
        const g = new ComportamientoGuardiana();
        g.actualizar(0, 30, 1);
        g.actualizar(10, 30, 0.4);
        avanzar(g, 20, T.apagando, 30, 0.4);

        expect(g.braseroEncendido(2000)).toBe(true);
        expect(g.estado).toBe('aturdida');
        expect(g.vulnerable).toBe(true);

        //  El aturdimiento dura lo mismo en la fase 2
        g.actualizar(2000 + T.aturdida - 10, 30, 0.4);
        expect(g.estado).toBe('aturdida');
        g.actualizar(2000 + T.aturdida, 30, 0.4);
        expect(g.estado).toBe('acechar');
    });

    it('vuelve a apagar los braseros cada cierto tiempo', () => {
        const g = new ComportamientoGuardiana();
        g.actualizar(0, 100, 1);
        g.actualizar(10, 100, 0.4);
        const eventos = avanzar(g, 20, INTERVALO_APAGAR + 5000, 100, 0.4);

        expect(eventos.filter((e) => e === 'apagarBraseros')).toHaveLength(2);
    });

    it('ataca más deprisa', () => {
        const g = new ComportamientoGuardiana();
        g.actualizar(0, 30, 1);
        g.actualizar(10, 30, 0.4);
        avanzar(g, 20, T.apagando, 30, 0.4);
        const inicio = 20 + T.apagando;

        g.actualizar(inicio + T.acechar * RAPIDEZ_FASE_2 + 10, 30, 0.4);
        expect(g.estado).toBe('prepararZarpazo');
    });
});

describe('dentroDelZarpazo', () => {
    it('alcanza delante y a los lados, no detrás ni lejos', () => {
        expect(dentroDelZarpazo(20, 0, 1, 0)).toBe(true);
        expect(dentroDelZarpazo(10, 15, 1, 0)).toBe(true);
        expect(dentroDelZarpazo(-20, 0, 1, 0)).toBe(false);
        expect(dentroDelZarpazo(ALCANCE_ZARPAZO + 1, 0, 1, 0)).toBe(false);
    });
});
