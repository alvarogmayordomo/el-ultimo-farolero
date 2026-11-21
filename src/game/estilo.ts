//  Estilo común de los textos y colores de la interfaz

export const FUENTE = 'Farolero, monospace';

export const COLORES = {
    texto: '#f4e9d0',
    apagado: '#8a8170',
    luz: '#ffc94d',
    peligro: '#e05a4f',
    fondo: 0x0b0a10
} as const;

//  Texto con borde negro para que se lea sobre el juego
export function estiloTexto(tamano: number, color: string = COLORES.texto): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: FUENTE, fontSize: tamano, color, stroke: '#000000', strokeThickness: Math.max(2, tamano / 5) };
}
