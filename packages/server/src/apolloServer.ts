import { ApolloServer, ApolloServerExpressConfig } from "apollo-server-express";
import { GraphQLFormattedError } from "graphql";
import gql from "graphql-tag";
import {
  IResolvers,
  ITypeDefinitions,
  makeExecutableSchema
} from "graphql-tools";
import GraphQLJSON from "graphql-type-json";
import GraphQLUUID from "graphql-type-uuid";
import { logger } from "./logger";

export interface ApolloOptions
  extends Pick<ApolloServerExpressConfig, "context"> {
  typeDefs: ITypeDefinitions;
  resolvers: IResolvers<any, any>;
}

export const buildApolloServer = async ({
  typeDefs,
  resolvers,
  context
}: ApolloOptions): Promise<ApolloServer> => {
  const schema = makeExecutableSchema({
    typeDefs: gql`
      scalar JSON
      scalar UUID
      ${typeDefs}
    `,
    resolvers
  });

  const server = new ApolloServer({
    schema,
    introspection: true,
    context,
    formatError: (err): GraphQLFormattedError => {
      logger.error("Apollo resolver error", err);
      return err;
    },
    tracing: true,
    resolvers: {
      JSON: GraphQLJSON,
      UUID: GraphQLUUID
    }
  });

  return server;
};
