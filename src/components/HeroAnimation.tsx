import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../design-system/motion';
import './HeroAnimation.css';

export interface ShowcaseVideo {
  readonly id: string;
  readonly title: string;
  readonly src: string;
  readonly playbackRate?: number;
  readonly objectFit?: 'cover' | 'contain';
  readonly objectPosition?: string;
}

export const DEFAULT_PLAYBACK_RATE = 1.4;

export const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  {
    id: 'invoice-generator',
    title: 'Invoice Generator',
    src: 'https://res.cloudinary.com/dlvhsczpp/video/upload/v1787072042/invoive_generator_xv5670.mp4',
    playbackRate: 1.4,
    objectFit: 'cover',
    objectPosition: 'top center',
  },
  {
    id: 'qr-code-generator',
    title: 'QR Code Generator',
    src: 'https://res.cloudinary.com/dlvhsczpp/video/upload/v1787072035/QR_Code_generator_j0hhlr.mp4',
    playbackRate: 1.4,
    objectFit: 'cover',
    objectPosition: 'center center',
  },
  {
    id: 'timezone-finder',
    title: 'Timezone Finder',
    src: 'https://res.cloudinary.com/dlvhsczpp/video/upload/v1787072043/timezone_finder_y25t0h.mp4',
    playbackRate: 1.4,
    objectFit: 'cover',
    objectPosition: 'top center',
  },
  {
    id: 'image-converter',
    title: 'Image Converter',
    src: 'https://res.cloudinary.com/dlvhsczpp/video/upload/v1787072041/Image_converter_t4desq.mp4',
    playbackRate: 1.4,
    objectFit: 'cover',
    objectPosition: 'top center',
  },
  {
    id: 'pdf-merge',
    title: 'PDF Merge',
    src: 'https://res.cloudinary.com/dlvhsczpp/video/upload/v1787072207/pdf_merge_hn4tvd.mp4',
    playbackRate: 1.4,
    objectFit: 'cover',
    objectPosition: 'top center',
  },
];

const CROSSFADE_DURATION_MS = 250;
const TRANSITION_TRIGGER_LEAD_SEC = 0.28;

