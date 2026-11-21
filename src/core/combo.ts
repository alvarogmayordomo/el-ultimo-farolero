//  Combo de 3 golpes. Lógica pura: no sabe nada de Phaser, solo de tiempos (en ms).
//
//  - Cada golpe dura DURACION_GOLPE ms.
//  - Si se vuelve a atacar durante un golpe, el siguiente queda «apuntado» y empieza
//    en cuanto termina el actual.
//  - Si se ataca dentro de la VENTANA_ENCADENAR tras acabar un golpe, sigue el combo.
//  - Si se deja pasar la ventana, el combo vuelve al primer golpe.
//  - Tras el tercer golpe hay un DESCANSO antes de poder empezar otro combo.

export const DURACION_GOLPE = 250;
export const VENTANA_ENCADENAR = 300;
export const DESCANSO = 400;

//  Multiplicador de daño de cada golpe del combo (el tercero remata)
export const MULTIPLICADORES = [1, 1.2, 1.6] as const;

export interface Golpe
{
    //  Número de golpe dentro del combo: 1, 2 o 3
    numero: number;
    multiplicador: number;
    inicio: number;
    fin: number;
}

export class Combo
{
    private golpe: Golpe | null = null;
    private apuntado = false;
    private bloqueadoHasta = 0;

    //  Se llama al pulsar atacar. Devuelve el golpe que empieza ahora, o null si
    //  el ataque queda apuntado para después o no se puede atacar todavía.
    atacar (ahora: number): Golpe | null
    {
        if (ahora < this.bloqueadoHasta)
        {
            return null;
        }

        if (this.golpe && ahora < this.golpe.fin)
        {
            //  A mitad de golpe: se apunta el siguiente (salvo tras el tercero)
            this.apuntado = this.golpe.numero < MULTIPLICADORES.length;
            return null;
        }

        const encadena = this.golpe !== null
            && this.golpe.numero < MULTIPLICADORES.length
            && ahora <= this.golpe.fin + VENTANA_ENCADENAR;

        return this.empezar(encadena ? this.golpe!.numero + 1 : 1, ahora);
    }

    //  Se llama cada fotograma. Si había un golpe apuntado y el actual ya ha
    //  terminado, empieza el siguiente y lo devuelve.
    actualizar (ahora: number): Golpe | null
    {
        if (!this.golpe || ahora < this.golpe.fin)
        {
            return null;
        }

        if (this.apuntado)
        {
            this.apuntado = false;
            return this.empezar(this.golpe.numero + 1, this.golpe.fin);
        }

        return null;
    }

    //  ¿Hay un golpe en curso en este instante?
    golpeActivo (ahora: number): Golpe | null
    {
        return this.golpe && ahora < this.golpe.fin ? this.golpe : null;
    }

    //  Corta el combo (por ejemplo, al esquivar o al recibir un golpe)
    cancelar ()
    {
        this.golpe = null;
        this.apuntado = false;
    }

    private empezar (numero: number, inicio: number): Golpe
    {
        this.golpe = {
            numero,
            multiplicador: MULTIPLICADORES[numero - 1],
            inicio,
            fin: inicio + DURACION_GOLPE
        };

        if (numero === MULTIPLICADORES.length)
        {
            this.bloqueadoHasta = this.golpe.fin + DESCANSO;
        }

        return this.golpe;
    }
}
