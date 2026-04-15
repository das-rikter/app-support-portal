'use client';

import { useEffect, useRef } from 'react';
import { useBugReportStore } from '@/store/useBugReportStore';

const SECTION_IDS = [
  'section-kpis',
  'section-projects',
  'section-priority',
  'section-age',
  'section-timeline',
  'section-status-table',
  'section-weekly',
  'section-open-bugs',
  'section-leads',
];

export function useScrollSpy(): (id: string) => void {
  const setActiveSection = useBugReportStore((s) => s.setActiveSection);
  const clickingRef = useRef(false);

  function setActiveSectionFromClick(id: string) {
    setActiveSection(id);
    clickingRef.current = true;
    setTimeout(() => {
      clickingRef.current = false;
    }, 900);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickingRef.current) return;
        let best: IntersectionObserverEntry | null = null;
        entries.forEach((e) => {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) {
            best = e;
          }
        });
        if (best) setActiveSection((best as IntersectionObserverEntry).target.id);
      },
      { rootMargin: '-10% 0px -60% 0px', threshold: [0, 0.1, 0.25, 0.5] }
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [setActiveSection]);

  return setActiveSectionFromClick;
}
