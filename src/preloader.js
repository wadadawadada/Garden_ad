import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AudioLoader } from 'three';

(function(){
  var preloader = document.createElement("div");
  preloader.id = "preloader";
  preloader.style.position = "fixed";
  preloader.style.top = "0";
  preloader.style.left = "0";
  preloader.style.width = "100%";
  preloader.style.height = "100%";
  preloader.style.backgroundColor = "#000";
  preloader.style.zIndex = "9999";
  preloader.style.display = "flex";
  preloader.style.flexDirection = "column";
  preloader.style.justifyContent = "center";
  preloader.style.alignItems = "center";
  document.body.appendChild(preloader);
  
  var logo = document.createElement("img");
  logo.src = "/assets/logo.png";
  logo.style.maxWidth = "30%";
  logo.style.maxHeight = "30%";
  preloader.appendChild(logo);
  
  var percentage = document.createElement("div");
  percentage.id = "preloader-percentage";
  percentage.style.position = "absolute";
  percentage.style.bottom = "150px";
  percentage.style.fontFamily = "helvetica, sans-serif";
  percentage.style.fontWeight = "bold";
  percentage.style.fontSize = "32px";
  percentage.style.color = "#fff";
  percentage.innerText = "0%";
  preloader.appendChild(percentage);
  
  var manager = new THREE.LoadingManager();
  manager.onProgress = function(url, itemsLoaded, itemsTotal){
    var progress = Math.round((itemsLoaded / itemsTotal) * 100);
    percentage.innerText = progress + "%";
  };
  manager.onLoad = function(){
    logo.style.transition = "opacity 1s ease";
    percentage.style.transition = "opacity 1s ease";
    logo.style.opacity = "0";
    percentage.style.opacity = "0";
    setTimeout(function(){
      preloader.style.transition = "opacity 1s ease";
      preloader.style.opacity = "0";
      setTimeout(function(){
        document.body.removeChild(preloader);
        window.dispatchEvent(new Event("preloaderDone"));
      }, 500);
    }, 500);
  };
  manager.onError = function(url){
    console.error("Error loading " + url);
  };
  window.__preloaderManager = manager;
  
  var gltfLoader = new GLTFLoader(manager);
  var audioLoader = new AudioLoader(manager);
  var textureLoader = new THREE.TextureLoader(manager);
  window.__assets = {};
  
  gltfLoader.load('/assets/ground.glb', function(gltf){
    window.__assets.ground = gltf;
  });
  gltfLoader.load('/assets/zones.glb', function(gltf){
    window.__assets.zones = gltf;
  });
  gltfLoader.load('/assets/objects.glb', function(gltf){
    window.__assets.objects = gltf;
  });
  gltfLoader.load('/assets/sheep.glb', function(gltf){
    window.__assets.sheep = gltf;
  });
  
  audioLoader.load('/assets/theme.mp3', function(buffer){
    window.__assets.theme = buffer;
  });
  audioLoader.load('/assets/click_003.mp3', function(buffer){
    window.__assets.click003 = buffer;
  });
  audioLoader.load('/assets/popup_chest.mp3', function(buffer){
    window.__assets.popupChest = buffer;
  });
  audioLoader.load('/assets/throw_spear.mp3', function(buffer){
    window.__assets.throwSpear = buffer;
  });
  audioLoader.load('/assets/sheep.mp3', function(buffer){
    window.__assets.sheepSound = buffer;
  });
  audioLoader.load('/assets/cow.mp3', function(buffer){
    window.__assets.cow = buffer;
  });
  audioLoader.load('/assets/chicken.mp3', function(buffer){
    window.__assets.chicken = buffer;
  });
  audioLoader.load('/assets/sheep2.mp3', function(buffer){
    window.__assets.sheep2 = buffer;
  });
  
  textureLoader.load('/assets/plus.png', function(texture){
    window.__assets.plus = texture;
  });
  textureLoader.load('/assets/tomato.png', function(texture){
    window.__assets.tomato = texture;
  });
  textureLoader.load('/assets/corn.png', function(texture){
    window.__assets.corn = texture;
  });
  textureLoader.load('/assets/grape.png', function(texture){
    window.__assets.grape = texture;
  });
  textureLoader.load('/assets/strawberry.png', function(texture){
    window.__assets.strawberry = texture;
  });
  textureLoader.load('/assets/sheep.png', function(texture){
    window.__assets.sheepImg = texture;
  });
  textureLoader.load('/assets/cow.png', function(texture){
    window.__assets.cowImg = texture;
  });
  textureLoader.load('/assets/skip_day.png', function(texture){
    window.__assets.skipDay = texture;
  });
  textureLoader.load('/assets/next_day.svg', function(texture){
    window.__assets.nextDay = texture;
  });
  textureLoader.load('/assets/well_done.svg', function(texture){
    window.__assets.wellDone = texture;
  });
  textureLoader.load('/assets/download.svg', function(texture){
    window.__assets.download = texture;
  });
  textureLoader.load('/assets/store.png', function(texture){
    window.__assets.store = texture;
  });
  textureLoader.load('/assets/plant.svg', function(texture){
    window.__assets.plant = texture;
  });
})();
