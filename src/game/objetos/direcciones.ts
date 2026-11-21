//  Las 4 direcciones de los sprites y su conversión a vectores

export type Direccion = 'abajo' | 'arriba' | 'izquierda' | 'derecha';

export const VECTORES: Record<Direccion, { x: number; y: number }> = {
    abajo: { x: 0, y: 1 },
    arriba: { x: 0, y: -1 },
    izquierda: { x: -1, y: 0 },
    derecha: { x: 1, y: 0 }
};

//  Dirección del sprite para un vector. En diagonal manda el eje dominante;
//  si empatan, el horizontal (como en los Zelda cenitales).
export function direccionDe (x: number, y: number, porDefecto: Direccion = 'abajo'): Direccion
{
    if (x === 0 && y === 0)
    {
        return porDefecto;
    }

    if (Math.abs(x) >= Math.abs(y))
    {
        return x < 0 ? 'izquierda' : 'derecha';
    }

    return y < 0 ? 'arriba' : 'abajo';
}
