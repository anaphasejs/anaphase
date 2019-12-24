import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink, split } from "apollo-link";
import { setContext } from "apollo-link-context";
import { onError } from "apollo-link-error";
import { HttpLink } from "apollo-link-http";
import { ServerError, ServerParseError } from "apollo-link-http-common";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { GraphQLError } from "graphql";
import fetch from "isomorphic-unfetch";

/**
 * Creates and configures the ApolloClient
 * @param  {Object} [initialState={}]
 */
export function createApolloClient({
  graphQLEndpoint,
  onGraphQLError,
  onNetworkError,
  initialState,
  headers
}: {
  graphQLEndpoint: string;
  onGraphQLError?: (err: GraphQLError) => void;
  onNetworkError?: (err: Error | ServerError | ServerParseError) => void;
  initialState: any;
  headers: { [key: string]: string };
}): ApolloClient<NormalizedCacheObject> {
  // Create a WebSocket link:
  const httpLink = new HttpLink({
    uri: graphQLEndpoint, // Server URL (must be absolute)
    credentials: "same-origin", // Additional fetch() options like `credentials` or `headers`
    fetch
  });

  let link: ApolloLink = httpLink;

  //No subscriptions yet
  if (typeof window !== "undefined") {
    const wsLink = new WebSocketLink({
      uri: graphQLEndpoint.replace(
        /(^\w+:|^)\/\//,
        graphQLEndpoint.startsWith("https") ? "wss://" : "ws://"
      ),
      options: {
        reconnect: true,
        timeout: 20000
      }
    });

    link = split(
      // split based on operation type
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription" &&
          typeof window !== "undefined"
        );
      },
      wsLink,
      httpLink
    );
  }

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (onGraphQLError) {
      if (graphQLErrors)
        graphQLErrors.forEach(gqlError => {
          onGraphQLError(gqlError);
        });
    }
    if (networkError && onNetworkError) {
      onNetworkError(networkError);
    }
  });

  const authLink = setContext((_request, { headers: _headers }) => {
    return {
      headers: {
        ..._headers,
        ...headers
      }
    };
  });

  // Check out https://github.com/zeit/next.js/pull/4611 if you want to use the AWSAppSyncClient
  return new ApolloClient({
    ssrMode: typeof window === "undefined", // Disables forceFetch on the server (so queries are only run once)
    link: authLink.concat(errorLink).concat(link),
    cache: new InMemoryCache().restore(initialState)
  });
}
