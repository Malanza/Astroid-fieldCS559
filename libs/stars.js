import * as T from "./three.js";

function renderStars(scene) {
    const loader = new T.CubeTextureLoader();
    loader.setPath('/assets/skybox/');

    const skyboxTexture = loader.load([
    'right.png',
    'left.png',
    'top.png',
    'bottom.png',
    'front.png',
    'back.png'
    ]);

    scene.background = skyboxTexture;
}

export { renderStars };