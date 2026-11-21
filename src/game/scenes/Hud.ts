import { Scene } from 'phaser';
import { COSTE_LANZA } from '../../core/lanza';
import { LUZ_MAX } from '../../core/luz';

//  Datos que el HUD necesita de la partida. Game se los pasa cada fotograma.
export interface EstadoHud {
    pv: number;
    pvMax: number;
    luz: number;
    //  Texto de ayuda contextual («E: encender brasero»), o null
    aviso: string | null;
}

const ANCHO_BARRA = 120;
const ALTO_BARRA = 8;

//  HUD a 640×360 (sin el zoom de la cámara del juego), en una escena aparte
//  que se dibuja encima de Game. Solo pinta: no decide nada.
export class Hud extends Scene {
    private barras: Phaser.GameObjects.Graphics;
    private textoPv: Phaser.GameObjects.Text;
    private textoLuz: Phaser.GameObjects.Text;
    private aviso: Phaser.GameObjects.Text;

    constructor() {
        super('Hud');
    }

    create() {
        const estilo = { fontFamily: 'monospace', fontSize: 10, color: '#ffffff' };

        this.barras = this.add.graphics();
        this.textoPv = this.add.text(12 + ANCHO_BARRA + 6, 10, '', estilo);
        this.textoLuz = this.add.text(12 + ANCHO_BARRA + 6, 24, '', estilo);

        this.aviso = this.add
            .text(this.scale.width / 2, this.scale.height - 36, '', {
                ...estilo,
                fontSize: 12,
                color: '#ffe6a8',
                stroke: '#000000',
                strokeThickness: 3
            })
            .setOrigin(0.5);

        this.add
            .text(this.scale.width - 8, this.scale.height - 8, 'J atacar · K esquivar · L Lanza de Luz · E encender', {
                ...estilo,
                color: '#8a8a8a'
            })
            .setOrigin(1, 1);
    }

    mostrar(estado: EstadoHud) {
        const g = this.barras;
        g.clear();

        this.dibujarBarra(12, 12, estado.pv / estado.pvMax, 0xd04848);
        this.dibujarBarra(12, 26, estado.luz / LUZ_MAX, 0xffc94d);

        //  Marca en la barra de Luz: por debajo no hay bastante para la Lanza
        g.fillStyle(0xffffff, 0.6);
        g.fillRect(12 + (ANCHO_BARRA * COSTE_LANZA) / LUZ_MAX, 26, 1, ALTO_BARRA);

        this.textoPv.setText(`PV ${Math.ceil(estado.pv)}`);
        this.textoLuz.setText(`Luz ${Math.floor(estado.luz)}`);
        this.aviso.setText(estado.aviso ?? '');
    }

    private dibujarBarra(x: number, y: number, proporcion: number, color: number) {
        const g = this.barras;
        const lleno = Math.max(0, Math.min(1, proporcion));

        g.fillStyle(0x000000, 0.7);
        g.fillRect(x - 1, y - 1, ANCHO_BARRA + 2, ALTO_BARRA + 2);
        g.fillStyle(color, 1);
        g.fillRect(x, y, Math.round(ANCHO_BARRA * lleno), ALTO_BARRA);
    }
}
