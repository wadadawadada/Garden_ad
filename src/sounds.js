import * as THREE from 'three';
import themeMp3 from '../assets/theme.mp3';
import click003Mp3 from '../assets/click_003.mp3';
import popupChestMp3 from '../assets/popup_chest.mp3';
import throwSpearMp3 from '../assets/throw_spear.mp3';
import sheepMp3 from '../assets/sheep.mp3';
import cowMp3 from '../assets/cow.mp3';
import chickenMp3 from '../assets/chicken.mp3';
import sheep2Mp3 from '../assets/sheep2.mp3';

export let globalListener = null;

const AUDIO_DEPENDENCIES = {
  'theme.mp3': themeMp3,
  'click_003.mp3': click003Mp3,
  'popup_chest.mp3': popupChestMp3,
  'throw_spear.mp3': throwSpearMp3,
  'sheep.mp3': sheepMp3,
  'cow.mp3': cowMp3,
  'chicken.mp3': chickenMp3,
  'sheep2.mp3': sheep2Mp3
};

export function addBackgroundMusic(camera, scene) {
  const listener = new THREE.AudioListener();
  globalListener = listener;
  camera.add(listener);
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  
  const useBase64 = typeof window !== 'undefined' && window.__ASSETS__ && window.__ASSETS__['theme.mp3'];
  const source = useBase64 ? window.__ASSETS__['theme.mp3'] : AUDIO_DEPENDENCIES['theme.mp3'];
  
  const playBuffer = (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    const resumeAudio = () => {
      if (sound.context.state === 'suspended') {
        sound.context.resume().then(() => sound.play());
      } else {
        sound.play();
      }
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);
  };

  if (useBase64) {
    fetch(source)
      .then(r => r.arrayBuffer())
      .then(playBuffer)
      .catch(e => console.error('Error fetching theme.mp3:', e));
  } else {
    audioLoader.load(source, playBuffer, undefined, (e) => {
      console.error('Error loading theme.mp3:', e);
    });
  }
  scene.add(sound);
}

export function playSound(file) {
  if (!globalListener) return;
  const fileName = file.split('/').pop();
  const audioLoader = new THREE.AudioLoader();
  const sound = new THREE.Audio(globalListener);
  
  const useBase64 = typeof window !== 'undefined' && window.__ASSETS__ && window.__ASSETS__[fileName];
  const source = useBase64 ? window.__ASSETS__[fileName] : AUDIO_DEPENDENCIES[fileName];
  
  const playBuffer = (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(1.0);
    sound.play();
  };
  
  if (useBase64) {
    fetch(source)
      .then(r => r.arrayBuffer())
      .then(playBuffer)
      .catch(e => console.error(`Error fetching ${fileName}:`, e));
  } else {
    audioLoader.load(source, playBuffer, undefined, (e) => {
      console.error('Error loading sound:', fileName, e);
    });
  }
}
