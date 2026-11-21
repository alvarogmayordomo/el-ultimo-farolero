import { Scene } from 'phaser';
import { type EstadisticasPartida, formatearTiempo } from '../../core/partida';
import { COLORES, estiloTexto } from '../estilo';
import { crearMenu } from '../Menu';

export type DatosVictoria = EstadisticasPartida & { nivel: number };

//  Pantalla de victoria con las estadísticas de la partida
export class Victoria extends Scene {
    constructor() {
        super('Victoria');
    }

    create(datos: DatosVictoria) {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(COLORES.fondo);
        this.cameras.main.fadeIn(800, 0, 0, 0);

        this.add.text(width / 2, 50, 'La Guardiana ha caído', estiloTexto(26, COLORES.luz)).setOrigin(0.5);
        this.add
            .text(
                width / 2,
                80,
                'Los braseros del Pozo arden de nuevo. La zona 1 vuelve a ver la luz.',
                estiloTexto(10)
            )
            .setOrigin(0.5);

        const filas = [
            ['Tiempo', formatearTiempo(datos.tiempo ?? 0)],
            ['Enemigos vencidos', String(datos.enemigosVencidos ?? 0)],
            ['Caídas', String(datos.muertes ?? 0)],
            ['Nivel del farolero', String(datos.nivel ?? 1)]
        ];

        filas.forEach(([nombre, valor], i) => {
            const y = 130 + i * 22;
            this.add.text(width / 2 - 10, y, nombre, estiloTexto(13, COLORES.apagado)).setOrigin(1, 0.5);
            this.add.text(width / 2 + 10, y, valor, estiloTexto(13)).setOrigin(0, 0.5);
        });

        crearMenu(this, width / 2, height - 70, [
            { texto: 'Créditos', accion: () => this.scene.start('Creditos') },
            { texto: 'Volver al título', accion: () => this.scene.start('MainMenu') }
        ]);
    }
}
