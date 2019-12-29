import Router from "next/router";
import NProgress, { NProgressOptions } from "nprogress";
import React from "react";
import {
  createGlobalStyle,
  css,
  FlattenSimpleInterpolation
} from "styled-components";

const NProgressStyles = createGlobalStyle<{
  color?: string;
  spinner?: boolean;
}>`
${({ color, spinner }): FlattenSimpleInterpolation => {
  return css`
    #nprogress {
      pointer-events: none;
    }
    #nprogress .bar {
      background: ${color};
      position: fixed;
      z-index: 1031;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
    }
    #nprogress .peg {
      display: block;
      position: absolute;
      right: 0px;
      width: 100px;
      height: 100%;
      box-shadow: 0 0 10px ${color}, 0 0 5px ${color};
      opacity: 1;
      -webkit-transform: rotate(3deg) translate(0px, -4px);
      -ms-transform: rotate(3deg) translate(0px, -4px);
      transform: rotate(3deg) translate(0px, -4px);
    }
    #nprogress .spinner {
      display: ${spinner ? "block" : "none"};
      position: fixed;
      z-index: 1031;
      top: 15px;
      right: 15px;
    }
    #nprogress .spinner-icon {
      width: 18px;
      height: 18px;
      box-sizing: border-box;
      border: solid 2px transparent;
      border-top-color: ${color};
      border-left-color: ${color};
      border-radius: 50%;
      -webkit-animation: nprogresss-spinner 400ms linear infinite;
      animation: nprogress-spinner 400ms linear infinite;
    }
    .nprogress-custom-parent {
      overflow: hidden;
      position: relative;
    }
    .nprogress-custom-parent #nprogress .spinner,
    .nprogress-custom-parent #nprogress .bar {
      position: absolute;
    }
    @-webkit-keyframes nprogress-spinner {
      0% {
        -webkit-transform: rotate(0deg);
      }
      100% {
        -webkit-transform: rotate(360deg);
      }
    }
    @keyframes nprogress-spinner {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
}}
`;

interface Props {
  color?: string;
  showAfterMs?: number;
  spinner?: boolean;
  options?: NProgressOptions;
}

class NProgressContainer extends React.Component<Props> {
  static defaultProps = {
    color: "#2299DD",
    showAfterMs: 0,
    spinner: true
  };

  timer: number | null = null;

  routeChangeStart = (): void => {
    const { showAfterMs } = this.props;
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(NProgress.start, showAfterMs);
  };

  routeChangeEnd = (): void => {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    NProgress.done();
  };

  componentDidMount(): void {
    const { options } = this.props;

    if (options) {
      NProgress.configure(options);
    }

    Router.events.on("routeChangeStart", this.routeChangeStart);
    Router.events.on("routeChangeComplete", this.routeChangeEnd);
    Router.events.on("routeChangeError", this.routeChangeEnd);
  }

  componentWillUnmount(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    Router.events.off("routeChangeStart", this.routeChangeStart);
    Router.events.off("routeChangeComplete", this.routeChangeEnd);
    Router.events.off("routeChangeError", this.routeChangeEnd);
  }

  render(): React.ReactElement {
    const { color, spinner } = this.props;
    return <NProgressStyles color={color} spinner={spinner} />;
  }
}

export default NProgressContainer;