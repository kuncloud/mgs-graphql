// @flow
import {isOutputType, GraphQLNonNull, GraphQLSchema,GraphQLUnionType, GraphQLInterfaceType,GraphQLObjectType, GraphQLList} from 'graphql'
import _ from 'lodash'
import {
  mergeSchemas
} from 'graphql-tools'
import type {GraphQLField, GraphQLNamedType} from 'graphql'
import type {IResolversParameter} from 'graphql-tools'
import {
  SchemaVisitor,
  visitSchema,
  healSchema
} from 'graphql-tools/dist/schemaVisitor'
import type{VisitableSchemaType} from 'graphql-tools/dist/schemaVisitor'
import invariant from '../utils/invariant'
let otherTypes:{
  [key:string]:{
    [key:string]:GraphQLObjectType
  }
} = []
class SchemaRemoteVisitor extends SchemaVisitor {
  static visitTheSchema (schema: GraphQLSchema,
                        context: {
                          [key: string]: any
                        } = Object.create(null)): GraphQLSchema {
    function visitorSelector (type: VisitableSchemaType,
                             methodName: string): Array<SchemaRemoteVisitor> {
      const visitors = []
      if (methodName !== 'visitFieldDefinition') { return visitors }

      const isStub = (type:VisitableSchemaType) => {
        return (type instanceof GraphQLObjectType) &&
          type.name.startsWith(context.prefix) &&
          !_.isEmpty(type.description) &&
          type.description.startsWith('{') &&
          type.description.endsWith('}')
      }
      let remoteType = null
      let visitedType = null
      if (type.type instanceof GraphQLList) {
        const element = type.type.ofType
        if (isStub(element)) {
          visitedType = type
          remoteType = element
        }
      } else if (type.type instanceof GraphQLNonNull) {
        if (isStub(type.type.ofType)) {
          visitedType = type
          remoteType = type.type.ofType
        }
      } else if (isStub(type.type)) {
        visitedType = type
        remoteType = type.type
      }

      if (remoteType != null && visitedType != null) {
        try {
          const info = JSON.parse(remoteType.description)
          if (!_.isEmpty(info)) {
            console.log(`visitorSelector got it:${visitedType.name},${remoteType.name},${methodName}:`, remoteType.description)
            visitors.push(new RemoteDirective({
              name: 'remote',
              args: {...info},
              visitedType: visitedType,
              schema,
              context
            }))
            return visitors
          }
        } catch (err) {
          console.warn('visitorSelector:', err)
        }
      }

      return visitors
    }

    visitSchema(schema, visitorSelector)

    healSchema(schema)

    return schema
  }

  constructor (config: {
    name: string,
    args: {[name: string]: any},
    visitedType: VisitableSchemaType,
    schema: GraphQLSchema,
    context: {[key: string]: any}
  }) {
    super()
    this.name = config.name
    this.args = config.args
    this.visitedType = config.visitedType
    this.schema = config.schema
    this.context = config.context
  }
}

class RemoteDirective extends SchemaRemoteVisitor {
  visitFieldDefinition (field: GraphQLField<any, any>) {
    invariant(!_.isEmpty(this.args), 'Must provide args')
    const getTargetSchema = (modeName: string, srcSchemas: {[key:string]:GraphQLSchema}): ?{schemaName:string,obj:GraphQLNamedType} => {
      if (_.isEmpty(srcSchemas)) { return }

      let found = undefined
      _.forOwn(srcSchemas,(target,key) => {
        if (target && target.getType(modeName)) {
          found = {
            obj:target.getType(modeName),
            schemaName:key
          }

          return false
        }
      })

      return found
    }

    const addMergedObject = (schemaName:string,obj:GraphQLNamedType) => {
      if(obj instanceof GraphQLList){
        addMergedObject(schemaName,obj.ofType)
      }else if(obj instanceof GraphQLNonNull){
        addMergedObject(schemaName,obj.ofType)
      }else if(obj instanceof GraphQLObjectType || obj instanceof GraphQLInterfaceType){
        // console.log('addObj:',schemaName,obj.name)
        if(!otherTypes[schemaName][obj.name]){
          otherTypes[schemaName][obj.name] = obj
          const fields = obj.getFields()
          _.forOwn(fields,(value,key)=>{
            addMergedObject(schemaName,value.type)
          })
        }
      }else if( obj instanceof  GraphQLUnionType ){
        const types = obj.getTypes()
        for(i=0;i<types.length;++i){
          addMergedObject(types[i])
        }
      }else {

      }

    }

    const gqlObj = getTargetSchema(this.args.target, this.context.srcSchema)
    invariant(!gqlObj || isOutputType(gqlObj.obj), `invalid remote link ${field.name} => ${this.args.target}: not output type(maybe null)`)
    if (gqlObj && gqlObj.obj) {
      // console.log('match:',gqlObj.schemaName,gqlObj.obj.name)
      addMergedObject(gqlObj.schemaName, gqlObj.obj)

      invariant(otherTypes[gqlObj.schemaName][gqlObj.obj.name] == gqlObj.obj,`Must same output graphql object:${gqlObj.obj.name}`)

      if (field.type instanceof GraphQLList) {
        field.type = new GraphQLList(gqlObj.obj)
      } else {
        field.type = gqlObj.obj
      }
    }
  }
}

function mergeAllSchemas (schema: GraphQLSchema, schemaMerged: {[key:string]:GraphQLSchema}, resolvers: IResolversParameter, prefix: string): GraphQLSchema {
  if (_.isEmpty(schemaMerged)) { return schema }
  otherTypes = _.mapValues(schemaMerged,(value)=>{
    return {}
  })
  // console.log('begin:',otherTypes)
  SchemaRemoteVisitor.visitTheSchema(schema, {
    prefix,
    srcSchema: schemaMerged
  })
  // console.log('other types:')
  _.forOwn(otherTypes,(value,key)=>{
    console.log(key,value)
    if(_.isEmpty(value))
      throw new Error(`merged schema ${key}:none of schema is merging`)
  })

  let objMap = {}
  _.forOwn(otherTypes,(objs,schemaName)=>{
    _.forOwn(objs,(obj,name)=>{
      objMap[name] = obj
    })
  })

  return mergeSchemas({schemas: [schema, (_.map(objMap,(value)=>value)) ], resolvers})
}

module.exports = {
  mergeAllSchemas
}
