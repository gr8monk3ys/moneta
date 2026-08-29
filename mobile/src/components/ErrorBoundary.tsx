import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FatalErrorScreen } from '../screens/ConfigErrorScreen';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Root error boundary. Without one, any render-time throw unmounts the whole
 * tree and leaves a blank screen with no explanation — which is exactly how
 * the missing-API-URL bug presented. Note that this can only catch errors
 * thrown during render/lifecycle: anything thrown while modules are still
 * evaluating happens before React exists, so config checks belong in App, not
 * at module scope.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Moneta crashed while rendering', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <FatalErrorScreen error={this.state.error} />;
    }

    return this.props.children;
  }
}
