import * as THREE from "three";

export class WebglControllerAbstract {
  stop() {}
}

export class WebglControllerBase {
  constructor(element) {
    this.element = element;
  }

  responsive = () => {
    if (this.context) {
      const canvas = this.context.renderer.domElement;
      const canvasSize = {
        width: canvas.clientWidth * window.devicePixelRatio,
        height: canvas.clientHeight * window.devicePixelRatio
      };

      if (
        canvas.width !== canvasSize.width ||
        canvas.height !== canvasSize.height
      ) {
        this.context.renderer.setSize(canvasSize.width, canvasSize.height, false);
        if (this.context.camera instanceof THREE.PerspectiveCamera) {
          this.context.camera.aspect = canvasSize.width / canvasSize.height;
        }

        this.context.camera.updateProjectionMatrix();
      }
    }
  };
}
