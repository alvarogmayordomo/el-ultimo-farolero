import { Geom, Physics, type Scene, TintModes } from 'phaser';
import { Combo, type Golpe } from '../../core/combo';
import { Equipo } from '../../core/equipo';
import { Esquiva } from '../../core/esquiva';
import { Experiencia, estadisticasDeNivel } from '../../core/experiencia';
import { LanzaDeLuz } from '../../core/lanza';
import { Luchador } from '../../core/luchador';
import { Luz } from '../../core/luz';
import type { Partida } from '../../core/partida';
import { Pociones } from '../../core/pociones';
import { objetoPorId } from '../../data/datos';
import { type Direccion, direccionDe, VECTORES } from './direcciones';

//  Velocidades en píxeles por segundo
const VELOCIDAD = 80;
const VELOCIDAD_ESQUIVA = 190;
const VELOCIDAD_RETROCESO = 120;

//  Tras recibir un golpe: retrocede un momento y es invulnerable un rato (ms)
const DURACION_RETROCESO = 150;
const INVULNERABLE_TRAS_GOLPE = 600;

//  Pose de lanzar: el farolero se queda quieto un momento al soltar la Lanza (ms)
const DURACION_LANZAR = 150;

//  Zona del golpe: un cuadrado delante del farolero
const TAMANO_GOLPE = 20;
const ALCANCE_GOLPE = 12;

//  Lo que la escena le pasa cada fotograma, leído del teclado
export interface Entrada {
    dx: number;
    dy: number;
    //  true solo en el fotograma en que se pulsa la tecla
    atacar: boolean;
    esquivar: boolean;
    lanzar: boolean;
    encender: boolean;
    beber: boolean;
}

//  El jugador. Dibuja y mueve el sprite; las reglas (combo, esquiva, PV)
//  viven en src/core y aquí solo se consultan.
export class Farolero extends Physics.Arcade.Sprite {
    declare body: Physics.Arcade.Body;

    readonly luchador = new Luchador(estadisticasDeNivel(1), INVULNERABLE_TRAS_GOLPE);
    readonly combo = new Combo();
    readonly esquiva = new Esquiva();
    readonly luz = new Luz();
    readonly lanza = new LanzaDeLuz();
    readonly experiencia: Experiencia;
    readonly equipo = new Equipo();
    readonly pociones: Pociones;
    mirando: Direccion = 'abajo';

    private retroceso = { x: 0, y: 0 };
    private retrocesoHasta = -Infinity;
    private lanzandoHasta = -Infinity;

