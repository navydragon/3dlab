import { AnimationMixer, LoopRepeat, Mesh, MeshStandardMaterial } from 'three';
import type { AnimationClip, Material, Object3D } from 'three';
import type { Asset3D } from '../domain/asset3d';
import type { MachineComponentId } from '../domain/ids';
import { animationClip, meshVisible, resolveMappings } from './viewer-logic';
import type { Visibility } from './viewer-logic';

export class SceneRuntime {
  readonly mappings;
  readonly animation;
  readonly mixer;
  readonly originals = new Map<Mesh, Material | Material[]>();
  private readonly rest;
  private readonly meshByName = new Map<string, Mesh>();
  private highlights: Material[] = [];
  private readonly action;
  private playing = false;
  pose: 'neutral' | 'paused' | 'playing' = 'neutral';
  constructor(
    readonly scene: Object3D,
    asset: Asset3D,
    clips: readonly AnimationClip[],
    activity: string,
  ) {
    const objects: Object3D[] = [];
    scene.traverse((object) => {
      objects.push(object);
      if (object instanceof Mesh) {
        this.meshByName.set(object.name, object);
        this.originals.set(object, object.material);
      }
    });
    this.mappings = resolveMappings(
      asset,
      objects.map((object) => ({
        name: object.name,
        mesh: object instanceof Mesh,
        selectable: object.userData.edu_selectable === true,
      })),
    );
    this.rest = objects.map((object) => ({
      object,
      position: object.position.clone(),
      quaternion: object.quaternion.clone(),
      scale: object.scale.clone(),
    }));
    this.mixer = new AnimationMixer(scene);
    this.animation = animationClip(
      asset,
      clips.map((clip) => clip.name),
      activity,
    );
    const clip =
      this.animation.status === 'available'
        ? clips.find((clip) => clip.name === this.animation.clip)
        : undefined;
    this.action = clip
      ? this.mixer.clipAction(clip).setLoop(LoopRepeat, Infinity)
      : undefined;
  }
  select(id: MachineComponentId | null) {
    for (const [mesh, material] of this.originals) mesh.material = material;
    this.highlights.forEach((material) => material.dispose());
    this.highlights = [];
    for (const name of id ? (this.mappings.components.get(id) ?? []) : []) {
      const mesh = this.meshByName.get(name)!;
      const highlight = (material: Material) => {
        const clone = material.clone();
        if (clone instanceof MeshStandardMaterial) {
          clone.color.set('#20bdda');
          clone.emissive.set('#08606e');
          clone.emissiveIntensity = 0.35;
        }
        this.highlights.push(clone);
        return clone;
      };
      const original = this.originals.get(mesh)!;
      mesh.material = Array.isArray(original)
        ? original.map(highlight)
        : highlight(original);
    }
  }
  visibility(mode: Visibility) {
    for (const [component, names] of this.mappings.components)
      for (const name of names)
        this.meshByName.get(name)!.visible = meshVisible(component, mode);
  }
  play() {
    if (this.action) {
      this.action.paused = false;
      this.action.play();
      this.playing = true;
      this.pose = 'playing';
    }
  }
  pause() {
    if (this.action && this.pose !== 'neutral') {
      this.action.paused = true;
      this.playing = false;
      this.pose = 'paused';
    }
  }
  reset() {
    this.playing = false;
    this.mixer.stopAllAction();
    this.mixer.time = 0;
    for (const rest of this.rest) {
      rest.object.position.copy(rest.position);
      rest.object.quaternion.copy(rest.quaternion);
      rest.object.scale.copy(rest.scale);
      rest.object.updateMatrix();
    }
    this.scene.updateMatrixWorld(true);
    this.pose = 'neutral';
  }
  update(delta: number) {
    if (this.playing) this.mixer.update(delta);
  }
  dispose() {
    this.reset();
    this.select(null);
    this.mixer.uncacheRoot(this.scene);
    const materials = new Set<Material>();
    const geometries = new Set<Mesh['geometry']>();
    for (const [mesh, original] of this.originals) {
      geometries.add(mesh.geometry);
      for (const material of Array.isArray(original) ? original : [original])
        materials.add(material);
    }
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  }
}
