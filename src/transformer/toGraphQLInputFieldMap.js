// @flow

const _ = require('lodash')

const graphql = require('graphql')

const Type = require('../type')
const StringHelper = require('../utils/StringHelper')
const RemoteSchema = require('../definition/RemoteSchema')

const convert = (name, path, field) => {
  if (graphql.isInputType(field)) {
    return {type: field}
  }
  if (field instanceof Type.ScalarFieldType) {
    return {type: field.graphQLInputType}
  }

  if (graphql.isCompositeType(field)) {
    // invariant(false, 'unsupported type:isCompositeType' + typeof field)
    return
  }
  const typeName = (name, path) => {
    return name + path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(v => StringHelper.toInitialUpperCase(v)).join('')
  }

  const graphQLInputType = (name, config) => {
    name = StringHelper.toInitialUpperCase(name)

    if (config['$type']) {
      const result = convert(name, '', config)
      if (result && result.type) {
        return result.type
      } else {
        // return null
      }
    } else {
      const fields = toGraphQLInputFieldMap(name, config)
      if (_.keys(fields).length === 0) {
        // return null
      }
      return new graphql.GraphQLInputObjectType({
        name: name + 'Input',
        fields: fields
      })
    }
  }

  switch (field) {
    case String:
      return {type: graphql.GraphQLString}
    case Number:
      return {type: graphql.GraphQLFloat}
    case Boolean:
      return {type: graphql.GraphQLBoolean}
    case Date:
      return {type: Type.GraphQLScalarTypes.Date}
    case JSON:
      return {type: Type.GraphQLScalarTypes.Json}
  }

  if (_.isArray(field)) {
    const subField = convert(name, path, field[0])
    if (!subField) return

    subField.type = new graphql.GraphQLList(subField.type)

    return subField
  }

  if (typeof field === 'string') {
    if (field.endsWith('Id')) {
      return {
        type: Type.GraphQLScalarTypes.globalIdInputType(field.substr(0, field.length - 'Id'.length))
      }
    }
    return {
      type: Type.GraphQLScalarTypes.globalIdInputType(field)
    }
  }

  if (field instanceof RemoteSchema) {
    if (field.name.endsWith('Id')) {
      return {
        type: Type.GraphQLScalarTypes.globalIdInputType(field.name.substr(0, field.name.length - 'Id'.length))
      }
    } else {
      return {
        type: Type.GraphQLScalarTypes.globalIdInputType(field.name)
      }
    }
  }

  if (field instanceof Object) {
    if (field['$type']) {
      let result
      if (field['enumValues']) {
        const values = {}
        field['enumValues'].forEach(
          t => {
            values[t] = {value: t}
          }
        )
        result = {
          type: new graphql.GraphQLEnumType({
            name: typeName(name, path),
            values: values
          })
        }
      } else {
        result = convert(name, path, field['$type'])
      }
      if (result) {
        result.description = field['description']
        if (field['default'] != null && !_.isFunction(field['default'])) {
          result.defaultValue = field['default']
          result.description = (result.description ? result.description : '') + ' 默认值:' + result.defaultValue
        }
      }
      return result
    } else {
      const inputType = graphQLInputType(typeName(name, path), field)
      if (inputType) {
        return {type: inputType}
      } else {

      }
    }
  }
}

const toGraphQLInputFieldMap = function (name, fields) {
  const fieldMap = {}

  _.forOwn(fields, (value, key) => {
    if (value['$type'] && (value['hidden'] || value['resolve'])) {
      // Hidden field, ignore
      // Have resolve method, ignore
    } else {
      const inputField = convert(name, key, value)
      if (inputField) {
        if (value['$type'] && value['required']) {
          fieldMap[key] = inputField
          if (fieldMap[key] && !(inputField.type instanceof graphql.GraphQLNonNull)) {
            fieldMap[key].type = new graphql.GraphQLNonNull(inputField.type)
          }
        } else {
          fieldMap[key] = inputField
        }

        // if(value['_suportJsonCondition'] === true){
        //   console.log('dd',name,key)
        //   const cond = new graphql.GraphQLObjectType({
        //     name:   name+'JsonCondition',
        //     fields: {
        //       condition: { type: graphql.GraphQLBoolean},
        //     }
        //   })
        //   fieldMap[key].type = new graphql.GraphQLUnionType({
        //     name: name+'Json',
        //     types: [fieldMap[key].type,cond ],
        //     description: 'test'
        //   })
        // }
      }
    }
  })
  return fieldMap
}

module.exports = {
  toGraphQLInputFieldMap,
  convert
}
// export default toGraphQLInputFieldMap
