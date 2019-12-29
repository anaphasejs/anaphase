import * as Sentry from "@sentry/browser";
import { Button } from "antd";
import Head from "next/head";
import React, { Component, ErrorInfo, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  fullPage?: boolean;
}>;

interface State {
  eventId: string | null;
  hasError?: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { eventId: null };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Sentry.withScope(scope => {
      scope.setExtras(errorInfo);
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const fallbackUI = (
        <>
          <h2>Something went wrong!</h2>
          <p>
            Our engineers have been notified. If you would like to report what
            you were doing when this error showed up, it would help up fix
            things faster!
          </p>
          <Button
            type="primary"
            onClick={(): void =>
              Sentry.showReportDialog({
                eventId: this.state.eventId || "unknown"
              })
            }
          >
            Report feedback
          </Button>
        </>
      );
      if (this.props.fullPage) {
        return (
          <div>
            <Head>
              <title>Error loading page</title>
            </Head>
            <div>{fallbackUI}</div>
          </div>
        );
      }
      return fallbackUI;
    }

    //when there's not an error, render children untouched
    return this.props.children;
  }
}

export default ErrorBoundary;
