import { z } from 'zod';

//  Esquemas de Zod para los JSON de src/data. Si un JSON no cumple su esquema,
//  el juego no arranca y `npm test` falla con un mensaje que dice qué campo está mal.

const positivo = z.number().positive();
const noNegativo = z.number().nonnegative();
const id = z.string().regex(/^[a-z0-9-]+$/, 'solo minúsculas, números y guiones');
const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'color en formato #rrggbb');

const estadisticas = z.object({
    pv: positivo,
    atq: noNegativo,
    def: noNegativo
});

//  Lo común a todos los enemigos
const enemigoBase = z.object({
    nombre: z.string().min(1),
    //  Archivo en public/assets/enemigos/<sprite>.png: 64×64, 4 columnas (direcciones) × 4 filas
    sprite: id,
    //  Tinte opcional sobre el sprite y escala de dibujo
    color: color.optional(),
    escala: positivo.default(1),
    estadisticas,
    experiencia: noNegativo,
    //  Velocidades en px/s
    velocidad: positivo
});

const cuerpo = enemigoBase.extend({
    comportamiento: z.literal('cuerpo'),
    velocidadAtaque: positivo,
    aturdible: z.boolean(),
    distancias: z.object({ deteccion: positivo, olvido: positivo, alcance: positivo }),
    tiempos: z.object({ preparar: positivo, atacar: positivo, recuperar: positivo, herida: positivo })
});

const distancia = enemigoBase.extend({
    comportamiento: z.literal('distancia'),
    distancias: z.object({ deteccion: positivo, olvido: positivo, alcance: positivo, huida: positivo }),
    tiempos: z.object({ preparar: positivo, recargar: positivo, herida: positivo }),
    flecha: z.object({ velocidad: positivo, alcance: positivo, multiplicador: positivo })
});

export const esquemaEnemigo = z
    .discriminatedUnion('comportamiento', [cuerpo, distancia])
    .refine((e) => e.distancias.olvido > e.distancias.deteccion, {
        message: 'olvido debe ser mayor que deteccion (si no, el enemigo se olvida nada más verte)'
    });

export const esquemaEnemigos = z.record(id, esquemaEnemigo);

export const esquemaObjeto = z.object({
    nombre: z.string().min(1),
    ranura: z.enum(['arma', 'talisman']),
    atq: noNegativo,
    def: noNegativo,
    //  Archivo en public/assets/objetos/<sprite>.png
    sprite: id
});

export const esquemaObjetos = z.record(id, esquemaObjeto);

export const esquemaNivel = z.object({
    id,
    nombre: z.string().min(1),
    //  Archivo en public/assets/mapas/<mapa>.tmj
    mapa: id,
    //  Es la sala del jefe: al vencerlo, se gana la partida
    jefe: z.boolean().default(false)
});

export const esquemaNiveles = z.array(esquemaNivel).min(1);

export type DatosEnemigo = z.infer<typeof esquemaEnemigo>;
export type DatosObjeto = z.infer<typeof esquemaObjeto>;
export type DatosNivel = z.infer<typeof esquemaNivel>;
