//  La Luz del farolero: maná, radio de visión y reloj a la vez (docs/plan.md).
//  Lógica pura, sin Phaser; los tiempos van en ms.
//
//  - Va de 0 a 100 y empieza llena.
//  - Se apaga poco a poco con el tiempo (es el reloj), salvo junto a un brasero
//    encendido, donde se recarga.
//  - Las habilidades la gastan y cada golpe a un enemigo da +2.
//  - El radio que se ve va de 48 px (Luz 0) a 160 px (Luz 100).
//  - Con la Luz a 0, el frío quita 3 PV por segundo.

export const LUZ_MAX = 100;
export const RADIO_MIN = 48;
export const RADIO_MAX = 160;

export const LUZ_POR_GOLPE = 2;
export const DESGASTE_POR_SEGUNDO = 1;
export const RECARGA_POR_SEGUNDO = 25;
export const FRIO_PV_POR_SEGUNDO = 3;

//  Radio de visión (px) para un valor de Luz: lineal entre RADIO_MIN y RADIO_MAX
export function radioDeLuz (luz: number): number
{
    const proporcion = Math.min(Math.max(luz, 0), LUZ_MAX) / LUZ_MAX;

    return RADIO_MIN + (RADIO_MAX - RADIO_MIN) * proporcion;
}

export class Luz
{
    private _valor: number;

    //  PV de frío que aún no suman un punto entero (el frío quita 3 PV/s,
    //  pero cada fotograma solo pasan unos pocos ms)
    private frioPendiente = 0;

    constructor (inicial = LUZ_MAX)
    {
        this._valor = Math.min(Math.max(inicial, 0), LUZ_MAX);
    }

    get valor (): number
    {
        return this._valor;
    }

    get radio (): number
    {
        return radioDeLuz(this._valor);
    }

    //  Gasta `cantidad` si hay suficiente. Devuelve true si se ha gastado.
    gastar (cantidad: number): boolean
    {
        if (this._valor < cantidad)
        {
            return false;
        }

        this._valor -= cantidad;

        return true;
    }

    ganar (cantidad: number)
    {
        this._valor = Math.min(LUZ_MAX, this._valor + cantidad);
    }

    llenar ()
    {
        this._valor = LUZ_MAX;
    }

    //  Avanza `ms` milisegundos. Junto a un brasero encendido se recarga; si no,
    //  se desgasta. Devuelve los PV enteros que quita el frío en este paso.
    actualizar (ms: number, juntoABrasero: boolean): number
    {
        const segundos = ms / 1000;

        if (juntoABrasero)
        {
            this.ganar(RECARGA_POR_SEGUNDO * segundos);
            this.frioPendiente = 0;
            return 0;
        }

        this._valor = Math.max(0, this._valor - DESGASTE_POR_SEGUNDO * segundos);

        if (this._valor > 0)
        {
            this.frioPendiente = 0;
            return 0;
        }

        this.frioPendiente += FRIO_PV_POR_SEGUNDO * segundos;
        const frio = Math.floor(this.frioPendiente);
        this.frioPendiente -= frio;

        return frio;
    }
}
