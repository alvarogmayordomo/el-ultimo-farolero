//  Estado de una partida: todo lo que hay que recordar para continuar desde el último
//  brasero. Lógica pura: guardarlo en el navegador es cosa de src/platform/guardado.ts.
//
//  Las «claves» identifican cosas concretas de un mapa: «<nivel>:<id del objeto en Tiled>».

export interface EstadisticasPartida {
    muertes: number;
    enemigosVencidos: number;
    //  Tiempo jugado en ms
    tiempo: number;
}

export interface Partida {
    //  Id del nivel (src/data/niveles.json) en el que se está
    nivel: string;
    //  Clave del último brasero encendido en ese nivel (se reaparece a su lado), o null
    brasero: string | null;
    experiencia: number;
    //  Ids de objetos.json equipados
    equipo: string[];
    pociones: number;
    //  Claves de los braseros encendidos y de los objetos ya recogidos
    braseros: string[];
    recogidos: string[];
    estadisticas: EstadisticasPartida;
}

export function partidaNueva(primerNivel: string): Partida {
    return {
        nivel: primerNivel,
        brasero: null,
        experiencia: 0,
        equipo: [],
        pociones: 0,
        braseros: [],
        recogidos: [],
        estadisticas: { muertes: 0, enemigosVencidos: 0, tiempo: 0 }
    };
}

export function clave(nivel: string, idTiled: number | string): string {
    return `${nivel}:${idTiled}`;
}

//  Copia independiente (para guardar sin que la partida en curso la cambie después)
export function copiarPartida(partida: Partida): Partida {
    return structuredClone(partida);
}

//  Pasa al nivel siguiente: se aparece en su inicio, no junto a un brasero
export function cambiarDeNivel(partida: Partida, nivel: string) {
    partida.nivel = nivel;
    partida.brasero = null;
}

//  Al morir se vuelve a lo guardado, pero las estadísticas siguen contando:
//  la muerte y el tiempo jugado desde el último guardado no se pierden.
export function trasMorir(guardada: Partida, enCurso: Partida): Partida {
    const nueva = copiarPartida(guardada);
    nueva.estadisticas = {
        muertes: enCurso.estadisticas.muertes + 1,
        enemigosVencidos: enCurso.estadisticas.enemigosVencidos,
        tiempo: enCurso.estadisticas.tiempo
    };

    return nueva;
}

//  «1:05:09» o «12:34» para la pantalla de victoria
export function formatearTiempo(ms: number): string {
    const total = Math.floor(ms / 1000);
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundos = total % 60;
    const dos = (n: number) => String(n).padStart(2, '0');

    return horas > 0 ? `${horas}:${dos(minutos)}:${dos(segundos)}` : `${minutos}:${dos(segundos)}`;
}
