import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Mesh, PerspectiveCamera } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Asset3D } from '../domain/asset3d';
import type { MachineComponentId, LearningActivityId } from '../domain/ids';
import type {
  ViewerLoadState,
  ViewerAnimationState,
  ViewerCommand,
  Visibility,
} from './contracts';
import { assetUrl } from './viewer-logic';
import { SceneRuntime } from './scene-runtime';
import { fitInspectionCamera } from './camera-fit';

const binaries = new Map<string, Promise<ArrayBuffer>>();
class LoadFailure extends Error {
  constructor(readonly code: 'asset-load' | 'asset-decode' | 'node-mapping') {
    super(code);
  }
}
async function load(asset: Asset3D, activity: LearningActivityId) {
  const url = assetUrl(asset.uri, import.meta.env.BASE_URL);
  let bytes = binaries.get(url);
  if (!bytes) {
    bytes = fetch(url).then((response) => {
      if (!response.ok) throw new LoadFailure('asset-load');
      return response.arrayBuffer();
    });
    binaries.set(url, bytes);
    bytes.catch(() => binaries.delete(url));
  }
  const buffer = await bytes;
  let gltf;
  try {
    gltf = await new GLTFLoader().parseAsync(
      buffer,
      url.substring(0, url.lastIndexOf('/') + 1),
    );
  } catch {
    binaries.delete(url);
    throw new LoadFailure('asset-decode');
  }
  try {
    return new SceneRuntime(gltf.scene, asset, gltf.animations, activity);
  } catch {
    const materials = new Set<import('three').Material>();
    gltf.scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(material);
      }
    });
    materials.forEach((material) => material.dispose());
    throw new LoadFailure('node-mapping');
  }
}
function webglSupported() {
  try {
    const context = document.createElement('canvas').getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
interface Props {
  readonly asset: Asset3D;
  readonly activity: LearningActivityId;
  readonly selected: MachineComponentId | null;
  readonly visibility: Visibility;
  readonly command: ViewerCommand;
  readonly onSelect: (id: MachineComponentId | null) => void;
  readonly onLoad: (state: ViewerLoadState) => void;
  readonly onAnimation: (state: ViewerAnimationState) => void;
}
class RenderBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function Scene({
  runtime,
  props,
  fit,
  ready,
}: {
  runtime: SceneRuntime;
  props: Props;
  fit: number;
  ready: () => void;
}) {
  const { camera, gl, invalidate, size } = useThree();
  const { onLoad, onAnimation, command } = props;
  const controls = useRef<OrbitControls | null>(null);
  const samples = useRef<number[]>([]);
  const last = useRef(0);
  const samplePose = useRef(runtime.pose);
  useEffect(() => {
    const control = new OrbitControls(camera, gl.domElement);
    control.enableDamping = true;
    control.minDistance = 2;
    control.maxDistance = 40;
    controls.current = control;
    const lost = (event: Event) => {
      event.preventDefault();
      onLoad({
        status: 'error',
        code: 'context-lost',
        message: 'Контекст 3D потерян. Повторите загрузку.',
      });
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    gl.domElement.setAttribute('aria-label', 'Интерактивная 3D-модель машины');
    ready();
    return () => {
      control.dispose();
      controls.current = null;
      gl.domElement.removeEventListener('webglcontextlost', lost);
    };
  }, [camera, gl, onLoad, ready]);
  useEffect(() => {
    const center = fitInspectionCamera(
      camera as PerspectiveCamera,
      runtime.scene,
    );
    controls.current?.target.copy(center);
    controls.current?.update();
    invalidate();
  }, [runtime, fit, camera, invalidate, size.width, size.height]);
  useEffect(() => {
    runtime.select(props.selected);
    invalidate();
  }, [runtime, props.selected, invalidate]);
  useEffect(() => {
    runtime.visibility(props.visibility);
    invalidate();
  }, [runtime, props.visibility, invalidate]);
  useEffect(() => {
    runtime[command.kind]();
    onAnimation(
      runtime.animation.status === 'available'
        ? {
            status: 'available',
            playback: runtime.pose === 'playing' ? 'playing' : 'paused',
          }
        : runtime.animation,
    );
  }, [runtime, command, onAnimation]);
  useFrame((_, delta) => {
    runtime.update(delta);
    controls.current?.update();
    const now = performance.now();
    if (samplePose.current !== runtime.pose) {
      samplePose.current = runtime.pose;
      samples.current = [];
      last.current = 0;
    }
    if (last.current) samples.current.push(now - last.current);
    last.current = now;
    if (samples.current.length === 120) {
      const average =
        samples.current.reduce((a, b) => a + b, 0) / samples.current.length;
      gl.domElement.dispatchEvent(
        new CustomEvent('viewer-metrics', {
          bubbles: true,
          detail: {
            pose: runtime.pose,
            frameIntervalMs: average,
            approximateFps: 1000 / average,
            geometries: gl.info.memory.geometries,
            textures: gl.info.memory.textures,
            drawCalls: gl.info.render.calls,
            triangles: gl.info.render.triangles,
          },
        }),
      );
      samples.current = [];
    }
  });
  return (
    <>
      <color attach="background" args={['#e7edef']} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 9, 7]} intensity={3} />
      <directionalLight position={[-6, 4, -4]} intensity={1.3} />
      <primitive
        object={runtime.scene}
        dispose={null}
        onClick={(event: {
          stopPropagation(): void;
          object: { name: string };
        }) => {
          event.stopPropagation();
          const component = runtime.mappings.hits.get(event.object.name);
          if (component) props.onSelect(component);
        }}
      />
    </>
  );
}
export default function ProductionViewer(props: Props) {
  const [runtime, setRuntime] = useState<SceneRuntime | null>(null);
  const [supported] = useState(webglSupported);
  const [attempt, setAttempt] = useState(0);
  const [fit, setFit] = useState(0);
  const [state, setState] = useState<ViewerLoadState>({ status: 'loading' });
  const started = useRef(performance.now());
  const container = useRef<HTMLDivElement>(null);
  // Keep callbacks stable without making loads/controls depend on changing UI objects.
  const callbacks = useRef(props);
  useEffect(() => {
    callbacks.current = props;
  });
  const [report] = useState(() => (value: ViewerLoadState) => {
    setState(value);
    callbacks.current.onLoad(value);
  });
  const [ready] = useState(() => () => {
    report({ status: 'ready' });
    container.current?.setAttribute(
      'data-ready-ms',
      String(performance.now() - started.current),
    );
  });
  useEffect(() => {
    if (!supported) {
      report({ status: 'unsupported', reason: 'webgl-unavailable' });
      return;
    }
    let alive = true;
    let owned: SceneRuntime | undefined;
    started.current = performance.now();
    report({ status: 'loading' });
    load(props.asset, props.activity)
      .then((result) => {
        owned = result;
        if (alive) setRuntime(result);
        else result.dispose();
      })
      .catch((error: unknown) => {
        if (alive)
          report({
            status: 'error',
            code: error instanceof LoadFailure ? error.code : 'asset-load',
            message:
              error instanceof LoadFailure && error.code === 'node-mapping'
                ? 'Связь 3D-модели с учебными компонентами не прошла проверку. Текстовый список доступен.'
                : error instanceof LoadFailure && error.code === 'asset-decode'
                  ? 'Не удалось прочитать файл 3D-модели. Текстовый список доступен.'
                  : 'Не удалось загрузить 3D-модель. Текстовые компоненты доступны.',
          });
      });
    return () => {
      alive = false;
      owned?.dispose();
    };
  }, [props.asset, props.activity, attempt, supported, report]);
  const failed = state.status === 'error' || state.status === 'unsupported';
  return (
    <div
      ref={container}
      className="production-viewer"
      data-viewer-state={state.status}
      data-viewer-error={state.status === 'error' ? state.code : undefined}
    >
      <p role="status">
        {state.status === 'ready'
          ? '3D-модель готова'
          : state.status === 'loading'
            ? 'Загрузка 3D-модели…'
            : state.status === 'unsupported'
              ? 'WebGL недоступен. Используйте текстовый список компонентов.'
              : state.status === 'error'
                ? state.message
                : '3D не настроено'}
      </p>
      {failed && supported && (
        <button
          onClick={() => {
            setRuntime(null);
            setAttempt((value) => value + 1);
          }}
        >
          Повторить загрузку 3D
        </button>
      )}
      {!failed && runtime && (
        <RenderBoundary
          key={attempt}
          onError={() =>
            report({
              status: 'error',
              code: 'asset-decode',
              message: 'Не удалось открыть 3D. Текстовый список доступен.',
            })
          }
        >
          <div
            className="viewer-canvas"
            role="img"
            aria-label="3D-модель машины"
            aria-describedby="viewer-instructions"
          >
            <Canvas
              dpr={[1, 1.5]}
              camera={{ fov: 42, near: 0.1, far: 200 }}
              onPointerMissed={() => props.onSelect(null)}
            >
              <Scene
                runtime={runtime}
                props={{ ...props, onLoad: report }}
                fit={fit}
                ready={ready}
              />
            </Canvas>
          </div>
        </RenderBoundary>
      )}
      <p id="viewer-instructions">
        Вращение — перетаскивание, масштаб — колесо или жест. Выбор компонентов
        и управление доступны кнопками ниже.
      </p>
      <button
        disabled={state.status !== 'ready'}
        onClick={() => setFit((value) => value + 1)}
      >
        Вписать модель / сбросить вид
      </button>
    </div>
  );
}
