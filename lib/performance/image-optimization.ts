'use client';

import React from 'react';

// Image optimization utilities
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  blur?: number;
  priority?: boolean;
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private loadedImages = new Set<string>();
  private preloadQueue = new Map<string, Promise<void>>();

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Generate optimized image URL
  optimizeImage(src: string, options: ImageOptimizationOptions = {}): string {
    const {
      width = 800,
      height,
      quality = 80,
      format = 'webp',
      blur,
    } = options;

    // For Next.js Image optimization
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: quality.toString(),
    });

    if (height) params.set('h', height.toString());
    if (blur) params.set('blur', blur.toString());

    return `/_next/image?${params.toString()}`;
  }

  // Preload critical images
  preloadImage(src: string, options: ImageOptimizationOptions = {}): Promise<void> {
    const optimizedSrc = this.optimizeImage(src, options);
    
    if (this.preloadQueue.has(optimizedSrc)) {
      return this.preloadQueue.get(optimizedSrc)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedImages.add(optimizedSrc);
        resolve();
      };
      img.onerror = reject;
      img.src = optimizedSrc;
    });

    this.preloadQueue.set(optimizedSrc, promise);
    return promise;
  }

  // Batch preload images
  async preloadImages(images: Array<{ src: string; options?: ImageOptimizationOptions }>): Promise<void> {
    const promises = images.map(({ src, options }) => 
      this.preloadImage(src, options).catch(() => {}) // Ignore individual failures
    );
    
    await Promise.allSettled(promises);
  }

  // Check if image is loaded
  isImageLoaded(src: string, options: ImageOptimizationOptions = {}): boolean {
    const optimizedSrc = this.optimizeImage(src, options);
    return this.loadedImages.has(optimizedSrc);
  }

  // Progressive loading with placeholder
  generatePlaceholder(src: string): string {
    // Generate low-quality placeholder
    return this.optimizeImage(src, {
      width: 40,
      quality: 10,
      blur: 10,
    });
  }

  // Responsive image srcSet generation
  generateSrcSet(src: string, widths: number[]): string {
    return widths
      .map(width => {
        const optimizedSrc = this.optimizeImage(src, { width, quality: 80 });
        return `${optimizedSrc} ${width}w`;
      })
      .join(', ');
  }

  // Auto-detect optimal format based on browser support
  getSupportedFormat(): 'avif' | 'webp' | 'jpeg' {
    if (typeof window === 'undefined') return 'webp';
    
    const canvas = document.createElement('canvas');
    
    // Check AVIF support
    if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
      return 'avif';
    }
    
    // Check WebP support
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return 'webp';
    }
    
    return 'jpeg';
  }

  // Lazy loading with Intersection Observer
  setupLazyLoading() {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const dataSrc = img.getAttribute('data-src');
            
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      observer.observe(img);
    });
  }
}

// React hook for optimized images
export function useOptimizedImage(
  src: string,
  options: ImageOptimizationOptions = {}
) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const optimizer = ImageOptimizer.getInstance();

  React.useEffect(() => {
    if (options.priority) {
      optimizer.preloadImage(src, options)
        .then(() => setIsLoaded(true))
        .catch((err) => setError(err.message));
    }
  }, [src, options.priority]);

  const optimizedSrc = optimizer.optimizeImage(src, options);
  const placeholder = optimizer.generatePlaceholder(src);
  const srcSet = optimizer.generateSrcSet(src, [400, 800, 1200, 1600]);

  return {
    src: optimizedSrc,
    placeholder,
    srcSet,
    isLoaded,
    error,
    preload: () => optimizer.preloadImage(src, options),
  };
}

// Optimized Image component
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  ...options
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
} & ImageOptimizationOptions) {
  const { src: optimizedSrc, placeholder, srcSet, isLoaded } = useOptimizedImage(
    src,
    { width, height, priority, ...options }
  );

  return React.createElement('div', {
    className: `relative overflow-hidden ${className}`
  }, [
    !isLoaded && React.createElement('img', {
      key: 'placeholder',
      src: placeholder,
      alt: '',
      className: 'absolute inset-0 w-full h-full object-cover filter blur-sm',
      'aria-hidden': true
    }),
    React.createElement('img', {
      key: 'main',
      src: optimizedSrc,
      srcSet: srcSet,
      sizes: '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px',
      alt: alt,
      width: width,
      height: height,
      className: `w-full h-full object-cover transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`,
      loading: priority ? 'eager' : 'lazy',
      onLoad: () => {
        // Handle load state if needed
      }
    })
  ].filter(Boolean));
}

// Critical resource preloader
export function preloadCriticalResources() {
  const optimizer = ImageOptimizer.getInstance();
  
  // Preload critical images
  const criticalImages = [
    { src: '/logo.png', options: { priority: true } },
    { src: '/hero-image.jpg', options: { priority: true, width: 1200 } },
  ];

  optimizer.preloadImages(criticalImages);
}

// Asset optimization utilities
export const assetOptimizer = {
  // CSS critical path optimization
  loadNonCriticalCSS: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
    };
    document.head.appendChild(link);
  },

  // Preload important scripts
  preloadScript: (src: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
  },

  // DNS prefetch for external resources
  dnsPrefetch: (domains: string[]) => {
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  },
};

export const imageOptimizer = ImageOptimizer.getInstance();

// Initialize lazy loading when component mounts
export function useImageOptimization() {
  React.useEffect(() => {
    imageOptimizer.setupLazyLoading();
    preloadCriticalResources();
  }, []);
}