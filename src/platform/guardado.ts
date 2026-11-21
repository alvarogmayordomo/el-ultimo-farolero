import { z } from 'zod';
import type { Partida } from '../core/partida';

//  Guardado de una sola partida en el navegador (localStorage). Se guarda al encender
//  un brasero y al morir (para no perder las estadísticas).
//
//  Lo leído se valida con Zod: si el guardado está corrupto o es de una versión vieja,
//  se trata como si no hubiera partida en vez de romper el juego.

const CLAVE = 'el-ultimo-farolero:partida';
const VERSION = 1;

const lista = z.array(z.string());

const esquemaPartida = z.object({
    nivel: z.string(),
    brasero: z.string().nullable(),
    experiencia: z.number().nonnegative(),
    equipo: lista,
    pociones: z.number().int().nonnegative(),
    braseros: lista,
    recogidos: lista,
    estadisticas: z.object({
        muertes: z.number().int().nonnegative(),
        enemigosVencidos: z.number().int().nonnegative(),
        tiempo: z.number().nonnegative()
    })
});

const esquemaGuardado = z.object({ version: z.literal(VERSION), partida: esquemaPartida });

//  Algo con la forma de localStorage (en los tests se usa uno en memoria)
export interface Almacen {
    getItem(clave: string): string | null;
    setItem(clave: string, valor: string): void;
    removeItem(clave: string): void;
}

//  localStorage puede no existir o lanzar errores (modo privado, almacenamiento lleno…)
function almacenDelNavegador(): Almacen | null {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
        return null;
    }
}

export function guardar(partida: Partida, almacen = almacenDelNavegador()): boolean {
    try {
        almacen?.setItem(CLAVE, JSON.stringify({ version: VERSION, partida }));
        return almacen !== null;
    } catch {
        return false;
    }
}

export function cargar(almacen = almacenDelNavegador()): Partida | null {
    try {
        const texto = almacen?.getItem(CLAVE);

        if (!texto) {
            return null;
        }

        const resultado = esquemaGuardado.safeParse(JSON.parse(texto));

        return resultado.success ? resultado.data.partida : null;
    } catch {
        return null;
    }
}

export function hayPartida(almacen = almacenDelNavegador()): boolean {
    return cargar(almacen) !== null;
}

export function borrar(almacen = almacenDelNavegador()) {
    try {
        almacen?.removeItem(CLAVE);
    } catch {
        //  Si no se puede borrar, no pasa nada: la próxima partida nueva lo sobrescribe
    }
}
