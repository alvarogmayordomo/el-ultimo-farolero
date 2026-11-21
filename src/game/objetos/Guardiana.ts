import { Physics, type Scene, TintModes } from 'phaser';
import {
    ComportamientoGuardiana,
    dentroDelZarpazo,
    type EventoGuardiana,
    MULTIPLICADOR_SALTO,
    MULTIPLICADOR_ZARPAZO,
    RADIO_ATERRIZAJE
} from '../../core/guardiana';
import { Luchador } from '../../core/luchador';

//  Estadísticas y velocidad de la Guardiana (el jefe es único: no va en enemigos.json)
export const ESTADISTICAS_GUARDIANA = { pv: 420, atq: 22, def: 20 };
export const EXPERIENCIA_GUARDIANA = 100;
const VELOCIDAD_ACECHO = 32;

//  Distancia vertical del centro del sprite (50×50) a sus pies (centro del cuerpo)
const PIES_Y = 12;

//  Color de la Guardiana: el espíritu del pack, teñido de penumbra
const COLOR = 0x7d6bc9;
const COLOR_FASE_2 = 0xb04a7a;

//  Lo que la escena tiene que hacer con un evento del jefe
export interface GolpeDeJefe {
    multiplicador: number;
    //  ¿Alcanza al punto (x, y) del farolero?
    alcanza: (x: number, y: number) => boolean;
}

//  La Guardiana del Pozo. Las decisiones están en src/core/guardiana.ts; aquí se
//  mueve, se dibuja el aviso del salto (una marca en el suelo) y se anima.
export class Guardiana extends Physics.Arcade.Sprite {
    declare body: Physics.Arcade.Body;

    readonly luchador = new Luchador(ESTADISTICAS_GUARDIANA);
    readonly ia = new ComportamientoGuardiana();

    private marca: Phaser.GameObjects.Ellipse;
    private sombraSuelo: Phaser.GameObjects.Ellipse;
    private destinoSalto = { x: 0, y: 0 };
    private origenSalto = { x: 0, y: 0 };
    private mirando = { x: 0, y: 1 };
    private estadoAnterior = this.ia.estado;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'guardiana', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(26, 18);
        this.body.setOffset(12, 28);
        this.setTint(COLOR);
        this.play('guardiana-quieta');

