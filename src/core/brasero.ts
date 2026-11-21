import type { Luz } from './luz';

//  Brasero: empieza apagado; el farolero lo enciende al lado y se le llena la Luz.
//  Encendido, alumbra la sala y recarga la Luz de quien esté cerca.
//  En H5 también guardará la partida.

//  Distancias en píxeles
export const ALCANCE_ENCENDER = 24;
export const ALCANCE_RECARGA = 32;
export const RADIO_LUZ_BRASERO = 96;

export class Brasero {
    private _encendido = false;

    get encendido(): boolean {
        return this._encendido;
    }

    //  Intenta encenderlo desde `distancia` px. Devuelve true si se ha encendido ahora.
    encender(distancia: number, luz: Luz): boolean {
        if (this._encendido || distancia > ALCANCE_ENCENDER) {
            return false;
        }

        this._encendido = true;
        luz.llenar();

        return true;
    }

    //  Lo apaga (la Guardiana en su fase 2). Devuelve true si estaba encendido.
    apagar(): boolean {
        const estaba = this._encendido;
        this._encendido = false;

        return estaba;
    }

    //  Lo deja encendido sin tocar la Luz (al cargar una partida guardada)
    restaurarEncendido() {
        this._encendido = true;
    }

    //  ¿Recarga la Luz de alguien que está a `distancia` px?
    recargaA(distancia: number): boolean {
        return this._encendido && distancia <= ALCANCE_RECARGA;
    }
}
