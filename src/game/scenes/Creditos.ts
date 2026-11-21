import { Scene } from 'phaser';
import manifiesto from '../../../assets.manifest.json';
import { COLORES, estiloTexto } from '../estilo';

//  Software incluido en el juego publicado (sus avisos de licencia van en CREDITS.md)
const SOFTWARE = [
    'Phaser 4 · Phaser Studio · MIT',
    'Plantilla template-vite-ts · Phaser Studio · MIT',
    'Zod · Colin McDonnell · MIT'
];

//  Créditos generados a partir de assets.manifest.json: cada fuente de recursos con
//  sus autores y su licencia, y cuántos recursos se usan de ella.
export class Creditos extends Scene {
    constructor() {
        super('Creditos');
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(COLORES.fondo);

        const lineas: { texto: string; tamano: number; color?: string }[] = [
            { texto: 'El Último Farolero', tamano: 22, color: COLORES.luz },
            { texto: 'Diseño y dirección: Álvaro · Código: Claude Code', tamano: 11 },
            { texto: '', tamano: 8 },
            { texto: 'Arte, fuente y efectos', tamano: 13, color: COLORES.luz }
        ];

        for (const [id, fuente] of Object.entries(manifiesto.fuentes)) {
            const usados = manifiesto.recursos.filter((r) => r.fuente === id).length;
            lineas.push(
                { texto: `${fuente.nombre} · ${fuente.autores.join(', ')}`, tamano: 11 },
                { texto: `${fuente.licencia} · ${usados} recursos · ${fuente.url}`, tamano: 9, color: COLORES.apagado }
            );
        }

        lineas.push({ texto: '', tamano: 8 }, { texto: 'Software', tamano: 13, color: COLORES.luz });
        for (const linea of SOFTWARE) {
            lineas.push({ texto: linea, tamano: 10 });
        }

        let y = 34;
        for (const linea of lineas) {
            this.add.text(width / 2, y, linea.texto, estiloTexto(linea.tamano, linea.color)).setOrigin(0.5);
            y += linea.tamano + 9;
        }

        this.add
            .text(width / 2, height - 18, 'Pulsa cualquier tecla para volver', estiloTexto(9, COLORES.apagado))
            .setOrigin(0.5);

        const volver = () => this.scene.start('MainMenu');
        this.time.delayedCall(300, () => {
            this.input.keyboard?.once('keydown', volver);
            this.input.once('pointerdown', volver);
        });
    }
}
