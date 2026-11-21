import type { Scene } from 'phaser';
import { COLORES, estiloTexto } from './estilo';

export interface OpcionMenu {
    texto: string;
    accion: () => void;
}

//  Lista vertical de opciones que se elige con las flechas (o W/S) y Enter/Espacio/J,
//  o con el ratón. La usan el título, la pausa, «Has caído» y la victoria.
export function crearMenu(escena: Scene, x: number, y: number, opciones: OpcionMenu[], separacion = 22) {
    let elegida = 0;

    const textos = opciones.map((opcion, i) => {
        const texto = escena.add.text(x, y + i * separacion, opcion.texto, estiloTexto(14)).setOrigin(0.5);
        texto.setInteractive({ useHandCursor: true });
        texto.on('pointerover', () => marcar(i));
        texto.on('pointerdown', () => opcion.accion());
        return texto;
    });

    const marcar = (i: number) => {
        elegida = (i + opciones.length) % opciones.length;
        textos.forEach((texto, j) => {
            const activa = j === elegida;
            texto.setText(activa ? `› ${opciones[j].texto} ‹` : opciones[j].texto);
            texto.setColor(activa ? COLORES.luz : COLORES.texto);
        });
    };

    marcar(0);

    const teclado = escena.input.keyboard;
    teclado?.on('keydown', (evento: KeyboardEvent) => {
        switch (evento.code) {
            case 'ArrowUp':
            case 'KeyW':
                marcar(elegida - 1);
                break;
            case 'ArrowDown':
            case 'KeyS':
                marcar(elegida + 1);
                break;
            case 'Enter':
            case 'Space':
            case 'KeyJ':
                opciones[elegida].accion();
                break;
        }
    });

    return textos;
}
