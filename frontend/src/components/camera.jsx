import { useEffect, useRef, useState, useMemo } from "react";
import Hls from "hls.js";
import "./Camera.css";
import { FALLBACK_CAMERAS, getFallbackCamerasFor } from "../utils/fallback-cameras";

// Camere reale pentru Sera Spanac
const REAL_SPANAC_CAMERAS = [
  { name: "Sera Spanac - Cam #1", type: "mjpeg", src: "https://cam1.pandp.ro/?action=stream" },
  { name: "Sera Spanac - Cam #2", type: "mjpeg", src: "https://cam2.pandp.ro/?action=stream" },
];

export default function Camera({ seraName }) {
  const [wirelessConnection, setWirelessConnection] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Normalizare nume
  const norm = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const seraNorm = norm(seraName);
  const isSpanac = seraNorm.includes("spanac");

  // Selectează lista corectă de camere (reale doar pentru Sera Spanac)
  const activeList = useMemo(() => {
    if (isSpanac) return REAL_SPANAC_CAMERAS;
    const list = getFallbackCamerasFor(seraName);
    return list.length ? list : FALLBACK_CAMERAS;
  }, [seraName]);

  const current = activeList.length > 0 ? activeList[currentIndex % activeList.length] : null;

  useEffect(() => {
    setCurrentIndex(0);
    setErrorCount(0);
    setWirelessConnection(true);
  }, [seraName]);

  useEffect(() => {
    if (!current || !videoRef.current) return;

    const videoEl = videoRef.current;

    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }

    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();

    const handleEnded = () => {
      setCurrentIndex((i) => (i + 1) % activeList.length);
    };

    const onPlayOk = () => {
      setWirelessConnection(true);
      setErrorCount(0);
    };

    videoEl.removeEventListener("ended", handleEnded);
    videoEl.addEventListener("ended", handleEnded);

    if (current.type === "hls") {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(current.src);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoEl.muted = true;
          videoEl
            .play()
            .then(onPlayOk)
            .catch(() => setErrorCount((c) => c + 1));
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data?.fatal) {
            setWirelessConnection(false);
            setErrorCount((c) => c + 1);
            try {
              hls.destroy();
            } catch {}
          }
        });
      } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = current.src;
        videoEl.muted = true;
        videoEl
          .play()
          .then(onPlayOk)
          .catch(() => setErrorCount((c) => c + 1));
      } else {
        setWirelessConnection(false);
        setErrorCount((c) => c + 1);
      }
    } else if (current.type === "mp4") {
      videoEl.src = current.src;
      videoEl.muted = true;
      videoEl
        .play()
        .then(onPlayOk)
        .catch(() => setErrorCount((c) => c + 1));
    }

    return () => {
      videoEl.removeEventListener("ended", handleEnded);
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {}
        hlsRef.current = null;
      }
    };
  }, [currentIndex, current, activeList]);

  const prev = () => setCurrentIndex((i) => (activeList.length ? (i - 1 + activeList.length) % activeList.length : 0));
  const next = () => setCurrentIndex((i) => (activeList.length ? (i + 1) % activeList.length : 0));

  const takeSnapshot = () => {
    if (!videoRef.current || !current) return;
    if (current.type !== "hls" && current.type !== "mp4") return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      window.open(dataUrl, "_blank");
    } catch (e) {
      console.error("Snapshot error:", e);
    }
  };

  if (!current) {
    return (
      <div className="camera-wrapper">
        <div className="camera-card">
          <div className="video-container empty">
            Nu sunt camere disponibile pentru <b>{seraName || "seră necunoscută"}</b>.
          </div>
        </div>
      </div>
    );
  }

  const mediaKey = `${seraName ?? "na"}-${currentIndex}`;

  return (
    <div className="camera-wrapper">
      <div className="camera-card">
        <div className="video-container">
          {current.type === "iframe" ? (
            <div className="iframe-wrapper">
              <iframe key={mediaKey} src={current.src} title={current.name} loading="lazy" allowFullScreen frameBorder="0" className="camera-iframe" />
            </div>
          ) : current.type === "mjpeg" ? (
            <img key={mediaKey} src={current.src} alt={current.name} className="camera-img" />
          ) : (
            <video key={mediaKey} ref={videoRef} {...(showControls ? { controls: true } : {})} muted playsInline className="camera-player" autoPlay loop={current.type === "mp4"} />
          )}

          <div className="overlay-top">
            <div className="left-group">
              <div className="wireless-status">
                <img
                  src={wirelessConnection ? "/assets/img/wireless.svg" : "/assets/img/wireless-error.svg"}
                  alt={wirelessConnection ? "Conexiune OK" : "Eroare conexiune"}
                  className="wireless-icon"
                />
              </div>
              <div className="camera-name">{current.name || seraName || "Cameră"}</div>
            </div>
            <div className="right-group">
              <div className="camera-index">
                {Math.min(currentIndex + 1, activeList.length)}/{activeList.length}
              </div>
              <button aria-label="Comută controale" className="toggle-controls-btn" onClick={() => setShowControls((v) => !v)}>
                <i className="bi bi-three-dots" />
              </button>
            </div>
          </div>

          <div className="overlay-bottom">
            <button aria-label="Anterior" className="control-btn" onClick={prev}>
              <i className="bi bi-chevron-left" />
            </button>
            <button aria-label="Snapshot" className="control-btn" onClick={takeSnapshot}>
              <i className="bi bi-camera" />
            </button>
            <button aria-label="Notificări" className="control-btn">
              <i className="bi bi-bell" />
            </button>
            <button aria-label="Următor" className="control-btn" onClick={next}>
              <i className="bi bi-chevron-right" />
            </button>
          </div>

          {!wirelessConnection && <div className="connection-warning">Probleme de conexiune. Verifică semnalul camerei.</div>}
        </div>
      </div>
    </div>
  );
}
