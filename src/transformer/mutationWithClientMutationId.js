// @flow

const {GraphQLNonNull, GraphQLString, GraphQLObjectType, GraphQLInputObjectType} = require('graphql')

module.exports = function mutationWithClientMutationId (config) {
  let {name, description, inputFields, outputFields, mutateAndGetPayload} = config

  inputFields.clientMutationId = {type: new GraphQLNonNull(GraphQLString)}
  outputFields.clientMutationId = { type: new GraphQLNonNull(GraphQLString) }

  let outputType = new GraphQLObjectType({
    name: name + 'Payload',
    fields: outputFields
  })

  let inputType = new GraphQLInputObjectType({
    name: name + 'Input',
    fields: inputFields
  })

  return {
    type: outputType,
    description: description,
    args: {
      input: {type: new GraphQLNonNull(inputType)}
    },
    resolve: function resolve (_, _ref, context, info) {
      let input = _ref['input']
      return Promise.resolve(mutateAndGetPayload(input, context, info)).then(
        function (payload) {
          payload.clientMutationId = input.clientMutationId
          return payload
        })
    }
  }
}
