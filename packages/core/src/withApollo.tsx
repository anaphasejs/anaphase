import { createApolloClient } from "@anaphasejs/create-apollo-client";
import * as Sentry from "@sentry/browser";
import nextWithApollo from "next-with-apollo";
import { NormalizedCacheObject } from "apollo-cache-inmemory";

export const withApollo = nextWithApollo<NormalizedCacheObject>(
  ({ headers, initialState }) => {
    return createApolloClient({
      initialState: initialState || {},
      graphQLEndpoint: `${
        typeof window === "undefined"
          ? `http://localhost:${process.env.PORT || 3000}`
          : window.location.origin
      }/api/v1/graphql`,
      headers: (headers || {}) as { [key: string]: string },
      onGraphQLError: gqlError => {
        const { message, locations, path } = gqlError;
        Sentry.captureException(gqlError);
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
      },
      onNetworkError: networkError => {
        Sentry.captureException(networkError);
        console.error(`[Network error]: ${networkError}`);
      }
    });
  }
);