        //  Sombra bajo ella (se separa al saltar) y marca roja de dónde va a caer
        this.sombraSuelo = scene.add.ellipse(x, y + 18, 30, 10, 0x000000, 0.45).setDepth(this.depth - 1);
        this.marca = scene.add.ellipse(0, 0, RADIO_ATERRIZAJE * 2, RADIO_ATERRIZAJE * 1.2, 0xe05a4f, 0.35);
        this.marca.setStrokeStyle(1, 0xff8a7a).setVisible(false);
    }

    get proporcionPv(): number {
        return this.luchador.pv / this.luchador.pvMax;
    }

    //  Avanza un fotograma hacia el farolero en (x, y). Devuelve el golpe que suelta
    //  (si lo hay) y si en este fotograma apaga los braseros de la sala.
    actualizar(ahora: number, x: number, y: number): { golpe: GolpeDeJefe | null; apagar: boolean } {
        if (!this.luchador.vivo) {
            return { golpe: null, apagar: false };
        }

        const pies = this.pies;
        const dx = x - pies.x;
        const dy = y - pies.y;
        const distancia = Math.hypot(dx, dy) || 1;
        const evento = this.ia.actualizar(ahora, distancia, this.proporcionPv);
        const estado = this.ia.estado;

        if (estado !== this.estadoAnterior) {
            this.alCambiar(estado, x, y, dx / distancia, dy / distancia);
            this.estadoAnterior = estado;
        }

        this.mover(ahora, dx / distancia, dy / distancia);
        this.pintar(ahora);

        return { golpe: this.golpeDe(evento), apagar: evento === 'apagarBraseros' };
    }

    //  Los pies (el centro del cuerpo físico): desde ahí se miden distancias. Se calcula
    //  desde el sprite porque en el aire el cuerpo está desactivado y no se mueve.
    get pies(): { x: number; y: number } {
        return { x: this.x, y: this.y + PIES_Y };
    }

    private alCambiar(estado: string, x: number, y: number, hx: number, hy: number) {
        if (estado === 'prepararZarpazo') {
            this.mirando = { x: hx, y: hy };
        }

        if (estado === 'prepararSalto') {
            //  Fija el sitio donde caerá: donde está ahora el farolero
            this.destinoSalto = { x, y };
            this.marca.setPosition(x, y).setVisible(true).setScale(0.3);
            this.scene.tweens.add({ targets: this.marca, scale: 1, duration: 300 });
        }

        if (estado === 'salto') {
            this.origenSalto = this.pies;
            this.body.enable = false;
        }

        if (this.estadoAnterior === 'salto') {
            this.body.enable = true;
            this.body.reset(this.x, this.y);
            this.marca.setVisible(false);
            this.scene.cameras.main.shake(180, 0.006);
        }
    }

    private mover(ahora: number, hx: number, hy: number) {
        const estado = this.ia.estado;

        if (estado === 'acechar') {
            this.setVelocity(hx * VELOCIDAD_ACECHO, hy * VELOCIDAD_ACECHO);
        } else if (estado === 'salto') {
            //  En el aire: va de su sitio a la marca describiendo un arco
            const t = this.ia.progreso(ahora);
            const px = this.origenSalto.x + (this.destinoSalto.x - this.origenSalto.x) * t;
            const py = this.origenSalto.y + (this.destinoSalto.y - this.origenSalto.y) * t;
            const altura = Math.sin(t * Math.PI) * 40;
            this.setPosition(px, py - PIES_Y - altura);
            this.sombraSuelo.setPosition(px, py + 2).setScale(1 - 0.4 * Math.sin(t * Math.PI));
            return;
        } else {
            this.setVelocity(0, 0);
        }

        this.sombraSuelo.setPosition(this.pies.x, this.pies.y + 2).setScale(1);
    }

    private pintar(ahora: number) {
        const estado = this.ia.estado;
        const color = this.ia.fase === 2 ? COLOR_FASE_2 : COLOR;
        this.setTint(color).setTintMode(TintModes.MULTIPLY);
        this.setAlpha(1);

        const avisando = estado === 'prepararZarpazo' || estado === 'prepararSalto' || estado === 'apagando';

        if (avisando && Math.floor(ahora / 80) % 2 === 0) {
            this.setTint(0xffffff).setTintMode(TintModes.FILL);
        }

        if (estado === 'aturdida') {
            this.setAlpha(0.55 + 0.25 * Math.sin(ahora / 120));
        }
    }

    private golpeDe(evento: EventoGuardiana | null): GolpeDeJefe | null {
        if (evento === 'golpeZarpazo') {
            const pies = this.pies;
            const mirando = this.mirando;
            this.mostrarZarpazo();
            return {
                multiplicador: MULTIPLICADOR_ZARPAZO,
                alcanza: (x, y) => dentroDelZarpazo(x - pies.x, y - pies.y, mirando.x, mirando.y)
            };
        }

        if (evento === 'aterrizaje') {
            const destino = this.destinoSalto;
            return {
                multiplicador: MULTIPLICADOR_SALTO,
                alcanza: (x, y) => Math.hypot(x - destino.x, y - destino.y) <= RADIO_ATERRIZAJE
            };
        }

        return null;
    }

    //  El arco del zarpazo: el efecto de tajo, grande y girado hacia el farolero
    private mostrarZarpazo() {
        const pies = this.pies;
        const angulo = Math.atan2(this.mirando.y, this.mirando.x);
        const tajo = this.scene.add.sprite(pies.x + this.mirando.x * 20, pies.y + this.mirando.y * 20, 'fx-tajo', 0);
        tajo.setRotation(angulo).setScale(2).setTint(0xff8a7a);
        tajo.play('fx-tajo');
        tajo.once('animationcomplete', () => tajo.destroy());
    }

    //  El farolero la golpea. Devuelve el daño hecho (0 si está en el aire).
    recibirGolpe(atacante: Luchador, multiplicador: number, ahora: number): number {
        if (!this.ia.vulnerable && this.ia.estado !== 'dormida') {
            return 0;
        }

        this.ia.despertar(ahora);
        const dano = this.luchador.recibirGolpe(atacante, multiplicador, ahora);

        if (dano > 0) {
            this.play('guardiana-herida');
            this.once('animationcomplete', () => this.luchador.vivo && this.play('guardiana-quieta'));
        }

        if (!this.luchador.vivo) {
            this.morir();
        }

        return dano;
    }

    private morir() {
        this.body.enable = false;
        this.marca.destroy();
        this.sombraSuelo.destroy();
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 1.6,
            duration: 1200,
            onComplete: () => this.destroy()
        });
    }
}
