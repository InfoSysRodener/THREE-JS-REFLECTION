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
])

const environmentMapInside = new THREE.CubeTextureLoader().load([
	'./texture/1/nx.png',
	'./texture/1/px.png',
	'./texture/1/ny.png',
	'./texture/1/py.png',
	'./texture/1/nz.png',
	'./texture/1/pz.png',
])

/**
 * Scene
 */
const canvas = document.querySelector('#canvas');
const scene = new SceneManager(canvas);
let conf = { color : '#555555' }; 
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


const boxGeometry = new THREE.BoxBufferGeometry(4,4,4, 10, 10, 10);
const boxMaterial = new THREE.MeshPhongMaterial({ 
	envMap:environmentMapInside,
	reflectivity: 0.8,
	color: 0xFFFFFF,
	opacity: 0.5,
	side:THREE.BackSide,
	transparent: true,
	// envMapIntensity: 5,
	premultipliedAlpha: true
});


const settings = {
	segments: 9,
	radius: {value: 1 },
	size: {
	  value: new THREE.Vector3(4,4,4)
	}
}

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


const cube = new THREE.Mesh(boxGeometry, boxMaterial);
const outsideCube = cube.clone();
outsideCube.material = new THREE.MeshPhongMaterial( {
	envMap:environmentMap,
	color: 0xffffff,
	reflectivity: 0.5,
	opacity: 0.25,
	side: THREE.FrontSide,
	transparent: true,
	envMapIntensity: 10,
	premultipliedAlpha: true
});;

outsideCube.material.onBeforeCompile = shader => {
  
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


const parentCube = new THREE.Group();
parentCube.add( cube );
parentCube.add( outsideCube );
scene.add( parentCube );

gui.add(settings.radius, 'value').min(0).max(1).step(0.1).name('radius');
gui.add(boxMaterial,'reflectivity').min(0.1).max(1).step(0.1).name('inside Reflection');
gui.add(outsideCube.material,'reflectivity').min(0.1).max(1).step(0.1).name('outside Reflection');
gui.add(boxMaterial,'wireframe');


const clock = new THREE.Clock();

const animate = () => {
	const elapsedTime = clock.getElapsedTime();

	parentCube.rotation.x = elapsedTime * 0.1;
	parentCube.rotation.y = - elapsedTime * 0.1;

	
	scene.onUpdate();
	scene.onUpdateStats();
	requestAnimationFrame( animate );
};

animate();