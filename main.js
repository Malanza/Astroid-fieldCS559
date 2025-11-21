// @ts-nocheck

import * as T from "./three.module.js";
// import { OrbitControls } from "../libs/CS559-Three/examples/jsm/controls/OrbitControls.js";


let renderer = new T.WebGLRenderer({preserveDrawingBuffer:true});
renderer.setSize(500, 500);
document.getElementById("div1").appendChild(renderer.domElement);
renderer.domElement.id = "canvas";

// student does the rest.
const scene = new T.Scene();
const camera = new T.PerspectiveCamera( 75, 500 / 500, 0.1, 1000 );

// make a ground plane
let groundBox = new T.BoxGeometry(100, 0.1, 100);
let groundMesh = new T.Mesh(
groundBox,
new T.MeshStandardMaterial({ color: 0x888888 })
);
// put the top of the box at the ground level (0)
groundMesh.position.y = -0.05;
scene.add(groundMesh);

// body
let geometry = new T.SphereGeometry(15, 32, 16);
let material = new T.MeshStandardMaterial();
let sphere = new T.Mesh(geometry, material);
sphere.position.y = 15;
scene.add( sphere );

geometry = new T.SphereGeometry(12, 32, 16);
sphere = new T.Mesh(geometry, material);
sphere.position.y = 34;
scene.add( sphere );

geometry = new T.SphereGeometry(9, 32, 16);
sphere = new T.Mesh(geometry, material);
sphere.position.y = 50;
scene.add( sphere );

// eyes
geometry = new T.SphereGeometry(1.3, 32, 16);
material = new T.MeshStandardMaterial({ color: "black" });
sphere = new T.Mesh(geometry, material);
sphere.position.y = 53;
sphere.position.z = 7;
sphere.position.x = -3;
scene.add( sphere );

sphere = new T.Mesh(geometry, material);
sphere.position.y = 53;
sphere.position.z = 7;
sphere.position.x = 3;
scene.add( sphere );

// mouth
geometry = new T.SphereGeometry(0.8, 32, 16);
sphere = new T.Mesh(geometry, material);
sphere.position.y = 47;
sphere.position.z = 8;
sphere.position.x = 0;
scene.add( sphere );

sphere = new T.Mesh(geometry, material);
sphere.position.y = 47.3;
sphere.position.z = 7.8;
sphere.position.x = 2;
scene.add( sphere );

sphere = new T.Mesh(geometry, material);
sphere.position.y = 48;
sphere.position.z = 7.3;
sphere.position.x = 4;
scene.add( sphere );

sphere = new T.Mesh(geometry, material);
sphere.position.y = 47.3;
sphere.position.z = 7.8;
sphere.position.x = -2;
scene.add( sphere );

sphere = new T.Mesh(geometry, material);
sphere.position.y = 48;
sphere.position.z = 7.3;
sphere.position.x = -4;
scene.add( sphere );

// nose
geometry = new T.ConeGeometry(1, 10, 32, 16)
material = new T.MeshStandardMaterial({ color: "orange" });
sphere = new T.Mesh(geometry, material);
sphere.position.y = 50;
sphere.position.z = 14;
sphere.position.x = 0;
sphere.rotation.x = Math.PI/2;
scene.add( sphere );

// buttons
geometry = new T.SphereGeometry(1.5, 32, 16);
material = new T.MeshStandardMaterial({ color: "black" });
sphere = new T.Mesh(geometry, material);
sphere.position.y = 38;
sphere.position.z = 10.5;
sphere.position.x = 0;
scene.add( sphere );

sphere = new T.Mesh(geometry, material);
sphere.position.y = 33;
sphere.position.z = 11;
sphere.position.x = 0;
scene.add( sphere );



camera.position.z = 50;
camera.position.x = 0;
camera.position.y = 50;
camera.lookAt(0, 34, 0);

  scene.add(new T.AmbientLight("white", 0.3));

let l1 = new T.DirectionalLight();
// let l2 = new T.PointLight(0xffffff,1,0,0);  // white light, no decay
// l2.position.set(0,50,0);
scene.add(l1);
// scene.add(l2);

function animate() {
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
// const geometry = new T.SphereGeometry( 15, 32, 16 ); 
// const material = new T.MeshBasicMaterial( { color: "red" } ); 
// const sphere = new T.Mesh( geometry, material ); 
// scene.add( sphere );


// CS559 2025 Workbook
