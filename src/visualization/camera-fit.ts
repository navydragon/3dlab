import { Box3, Vector3 } from 'three';
import type { Object3D, PerspectiveCamera } from 'three';
export function fitInspectionCamera(
  camera: PerspectiveCamera,
  scene: Object3D,
) {
  const box = new Box3().setFromObject(scene);
  const center = box.getCenter(new Vector3());
  const radius = box.getSize(new Vector3()).length() / 2;
  const halfAngle = Math.atan(
    Math.tan((camera.fov * Math.PI) / 360) * Math.min(1, camera.aspect),
  );
  const distance = (radius / Math.sin(halfAngle)) * 1.1;
  camera.position
    .copy(center)
    .add(new Vector3(1, 0.65, 1).normalize().multiplyScalar(distance));
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  return center;
}
