"use client";

import { useEffect, useRef } from 'react';

interface Props {
  data: object[];
  layout: object;
  className?: string;
}

export function PlotlyChart({ data, layout, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('plotly.js-dist-min').then((Plotly: any) => {
      if (cancelled || !ref.current) return;
      Plotly.react(ref.current, data, layout, { displayModeBar: false, responsive: true });
    });
    return () => {
      cancelled = true;
    };
  }, [data, layout]);

  return <div ref={ref} className={className} />;
}
