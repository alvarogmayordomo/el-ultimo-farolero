import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', () => {

    const juego = StartGame('game-container');

    //  Solo en desarrollo: deja el juego accesible desde la consola del navegador
    //  (window.juego) para inspeccionarlo y probarlo. No llega a la build publicada.
    if (import.meta.env.DEV)
    {
        (window as unknown as { juego: Phaser.Game }).juego = juego;
    }

});