export function HeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const video0Ref = useRef<HTMLVideoElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);

  const reducedMotion = useReducedMotion();

  // Layer 0 or Layer 1 is currently the active (visible) layer
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);
  const [layerVideos, setLayerVideos] = useState<{ 0: ShowcaseVideo; 1: ShowcaseVideo }>({
    0: SHOWCASE_VIDEOS[0] ?? { id: '', title: '', src: '' },
    1: SHOWCASE_VIDEOS[1] ?? { id: '', title: '', src: '' },
  });

  const currentIndexRef = useRef(0);
  const activeLayerRef = useRef<0 | 1>(0);
  const isTransitioningRef = useRef(false);
  const isVisibleRef = useRef(true);

  // Keep activeLayerRef in sync
  activeLayerRef.current = activeLayer;

  const applyPlaybackRate = (vid: HTMLVideoElement, videoDef?: ShowcaseVideo) => {
    const rate = videoDef?.playbackRate ?? DEFAULT_PLAYBACK_RATE;
    vid.playbackRate = rate;
    vid.defaultPlaybackRate = rate;
  };

  useEffect(() => {
    const video0 = video0Ref.current;
    const video1 = video1Ref.current;
    const container = containerRef.current;
    if (!video0 || !video1 || !container) return;

    let isMounted = true;

    // Explicitly guarantee muted state on DOM elements for reliable autoplay
    video0.muted = true;
    video0.defaultMuted = true;
    video1.muted = true;
    video1.defaultMuted = true;

    applyPlaybackRate(video0, SHOWCASE_VIDEOS[0]);
    applyPlaybackRate(video1, SHOWCASE_VIDEOS[1]);

    // Viewport intersection observer to pause playback off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isIntersecting = entry?.isIntersecting ?? false;
        isVisibleRef.current = isIntersecting;

        const currentActiveVideo = activeLayerRef.current === 0 ? video0 : video1;
        const currentActiveDef = SHOWCASE_VIDEOS[currentIndexRef.current];
        if (isIntersecting) {
          applyPlaybackRate(currentActiveVideo, currentActiveDef);
          currentActiveVideo.play().catch(() => {});
        } else {
          currentActiveVideo.pause();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(container);

    const triggerNext = () => {
      if (isTransitioningRef.current || !isMounted) return;
      isTransitioningRef.current = true;

      const currentLayer = activeLayerRef.current;
      const nextLayer: 0 | 1 = currentLayer === 0 ? 1 : 0;

      const outgoingVideo = currentLayer === 0 ? video0 : video1;
      const incomingVideo = nextLayer === 0 ? video0 : video1;

      const nextIndex = (currentIndexRef.current + 1) % SHOWCASE_VIDEOS.length;
      currentIndexRef.current = nextIndex;
      const incomingDef = SHOWCASE_VIDEOS[nextIndex];

      // Start playing incoming video
      incomingVideo.muted = true;
      applyPlaybackRate(incomingVideo, incomingDef);

      if (incomingVideo.readyState >= 2) {
        try {
          incomingVideo.currentTime = 0;
        } catch {
          // Ignore
        }
      }
      if (isVisibleRef.current) {
        incomingVideo.play().catch(() => {});
      }

      // Switch active layer to initiate crossfade
      setActiveLayer(nextLayer);

      const fadeDuration = reducedMotion ? 0 : CROSSFADE_DURATION_MS;

      setTimeout(() => {
        if (!isMounted) return;

        // Reset outgoing video
        outgoingVideo.pause();
        try {
          outgoingVideo.currentTime = 0;
        } catch {
          // Ignore if cannot seek
        }

        // Prepare the subsequent video on the now-inactive layer
        const subsequentIndex = (nextIndex + 1) % SHOWCASE_VIDEOS.length;
        const subsequentDef = SHOWCASE_VIDEOS[subsequentIndex] ?? { id: '', title: '', src: '' };

        setLayerVideos((prev) => ({
          ...prev,
          [currentLayer]: subsequentDef,
        }));

        // Allow inactive video to preload metadata/buffer
        outgoingVideo.load();

        isTransitioningRef.current = false;
      }, fadeDuration);
    };

    const handleTimeUpdate = (e: Event) => {
      const vid = e.currentTarget as HTMLVideoElement;
      const currentActiveVideo = activeLayerRef.current === 0 ? video0 : video1;
      if (vid !== currentActiveVideo) return;

      const currentDef = SHOWCASE_VIDEOS[currentIndexRef.current];
      applyPlaybackRate(vid, currentDef);

      if (vid.duration && Number.isFinite(vid.duration)) {
        const rate = vid.playbackRate || DEFAULT_PLAYBACK_RATE;
        const remainingRealSeconds = (vid.duration - vid.currentTime) / rate;
        if (remainingRealSeconds <= TRANSITION_TRIGGER_LEAD_SEC && !isTransitioningRef.current) {
          triggerNext();
        }
      }
    };

    const handleLoadedMetadata = (e: Event) => {
      const vid = e.currentTarget as HTMLVideoElement;
      const isLayer0 = vid === video0;
      const layerDef = isLayer0 ? layerVideos[0] : layerVideos[1];
      applyPlaybackRate(vid, layerDef);
    };

    const handleEnded = (e: Event) => {
      const vid = e.currentTarget as HTMLVideoElement;
      const currentActiveVideo = activeLayerRef.current === 0 ? video0 : video1;
      if (vid === currentActiveVideo && !isTransitioningRef.current) {
        triggerNext();
      }
    };

    const handleError = (e: Event) => {
      const vid = e.currentTarget as HTMLVideoElement;
      const currentActiveVideo = activeLayerRef.current === 0 ? video0 : video1;
      // Skip smoothly to next clip if an error occurs
      if (vid === currentActiveVideo && !isTransitioningRef.current) {
        triggerNext();
      }
    };

    video0.addEventListener('timeupdate', handleTimeUpdate);
    video0.addEventListener('loadedmetadata', handleLoadedMetadata);
    video0.addEventListener('play', handleLoadedMetadata);
    video0.addEventListener('ended', handleEnded);
    video0.addEventListener('error', handleError);

    video1.addEventListener('timeupdate', handleTimeUpdate);
    video1.addEventListener('loadedmetadata', handleLoadedMetadata);
    video1.addEventListener('play', handleLoadedMetadata);
    video1.addEventListener('ended', handleEnded);
    video1.addEventListener('error', handleError);

    // Initial start
    if (isVisibleRef.current) {
      applyPlaybackRate(video0, SHOWCASE_VIDEOS[0]);
      video0.play().catch(() => {});
    }

    return () => {
      isMounted = false;
      observer.disconnect();
      video0.removeEventListener('timeupdate', handleTimeUpdate);
      video0.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video0.removeEventListener('play', handleLoadedMetadata);
      video0.removeEventListener('ended', handleEnded);
      video0.removeEventListener('error', handleError);
      video1.removeEventListener('timeupdate', handleTimeUpdate);
      video1.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video1.removeEventListener('play', handleLoadedMetadata);
      video1.removeEventListener('ended', handleEnded);
      video1.removeEventListener('error', handleError);
    };
  }, [reducedMotion, layerVideos]);

  return (
    <div className="hero-showcase" ref={containerRef} aria-hidden="true">
      <video
        ref={video0Ref}
        src={layerVideos[0].src}
        style={{
          objectFit: layerVideos[0].objectFit ?? 'cover',
          objectPosition: layerVideos[0].objectPosition ?? 'top center',
        }}
        className={`hero-showcase__video ${
          activeLayer === 0 ? 'hero-showcase__video--active' : 'hero-showcase__video--inactive'
        }`}
        muted
        autoPlay
        playsInline
        tabIndex={-1}
        preload="auto"
      />
      <video
        ref={video1Ref}
        src={layerVideos[1].src}
        style={{
          objectFit: layerVideos[1].objectFit ?? 'cover',
          objectPosition: layerVideos[1].objectPosition ?? 'top center',
        }}
        className={`hero-showcase__video ${
          activeLayer === 1 ? 'hero-showcase__video--active' : 'hero-showcase__video--inactive'
        }`}
        muted
        playsInline
        tabIndex={-1}
        preload="auto"
      />
    </div>
  );
}
