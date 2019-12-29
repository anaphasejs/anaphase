import { ApolloProvider } from "@apollo/react-hooks";
import * as Sentry from "@sentry/browser";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { ApolloAppContext } from "next-with-apollo";
import App, { AppContext, AppInitialProps } from "next/app";
import React, { createContext, useContext } from "react";
import ErrorBoundary from "./ErrorBoundary";
import NProgressContainer from "./NProgressContainer";
import { withApollo } from "./withApollo";

interface Props<U> extends AppInitialProps {
  apollo: ApolloClient<NormalizedCacheObject>;
  currentUser: U | null;
}

interface Args<U> {
  sentryDSN: string;
  fetchUser: (args: {
    apollo: ApolloClient<NormalizedCacheObject>;
  }) => Promise<U | null>;
}

interface Anaphase<U> {
  App: React.Component;
  useUser: () => U | null;
}

export default function initAnaphase<U>({
  sentryDSN,
  fetchUser
}: Args<U>): Anaphase<U> {
  Sentry.init({
    dsn: sentryDSN
  });

  const UserContext = createContext<U | null>(null);

  class AnaphaseApp extends App<Props<U>> {
    static async getInitialProps({
      Component,
      ctx
    }: AppContext): Promise<Omit<Props<U>, "apollo">> {
      let pageProps = {};
      if (Component.getInitialProps) {
        pageProps = await Component.getInitialProps(ctx);
      }
      return {
        pageProps,
        currentUser: await fetchUser({
          apollo: (ctx as ApolloAppContext<NormalizedCacheObject>).apolloClient
        })
      };
    }

    render(): JSX.Element {
      const { Component, pageProps, apollo, currentUser } = this.props;
      return (
        <ErrorBoundary fullPage={true}>
          <ApolloProvider client={apollo}>
            <UserContext.Provider value={currentUser}>
              <Component {...pageProps} />
            </UserContext.Provider>
          </ApolloProvider>
          <NProgressContainer />
        </ErrorBoundary>
      );
    }
  }

  return {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    App: withApollo(AnaphaseApp),
    useUser: (): U | null => useContext(UserContext)
  };
}
