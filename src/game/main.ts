import { AUTO, Game, Scale } from 'phaser';
import './ajustesTexto';
import { Boot } from './scenes/Boot';
import { Creditos } from './scenes/Creditos';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { Hud } from './scenes/Hud';
import { MainMenu } from './scenes/MainMenu';
import { Pausa } from './scenes/Pausa';
import { Preloader } from './scenes/Preloader';
import { Victoria } from './scenes/Victoria';

//  Lienzo de 640×360 (16:9). La cámara del juego usa zoom ×2 (vista de 320×180)
//  y el HUD se dibuja a 640×360. Ver docs/plan.md.
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 640,
    height: 360,
    parent: 'game-container',
    backgroundColor: '#000000',
    //  Pixel art: sin suavizado al escalar y con posiciones redondeadas a píxeles enteros
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [Boot, Preloader, MainMenu, MainGame, Hud, Pausa, GameOver, Victoria, Creditos]
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
