import * as THREE from "three";

export class SmokePartile {
  constructor(scene) {
    this.scene=scene;
    this.last = -1;
    this.particles = [];
    this.particleNumber = 30;
    this.combine();
    this.render();
  }

  combine = () => {
    this.particles = this.generateParticles();
    this.particles.forEach((item) => this.scene.add(item.mesh));
  };

  generateParticles = () => {
    const group = [];
    const geometry = new THREE.PlaneGeometry(560, 560);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('https://s2.loli.net/2023/07/31/6ZuWkBEFcAxvgPi.png');

    for (let counter = 0; counter < this.particleNumber; counter++) {
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        opacity: 1,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        // wireframe: true,
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        side: THREE.DoubleSide,
      });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.set(
        (Math.random() - 0.5) * 2 * 350,
        (Math.random() - 0.5) * 2 * 50+100,
        (Math.random() - 0.5) * 2 * 100 - 190
      );
      // particle.rotation.z = Math.random() * 360;
      particle.rotation.x=Math.PI / 2
      particle.scale.set(1 + Math.random() * 0.2, 1 + Math.random() * 0.2, 1);

      group.push({
        mesh: particle,
        speed: 0
      });
    }

    return group;
  };


  particleAnimation = (delta) => {
    this.particles.forEach(({ mesh, speed }) => {
      speed=Math.random() * 0.5 + 0.3
      mesh.rotation.z += delta * 0.00012 * speed;
    });
  };

  render = () => {
    const now = Date.now();

    if (!this.last) {
      this.last = now;
    }

    // this.responsive();
    const delta = now - this.last;
    this.last = now;

    this.particleAnimation(delta);
    this.requestAnimationHandler = requestAnimationFrame(this.render);
  };

}
