import { ApolloProvider } from "@apollo/react-hooks";
import * as Sentry from "@sentry/browser";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { ApolloAppContext } from "next-with-apollo";
import { AppContext, AppInitialProps } from "next/app";
import React, { createContext, PropsWithChildren, useContext } from "react";
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

type AppWrapperProps<U> = PropsWithChildren<{
  currentUser: U | null;
  apollo: ApolloClient<NormalizedCacheObject>;
}>;

interface Anaphase<U> {
  AppWrapper: React.FC<AppWrapperProps<U>>;
  getInitialProps: (ctx: AppContext) => Promise<Omit<Props<U>, "apollo">>;
  withApollo: any;
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

  const getInitialProps = async ({
    Component,
    ctx
  }: AppContext): Promise<Omit<Props<U>, "apollo">> => {
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
  };

  const AppWrapper: React.FC<AppWrapperProps<U>> = ({
    currentUser,
    apollo,
    children
  }: AppWrapperProps<U>) => {
    return (
      <ErrorBoundary fullPage={true}>
        <ApolloProvider client={apollo}>
          <UserContext.Provider value={currentUser}>
            {children}
          </UserContext.Provider>
        </ApolloProvider>
        <NProgressContainer />
      </ErrorBoundary>
    );
  };

  return {
    AppWrapper,
    getInitialProps,
    withApollo,
    useUser: (): U | null => useContext(UserContext)
  };
}
