//  Equipo del farolero: un arma y un talismán. Lógica pura.
//
//  Los objetos se equipan solos al recogerlos si son mejores que el que hay en su
//  ranura (docs/plan.md: sin inventario ni tarjeta de comparación). «Mejor» es que
//  sume más ATQ + DEF. Los objetos vienen de src/data/objetos.json.

export type Ranura = 'arma' | 'talisman';

export interface Objeto {
    id: string;
    nombre: string;
    ranura: Ranura;
    atq: number;
    def: number;
}

export function valorDe(objeto: Objeto): number {
    return objeto.atq + objeto.def;
}

export class Equipo {
    arma: Objeto | null = null;
    talisman: Objeto | null = null;

    //  Recoge un objeto. Devuelve true si se ha equipado (era mejor que el anterior).
    recoger(objeto: Objeto): boolean {
        const actual = this[objeto.ranura];

        if (actual && valorDe(actual) >= valorDe(objeto)) {
            return false;
        }

        this[objeto.ranura] = objeto;

        return true;
    }

    get atq(): number {
        return (this.arma?.atq ?? 0) + (this.talisman?.atq ?? 0);
    }

    get def(): number {
        return (this.arma?.def ?? 0) + (this.talisman?.def ?? 0);
    }

    //  Ids de lo equipado, para guardar la partida
    get ids(): string[] {
        return [this.arma, this.talisman].filter((o): o is Objeto => o !== null).map((o) => o.id);
    }
}
