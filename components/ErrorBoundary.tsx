"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center min-h-64 p-8">
          <div className="border border-destructive/30 bg-destructive/10 rounded-2xl p-8 max-w-md text-center">
            <h2 className="text-base font-bold text-destructive mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
