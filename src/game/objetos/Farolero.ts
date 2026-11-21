import { Geom, Physics, Scene, TintModes } from 'phaser';
import { Combo, Golpe } from '../../core/combo';
import { Esquiva } from '../../core/esquiva';
import { Luchador } from '../../core/luchador';
import { Direccion, VECTORES, direccionDe } from './direcciones';

//  Velocidades en píxeles por segundo
const VELOCIDAD = 80;
const VELOCIDAD_ESQUIVA = 190;
const VELOCIDAD_RETROCESO = 120;

//  Tras recibir un golpe: retrocede un momento y es invulnerable un rato (ms)
const DURACION_RETROCESO = 150;
const INVULNERABLE_TRAS_GOLPE = 600;

//  Zona del golpe: un cuadrado delante del farolero
const TAMANO_GOLPE = 20;
const ALCANCE_GOLPE = 12;

//  Lo que la escena le pasa cada fotograma, leído del teclado
export interface Entrada
{
    dx: number;
    dy: number;
    //  true solo en el fotograma en que se pulsa la tecla
    atacar: boolean;
    esquivar: boolean;
}

//  El jugador. Dibuja y mueve el sprite; las reglas (combo, esquiva, PV)
//  viven en src/core y aquí solo se consultan.
export class Farolero extends Physics.Arcade.Sprite
{
    declare body: Physics.Arcade.Body;

    readonly luchador = new Luchador({ pv: 100, atq: 10, def: 5 }, INVULNERABLE_TRAS_GOLPE);
    readonly combo = new Combo();
    readonly esquiva = new Esquiva();
    mirando: Direccion = 'abajo';

    private retroceso = { x: 0, y: 0 };
    private retrocesoHasta = -Infinity;

    constructor (scene: Scene, x: number, y: number)
    {
        super(scene, x, y, 'farolero-quieto', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        //  Cuerpo físico pequeño en los pies (el dibujo ocupa ~16 px dentro del marco de 32):
        //  así la cabeza puede solapar un muro que está detrás, como en los Zelda cenitales
        this.body.setSize(10, 8);
        this.body.setOffset(11, 16);
        this.play('quieto-abajo');
    }

    //  Devuelve el golpe del combo que empieza en este fotograma, si lo hay
    actualizar (ahora: number, entrada: Entrada): Golpe | null
    {
        const { dx, dy } = entrada;
        const hayDireccion = dx !== 0 || dy !== 0;

        //  Parpadea mientras es invulnerable tras un golpe
        this.setAlpha(this.luchador.invulnerable(ahora) && Math.floor(ahora / 60) % 2 === 0 ? 0.4 : 1);

        if (ahora < this.retrocesoHasta)
        {
            this.setVelocity(this.retroceso.x, this.retroceso.y);
            return null;
        }

        //  Esquiva: tiene prioridad y corta el combo
        if (entrada.esquivar && !this.esquiva.activa(ahora))
        {
            const direccion = hayDireccion ? { x: dx, y: dy } : VECTORES[this.mirando];

            if (this.esquiva.iniciar(ahora, direccion))
            {
                this.combo.cancelar();
                this.mirando = direccionDe(direccion.x, direccion.y, this.mirando);
                this.play(`esquivar-${this.mirando}`);
            }
        }

        if (this.esquiva.activa(ahora))
        {
            const { x, y } = this.esquiva.haciaDonde;
            this.setVelocity(x * VELOCIDAD_ESQUIVA, y * VELOCIDAD_ESQUIVA);
            return null;
        }

        //  Combo: un ataque apuntado puede empezar ahora aunque no se pulse nada
        let golpe = this.combo.actualizar(ahora);

        if (entrada.atacar)
        {
            golpe = this.combo.atacar(ahora) ?? golpe;
        }

        if (golpe)
        {
            //  Cada golpe del combo se puede orientar con las flechas
            this.mirando = direccionDe(dx, dy, this.mirando);
            this.play(`atacar-${this.mirando}`);
        }

        if (this.combo.golpeActivo(ahora))
        {
            this.setVelocity(0, 0);
            return golpe;
        }

        //  Andar
        const largo = Math.hypot(dx, dy) || 1;
        this.setVelocity(dx / largo * VELOCIDAD, dy / largo * VELOCIDAD);

        if (!hayDireccion)
        {
            this.play(`quieto-${this.mirando}`, true);
            return null;
        }

        this.mirando = direccionDe(dx, dy, this.mirando);
        this.play(`andar-${this.mirando}`, true);

        return null;
    }

    //  Rectángulo del golpe, delante del farolero según hacia dónde mira
    zonaDeGolpe (): Geom.Rectangle
    {
        const centro = this.body.center;
        const v = VECTORES[this.mirando];
        const x = centro.x + v.x * ALCANCE_GOLPE - TAMANO_GOLPE / 2;
        const y = centro.y + v.y * ALCANCE_GOLPE - TAMANO_GOLPE / 2;

        return new Geom.Rectangle(x, y, TAMANO_GOLPE, TAMANO_GOLPE);
    }

    //  ¿Le puede hacer daño un enemigo ahora mismo?
    esVulnerable (ahora: number): boolean
    {
        return this.luchador.vivo && !this.esquiva.invulnerable(ahora) && !this.luchador.invulnerable(ahora);
    }

    //  Recibe un golpe de `atacante` que viene desde el punto (x, y)
    recibirGolpe (atacante: Luchador, ahora: number, desdeX: number, desdeY: number): number
    {
        if (!this.esVulnerable(ahora))
        {
            return 0;
        }

        const dano = this.luchador.recibirGolpe(atacante, 1, ahora);

        //  Retrocede alejándose del atacante y pierde el combo
        const vx = this.body.center.x - desdeX;
        const vy = this.body.center.y - desdeY;
        const largo = Math.hypot(vx, vy) || 1;
        this.retroceso = { x: vx / largo * VELOCIDAD_RETROCESO, y: vy / largo * VELOCIDAD_RETROCESO };
        this.retrocesoHasta = ahora + DURACION_RETROCESO;
        this.combo.cancelar();

        this.setTint(0xff4040).setTintMode(TintModes.FILL);
        this.scene.time.delayedCall(DURACION_RETROCESO, () => this.clearTint().setTintMode(TintModes.MULTIPLY));

        return dano;
    }
}