    //  Se crea a partir de la partida: experiencia, equipo y pociones guardados
    constructor(scene: Scene, x: number, y: number, partida: Partida) {
        super(scene, x, y, 'farolero-quieto', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.experiencia = new Experiencia(partida.experiencia);
        this.pociones = new Pociones(partida.pociones);
        for (const id of partida.equipo) {
            const objeto = objetoPorId(id);
            if (objeto) {
                this.equipo.recoger(objeto);
            }
        }
        this.recalcularEstadisticas();
        this.luchador.curar(Number.POSITIVE_INFINITY);

        //  Cuerpo físico pequeño en los pies (el dibujo ocupa ~16 px dentro del marco de 32):
        //  así la cabeza puede solapar un muro que está detrás, como en los Zelda cenitales
        this.body.setSize(10, 8);
        this.body.setOffset(11, 16);
        this.play('quieto-abajo');
    }

    //  Devuelve el golpe del combo que empieza en este fotograma, si lo hay
    actualizar(ahora: number, entrada: Entrada): Golpe | null {
        const { dx, dy } = entrada;
        const hayDireccion = dx !== 0 || dy !== 0;

        //  Parpadea mientras es invulnerable tras un golpe
        this.setAlpha(this.luchador.invulnerable(ahora) && Math.floor(ahora / 60) % 2 === 0 ? 0.4 : 1);

        if (ahora < this.retrocesoHasta) {
            this.setVelocity(this.retroceso.x, this.retroceso.y);
            return null;
        }

        if (ahora < this.lanzandoHasta) {
            this.setVelocity(0, 0);
            return null;
        }

        //  Esquiva: tiene prioridad y corta el combo
        if (entrada.esquivar && !this.esquiva.activa(ahora)) {
            const direccion = hayDireccion ? { x: dx, y: dy } : VECTORES[this.mirando];

            if (this.esquiva.iniciar(ahora, direccion)) {
                this.combo.cancelar();
                this.mirando = direccionDe(direccion.x, direccion.y, this.mirando);
                this.play(`esquivar-${this.mirando}`);
            }
        }

        if (this.esquiva.activa(ahora)) {
            const { x, y } = this.esquiva.haciaDonde;
            this.setVelocity(x * VELOCIDAD_ESQUIVA, y * VELOCIDAD_ESQUIVA);
            return null;
        }

        //  Combo: un ataque apuntado puede empezar ahora aunque no se pulse nada
        let golpe = this.combo.actualizar(ahora);

        if (entrada.atacar) {
            golpe = this.combo.atacar(ahora) ?? golpe;
        }

        if (golpe) {
            //  Cada golpe del combo se puede orientar con las flechas
            this.mirando = direccionDe(dx, dy, this.mirando);
            this.play(`atacar-${this.mirando}`);
        }

        if (this.combo.golpeActivo(ahora)) {
            this.setVelocity(0, 0);
            return golpe;
        }

        //  Andar
        const largo = Math.hypot(dx, dy) || 1;
        this.setVelocity((dx / largo) * VELOCIDAD, (dy / largo) * VELOCIDAD);

        if (!hayDireccion) {
            this.play(`quieto-${this.mirando}`, true);
            return null;
        }

        this.mirando = direccionDe(dx, dy, this.mirando);
        this.play(`andar-${this.mirando}`, true);

        return null;
    }

    //  Intenta lanzar la Lanza de Luz hacia donde mira. No se puede a mitad de
    //  esquiva, golpe o retroceso. Devuelve true si se lanza (y ya ha gastado la Luz).
    lanzar(ahora: number): boolean {
        const ocupado =
            ahora < this.retrocesoHasta ||
            ahora < this.lanzandoHasta ||
            this.esquiva.activa(ahora) ||
            this.combo.golpeActivo(ahora) !== null;

        if (ocupado || !this.lanza.lanzar(ahora, this.luz)) {
            return false;
        }

        this.lanzandoHasta = ahora + DURACION_LANZAR;
        this.setVelocity(0, 0);
        this.play(`atacar-${this.mirando}`);

        return true;
    }

    //  Estadísticas = las del nivel + lo que suma el equipo
    recalcularEstadisticas() {
        const base = estadisticasDeNivel(this.experiencia.nivel);
        this.luchador.aplicarEstadisticas({
            pv: base.pv,
            atq: base.atq + this.equipo.atq,
            def: base.def + this.equipo.def
        });
    }

    //  Suma experiencia. Devuelve los niveles subidos; al subir, se cura del todo.
    ganarExperiencia(cantidad: number): number {
        const subidos = this.experiencia.ganar(cantidad);

        if (subidos > 0) {
            this.recalcularEstadisticas();
            this.luchador.curar(Number.POSITIVE_INFINITY);
        }

        return subidos;
    }

    //  Copia en la partida lo que lleva el farolero (antes de guardar o cambiar de nivel)
    volcarEn(partida: Partida) {
        partida.experiencia = this.experiencia.total;
        partida.equipo = this.equipo.ids;
        partida.pociones = this.pociones.cantidad;
    }

    //  Rectángulo del golpe, delante del farolero según hacia dónde mira
    zonaDeGolpe(): Geom.Rectangle {
        const centro = this.body.center;
        const v = VECTORES[this.mirando];
        const x = centro.x + v.x * ALCANCE_GOLPE - TAMANO_GOLPE / 2;
        const y = centro.y + v.y * ALCANCE_GOLPE - TAMANO_GOLPE / 2;

        return new Geom.Rectangle(x, y, TAMANO_GOLPE, TAMANO_GOLPE);
    }

    //  ¿Le puede hacer daño un enemigo ahora mismo?
    esVulnerable(ahora: number): boolean {
        return this.luchador.vivo && !this.esquiva.invulnerable(ahora) && !this.luchador.invulnerable(ahora);
    }

    //  Recibe un golpe de `atacante` que viene desde el punto (x, y)
    recibirGolpe(atacante: Luchador, ahora: number, desdeX: number, desdeY: number, multiplicador = 1): number {
        if (!this.esVulnerable(ahora)) {
            return 0;
        }

        const dano = this.luchador.recibirGolpe(atacante, multiplicador, ahora);

        //  Retrocede alejándose del atacante y pierde el combo
        const vx = this.body.center.x - desdeX;
        const vy = this.body.center.y - desdeY;
        const largo = Math.hypot(vx, vy) || 1;
        this.retroceso = { x: (vx / largo) * VELOCIDAD_RETROCESO, y: (vy / largo) * VELOCIDAD_RETROCESO };
        this.retrocesoHasta = ahora + DURACION_RETROCESO;
        this.combo.cancelar();

        this.setTint(0xff4040).setTintMode(TintModes.FILL);
        this.scene.time.delayedCall(DURACION_RETROCESO, () => this.clearTint().setTintMode(TintModes.MULTIPLY));

        return dano;
    }
}
