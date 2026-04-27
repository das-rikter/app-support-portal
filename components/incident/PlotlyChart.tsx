"use client";

import { useEffect, useRef } from 'react';

interface Props {
  data: object[];
  layout: object;
  className?: string;
}

function resolveCssVar(value: string): string {
  const match = /^var\((--[a-zA-Z0-9-_]+)\)$/.exec(value.trim());
  if (!match) return value;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return resolved || value;
}

function resolvePlotlyValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return resolveCssVar(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolvePlotlyValue(item));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, val]) => ({
      ...acc,
      [key]: resolvePlotlyValue(val),
    }), {} as Record<string, unknown>);
  }
  return value;
}

function resolvePlotlyObject<T>(value: T): T {
  return resolvePlotlyValue(value) as T;
}

export function PlotlyChart({ data, layout, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let observer: MutationObserver | null = null;

    const renderPlot = async () => {
      const Plotly = await import('plotly.js-dist-min');
      if (cancelled || !ref.current) return;
      plotlyRef.current = Plotly;

      const plot = () => {
        if (!ref.current || !plotlyRef.current) return;
        const resolvedData = resolvePlotlyObject(data);
        const resolvedLayout = resolvePlotlyObject(layout);
        plotlyRef.current.react(ref.current, resolvedData, resolvedLayout, { displayModeBar: false, responsive: true });
      };

      plot();

      const root = document.documentElement;
      observer = new MutationObserver((mutations) => {
        if (mutations.some((mutation) => mutation.attributeName === 'class')) {
          plot();
        }
      });
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    };

    renderPlot();

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
    };
  }, [data, layout]);

  return <div ref={ref} className={className} />;
}
