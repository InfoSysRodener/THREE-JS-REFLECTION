import '../style.css'
import * as THREE from 'three';
import * as dat from 'dat.gui';
import SceneManager from './sceneManager/scene';

const gui = new dat.GUI();

const textureLoader = new THREE.TextureLoader().load('./texture/digital.PNG');

/**
 * Environment Map
 */
 const environmentMap = new THREE.CubeTextureLoader().load([
	'./texture/1/px.png',
	'./texture/1/nx.png',
	'./texture/1/py.png',
	'./texture/1/ny.png',
	'./texture/1/pz.png',
	'./texture/1/nz.png',
]);

// const environmentMapInside = new THREE.CubeTextureLoader().load([
// 	'./texture/1/px.png',
// 	'./texture/1/nx.png',
// 	'./texture/1/py.png',
// 	'./texture/1/ny.png',
// 	'./texture/1/pz.png',
// 	'./texture/1/nz.png',
// ])


// environmentMapInside.mapping = THREE.CubeRefractionMapping;

/**
 * Scene
 */
const canvas = document.querySelector('#canvas');
const scene = new SceneManager(canvas);
scene.scene.background = environmentMap;
scene.addOrbitControl();

/**
 * Light
 */
const directionalLight = new THREE.DirectionalLight(0xFFFFFF,1);
directionalLight.position.set(10,10,10);
scene.add(directionalLight);

const ambiantLight = new THREE.AmbientLight(0xFFFFFF,1);
scene.add(ambiantLight);

const settings = {
	segments: 10,
	radius: {value: 0.4 },
	size: {
	  value: new THREE.Vector3(4,4,4)
	}
}

const settings1 = {
	segments: 10,
	radius: {value: 0.4 },
	size: {
	  value: new THREE.Vector3(5,5,5)
	}
}

// Create cube render target
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 512, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter } );

//CubeCamera
const cubeCamera = new THREE.CubeCamera( 0.1, 5000, cubeRenderTarget );
scene.add( cubeCamera );	
cubeCamera.renderTarget.texture.mapping = THREE.CubeRefractionMapping;
cubeCamera.renderTarget.texture.encoding = THREE.sRGBEncoding;

const boxGeometry = new THREE.BoxBufferGeometry(6,6,6, 10, 10, 10);
const boxMaterial = new THREE.MeshPhongMaterial({ 
	envMap:cubeRenderTarget.texture,
	reflectivity: 0.9,
	refractionRatio: 0.8,
	color: 0xFFFFFF,
	side:THREE.FrontSide,
	opacity: 1,
	transparent: true,
	// premultipliedAlpha: true
});



const cube = new THREE.Mesh(boxGeometry, boxMaterial);


// const innerCube = cube.clone();
// innerCube.material = new THREE.MeshPhongMaterial({
// 	envMap:cubeRenderTarget.texture,
// 	reflectivity: 0.5,
// 	refractionRatio: 0.8,
// 	color: 0xFFFFFF,
// 	side:THREE.FrontSide,
// 	opacity:0.8,
// 	transparent:true,
// 	// premultipliedAlpha: true
// })




boxMaterial.onBeforeCompile = shader => {
  
	shader.uniforms.boxSize = settings.size;
	shader.uniforms.radius = settings.radius;
	
	shader.vertexShader = `
	uniform vec3 boxSize;
	uniform float radius;
	` + shader.vertexShader;
	
	shader.vertexShader = shader.vertexShader.replace(
	  `#include <begin_vertex>`,
	  `#include <begin_vertex>
	  
	  vec3 signs = sign(position);
	  vec3 box = boxSize - vec3(radius);
	  box = vec3(max(0.0, box.x), max(0.0, box.y), max(0.0, box.z));
	  vec3 p = signs * box;
  
	  transformed = signs * box + normalize(position) * radius;
	  
	  // re-compute normals for correct shadows and reflections
	  objectNormal = all(equal(p, transformed)) ? normal : normalize(position); 
	  transformedNormal = normalize(normalMatrix * objectNormal);
	  vNormal = transformedNormal;
	  `
	);
 
};

// innerCube.material.onBeforeCompile = shader => {
  
// 	shader.uniforms.boxSize = settings1.size;
// 	shader.uniforms.radius = settings1.radius;
	
// 	shader.vertexShader = `
// 	uniform vec3 boxSize;
// 	uniform float radius;
// 	` + shader.vertexShader;
	
// 	shader.vertexShader = shader.vertexShader.replace(
// 	  `#include <begin_vertex>`,
// 	  `#include <begin_vertex>
	  
  
// 	  vec3 signs = sign(position);
// 	  vec3 box = boxSize - vec3(radius);
// 	  box = vec3(max(0.0, box.x), max(0.0, box.y), max(0.0, box.z));
// 	  vec3 p = signs * box;
  
// 	  transformed = signs * box + normalize(position) * radius;
	  
// 	  // re-compute normals for correct shadows and reflections
// 	  objectNormal = all(equal(p, transformed)) ? normal : normalize(position); 
// 	  transformedNormal = normalize(normalMatrix * objectNormal);
// 	  vNormal = transformedNormal;
// 	  `
// 	);
// };



const parentCube = new THREE.Group();
// parentCube.add(innerCube);
parentCube.add(cube);
scene.add( parentCube );


gui.add(settings.radius, 'value').min(0).max(1).step(0.1).name('radius');
gui.add(boxMaterial,'reflectivity').min(0.1).max(1).step(0.1).name('inside Reflection');
gui.add(boxMaterial,'refractionRatio').min(-1).max(1).step(0.01).name('Refraction Ratio').onChange( (value) => {
	boxMaterial.refractionRatio = value;
});
// gui.add(outsideCube.material,'reflectivity').min(0.1).max(1).step(0.1).name('outside Reflection');
gui.add(boxMaterial,'wireframe');


const clock = new THREE.Clock();

const animate = () => {
	const elapsedTime = clock.getElapsedTime();

	// parentCube.rotation.x = elapsedTime * 0.1;
	// parentCube.rotation.y =  elapsedTime * 0.1;


	parentCube.visible = false;
	cubeCamera.position.copy(cube.position);
	cubeCamera.update( scene.renderer, scene.scene );
	parentCube.visible = true;


	scene.onUpdate();
	scene.onUpdateStats();
	requestAnimationFrame( animate );
};

animate();