"use client";
import { useEffect, useRef, useState } from "react";

// Renders public/models/metronome.glb with three.js and swings its pendulum
// ("Tige_1" in the model) to whatever angle getAngle() returns each frame.
// Load with next/dynamic + ssr:false — three.js needs the browser.

export default function Metronome3D({ getAngle }: { getAngle: () => number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const getAngleRef = useRef(getAngle);
  getAngleRef.current = getAngle;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setStatus("error");
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6));
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(3, 5, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xbcd2ff, 1.2);
      rim.position.set(-4, 3, -3);
      scene.add(rim);

      const resize = () => {
        const w = mount.clientWidth, h = mount.clientHeight;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      let pendulum: InstanceType<typeof THREE.Object3D> | null = null;
      let model: InstanceType<typeof THREE.Object3D> | null = null;
      let raf = 0;

      new GLTFLoader().load(
        "/models/metronome.glb",
        (gltf) => {
          if (disposed) return;
          model = gltf.scene;
          scene.add(model);
          pendulum = model.getObjectByName("Tige_1") ?? null;

          // Frame the model: center it and back the camera off to fit its height
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          const fitDist = (size.y / 2) / Math.tan((camera.fov * Math.PI) / 360);
          camera.position.set(size.x * 0.35, size.y * 0.12, fitDist * 1.25 + size.z / 2);
          camera.lookAt(0, 0, 0);
          setStatus("ready");
        },
        undefined,
        () => setStatus("error")
      );

      const clock = new THREE.Clock();
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (pendulum) pendulum.rotation.z = getAngleRef.current();
        // Slow idle sway of the whole model so it reads as 3D
        if (model) model.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.25;
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        scene.traverse((o: any) => {
          o.geometry?.dispose?.();
          const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
          mats.forEach((m: any) => {
            Object.values(m).forEach((v: any) => v?.isTexture && v.dispose());
            m.dispose();
          });
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={mountRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {status === "loading" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 14 }}>
          Loading metronome…
        </div>
      )}
    </div>
  );
}
