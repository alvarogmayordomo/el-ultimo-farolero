import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', async () => {
    //  Phaser dibuja los textos en un canvas: la fuente tiene que estar cargada antes,
    //  o los primeros textos saldrían con la fuente por defecto
    try {
        await document.fonts.load('16px Farolero');
    } catch {
        //  Sin la fuente el juego funciona igual, con la de reserva
    }

    const juego = StartGame('game-container');

    //  Solo en desarrollo: deja el juego accesible desde la consola del navegador
    //  (window.juego) para inspeccionarlo y probarlo. No llega a la build publicada.
    if (import.meta.env.DEV) {
        (window as unknown as { juego: Phaser.Game }).juego = juego;
    }
});
