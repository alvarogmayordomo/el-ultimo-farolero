import type { Objeto } from '../core/equipo';
import enemigosJson from './enemigos.json';
import { esquemaEnemigos, esquemaNiveles, esquemaObjetos } from './esquemas';
import nivelesJson from './niveles.json';
import objetosJson from './objetos.json';

//  Punto único de acceso a los datos del juego. Cada JSON se valida con su esquema al
//  cargar el módulo: si un dato está mal, falla aquí con un mensaje claro en vez de
//  provocar un error raro a mitad de partida.

export const ENEMIGOS = esquemaEnemigos.parse(enemigosJson);
export const OBJETOS = esquemaObjetos.parse(objetosJson);
export const NIVELES = esquemaNiveles.parse(nivelesJson);

//  Un objeto de objetos.json en la forma que entiende src/core/equipo
export function objetoPorId(id: string): Objeto | null {
    const datos = OBJETOS[id];

    return datos ? { id, nombre: datos.nombre, ranura: datos.ranura, atq: datos.atq, def: datos.def } : null;
}

export function indiceDeNivel(id: string): number {
    return NIVELES.findIndex((nivel) => nivel.id === id);
}
