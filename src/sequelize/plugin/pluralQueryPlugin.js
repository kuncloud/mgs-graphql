// @flow
import * as _ from 'lodash'
import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import Sequelize from 'sequelize'
import Schema from '../../definition/Schema'
import RemoteSchema from '../../definition/RemoteSchema'
import Type from '../../type'
import StringHelper from '../../utils/StringHelper'
import resolveConnection from '../resolveConnection'
import Transformer from '../../transformer'
import * as helper from '../../utils/helper'
import {mergeNQuery} from '../mergeNQuery'
const Op = Sequelize.Op

const SortEnumType = new graphql.GraphQLEnumType({
  name: 'SortOrder',
  values: {
    ASC: {value: 'ASC', description: '递增排序'},
    DESC: {value: 'DESC', description: '递减排序'}
  }
})

const DateConditionType = new graphql.GraphQLInputObjectType({
  name: 'DateCondition' + 'Input',
  fields: {
    gte: {
      type: Type.GraphQLScalarTypes.Date,
      description: '大于或等于'
    },
    lte: {
      type: Type.GraphQLScalarTypes.Date,
      description: '小于或等于'
    },
    gt: {
      type: Type.GraphQLScalarTypes.Date,
      description: '大于'
    },
    lt: {
      type: Type.GraphQLScalarTypes.Date,
      description: '小于'
    },
    ne: {
      type: Type.GraphQLScalarTypes.Date,
      description: '不等于'
    },
    eq: {
      type: Type.GraphQLScalarTypes.Date,
      description: '等于'
    }
  }
})

const NumberConditionType = new graphql.GraphQLInputObjectType({
  name: 'NumberCondition' + 'Input',
  fields: {
    gte: {
      type: graphql.GraphQLFloat,
      description: '大于或等于'
    },
    lte: {
      type: graphql.GraphQLFloat,
      description: '小于或等于'
    },
    gt: {
      type: graphql.GraphQLFloat,
      description: '大于'
    },
    lt: {
      type: graphql.GraphQLFloat,
      description: '小于'
    },
    ne: {
      type: graphql.GraphQLFloat,
      description: '不等于'
    },
    eq: {
      type: graphql.GraphQLFloat,
      description: '等于'
    },
    in: {
      type: new graphql.GraphQLList(graphql.GraphQLFloat),
      description: '在里面'
    },
    notIn: {
      type: new graphql.GraphQLList(graphql.GraphQLFloat),
      description: '不在里面'
    }
  }
})

const StringConditionType = new graphql.GraphQLInputObjectType({
  name: 'StringCondition' + 'Input',
  fields: {
    gte: {
      type: graphql.GraphQLString,
      description: '大于或等于'
    },
    lte: {
      type: graphql.GraphQLString,
      description: '小于或等于'
    },
    gt: {
      type: graphql.GraphQLString,
      description: '大于'
    },
    lt: {
      type: graphql.GraphQLString,
      description: '小于'
    },
    ne: {
      type: graphql.GraphQLString,
      description: '不等于'
    },
    eq: {
      type: graphql.GraphQLString,
      description: '等于'
    },
    in: {
      type: new graphql.GraphQLList(graphql.GraphQLString),
      description: '在里面'
    },
    nin: {
      type: new graphql.GraphQLList(graphql.GraphQLString),
      description: '不在里面'
    }
  }
})

const _cvtKey = (key: string): any => {
  return (Op.hasOwnProperty(key)) ? Op[key] : key
}

export default function pluralQuery (schema: Schema<any>, options: any): void {
  const name = helper.pluralQueryName(schema.name)
  const searchFields = {}
  const conditionFieldKeys = []
  // 过滤不可搜索的field
  _.forOwn(schema.config.fields, (value, key) => {
    if (!value) {
      return
    }

    if (typeof value === 'string' || (typeof value.$type === 'string') || (value.$type instanceof RemoteSchema)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (!value['$type'] || (value['searchable'] !== false && value['hidden'] !== true && !value['resolve'])) {
      if (value['required']) {
        searchFields[key] = Object.assign({}, value, {required: false})
      } else {
        searchFields[key] = value
      }
      if (value['default'] != null) {
        searchFields[key] = Object.assign({}, searchFields[key], {default: null})
      }
      if (value['advancedSearchable']) {
        if (value['$type'] === Date) {
          conditionFieldKeys.push(key)
          searchFields[key] = Object.assign({}, searchFields[key], {$type: DateConditionType})
        } else if (value['$type'] === Number) {
          conditionFieldKeys.push(key)
          searchFields[key] = Object.assign({}, searchFields[key], {$type: NumberConditionType})
        } else if (value['$type'] === String) {
          conditionFieldKeys.push(key)
          searchFields[key] = Object.assign({}, searchFields[key], {$type: StringConditionType})
        }
      }
    }
  }
  )

  if (options && options.conditionArgs) {
    Object.assign(searchFields, (options.conditionArgs:any))
  }

  let config = {}
  if ((typeof options) === 'object') {
    config = options
  }

  const getType = (value) => {
    let type = value
    while (type['$type'] || _.isArray(type)) {
      if (type['$type']) {
        type = type['$type']
      } else if (_.isArray(type)) {
        type = type[0]
      }
    }
    return type
  }

  // 生产
  schema.queries({
    [name]: {
      config: config,
      $type: schema.name + 'Connection',
      args: {
        condition: {
          $type: _.mapValues(searchFields, (value) => {
            let type = getType(value)
            if (value['$type']) {
              type = Object.assign({}, value, {$type: type, required: false})
            }
            if (type === Date || type['$type'] === Date) {
              type = DateConditionType
            }
            return type
          }),
          // _suportJsonCondition:true,
          description: 'Query Condition'
        },
        options: {
          $type: {
            where: Type.GraphQLScalarTypes.Json,
            group: String
          },
          description: 'Sequelize.findAll(option)'
        },
        sort: {
          $type: [{field: String, order: SortEnumType}],
          description: 'Define the sort field'
        },
        keywords: {
          fields: {
            $type: [String],
            required: true
          },
          value: {
            $type: String,
            required: true
          }
        }
      },
      resolve: async function (args: {[argName: string]: any},
                               context: any,
                               info: graphql.GraphQLResolveInfo,
                               sgContext) {
        const dbModel = sgContext.models[schema.name]

        let {sort = [{field: 'id', order: 'ASC'}], condition = {}, options} = (args != null ? args : {})

        if (dbModel.options.underscored) {
          for (let item of sort) {
            item.field = StringHelper.toUnderscoredName(item.field)
          }
        }

        conditionFieldKeys.forEach(fieldKey => {
          if (condition[fieldKey]) {
            condition[fieldKey] = _.mapKeys(condition[fieldKey], function (value, key) {
              return _cvtKey(key)
            })
          }
        })

        // 转换GID为int
        const cvtGId = (key, src) => {
          if (_.isArray(src)) {
            return _.map(src, (v) => {
              return cvtGId(key, v)
            })
          } else if (typeof src === 'object' || src instanceof Object) {
            return _.mapValues(src, (v, k) => {
              if (Op.hasOwnProperty(k)) {
                return cvtGId(key, v)
              }
              return cvtGId(k, v)
            })
          } else if (typeof src === 'string') {
            if (key === 'id') {
              const {type, id} = relay.fromGlobalId(src)
              return (type === schema.name) ? id : src
            } else if (searchFields.hasOwnProperty(key)) {
              const inputField = Transformer.convert(key, key, searchFields[key])
              if (inputField && (inputField.type instanceof graphql.GraphQLScalarType && inputField.type.name.endsWith('Id'))) {
                const typeName = inputField.type.name.substr(0, inputField.type.name.length - 'Id'.length)
                const {type, id} = relay.fromGlobalId(src)
                return (type === typeName) ? id : src
              }
            }

            return src
          } else {
            return src
          }
        }

        // 替换成Sequelize的OP
        const replaceOp = (obj) => {
          if (!obj) {
            return obj
          }

          if (_.isArray(obj)) {
            return _.map(obj, (v) => {
              return replaceOp(v)
            })
          } else if (typeof obj === 'object' && !(obj instanceof Array)) {
            const res = {}
            _.forOwn(obj, (value, key) => {
              if (!searchFields.hasOwnProperty(key) && !Op.hasOwnProperty(key) && key !== 'id') {
                throw new Error(`Invalid field:${key} in schema ${schema.name},please check it`)
              }
              const finalKey = _cvtKey(key)
              res[finalKey] = replaceOp(value)
            })
            return res
          } else {
            return obj
          }
        }

        // 如果有option,透传查询条件
        if (options) {
          if (!_.isEmpty(options.where)) {
            const where = cvtGId('where', options.where)
            // console.log('dd', where)
            const cond = replaceOp(where)
            if (cond) {
              // console.log('dd',cond,cond[Op.or][0].id,cond[Op.or][1].id[Op.gt])
              if (!condition[Op.and]) {
                condition[Op.and] = []
              }
              condition[Op.and].push(cond)
            }
          }

          if (!_.isEmpty(options.group)) {
            args = {
              ...args,
              group: options.group
            }
          }
        }

        const include = []
        const includeFields = {}

        const associationType = (model, fieldName): ?string => {
          if (model.config.associations.hasOne[fieldName]) {
            return model.config.associations.hasOne[fieldName].target
          }
          if (model.config.associations.belongsTo[fieldName]) {
            return model.config.associations.belongsTo[fieldName].target
          }
          return null
        }

        // 处理Db关联的字段
        _.forOwn(schema.config.fields, (value, key) => {
          if (typeof value === 'string' || (value && typeof value.$type === 'string')) {
            if (typeof condition[key] !== 'undefined') {
              if (!includeFields[key]) {
                const type = associationType(schema, key)
                if (type) {
                  includeFields[key] = true
                  include.push({
                    model: sgContext.models[type],
                    as: key,
                    required: true
                  })
                } else {
                  throw new Error(`unknown associated model:${key} in ${schema.name}`)
                }
              }
              if (!condition[Op.and]) {
                condition[Op.and] = []
              }
              Object.keys(condition[key]).forEach(f => {
                if (dbModel.options.underscored) {
                  condition[Op.and].push(Sequelize.where(Sequelize.col(key + '.' + StringHelper.toUnderscoredName(f)), {[Op.and]: condition[key][f]}))
                } else {
                  condition[Op.and].push(Sequelize.where(Sequelize.col(key + '.' + f), {[Op.and]: condition[key][f]}))
                }
              })
              delete condition[key]
            }

            if (!key.endsWith('Id')) {
              key = key + 'Id'
            }
            if (typeof condition[key] !== 'undefined') {
              if (dbModel.options.underscored) {
                const underscoredKey = StringHelper.toUnderscoredName(key)
                if (underscoredKey !== key) {
                  condition[underscoredKey] = condition[key]
                  delete condition[key]
                }
              }
            }
          }
        })

        // keyword supported
        if (args && args.keywords) {
          const {fields, value} = args.keywords
          const keywordsCondition = []

          for (let field of fields) {
            if (field.indexOf('.') !== -1) {
              const fieldName = field.split('.')[0]
              const type = associationType(schema, fieldName)
              if (type) {
                if (!includeFields[fieldName]) {
                  includeFields[fieldName] = true
                  include.push({
                    model: sgContext.models[type],
                    as: fieldName,
                    required: false
                  })
                }
                let colFieldName = field
                if (dbModel.options.underscored) {
                  colFieldName = fieldName + StringHelper.toUnderscoredName(field.substr(field.indexOf('.')))
                }
                keywordsCondition.push(Sequelize.where(Sequelize.col(colFieldName), {[Op.like]: '%' + value + '%'}))
              } else {
                keywordsCondition.push({[field]: {[Op.like]: '%' + value + '%'}})
              }
            } else {
              keywordsCondition.push({[field]: {[Op.like]: '%' + value + '%'}})
            }
          }
          condition[Op.or] = keywordsCondition
        }

        let res = await resolveConnection(dbModel, {...args, condition, include})
        if (context.qid && res && res.edges && res.edges.length > 1) {
          await mergeNQuery(context.qid, res.edges, schema, sgContext.getTargetBinding, info, sgContext.bindings.toDbId)
        }

        // console.log('before:', res)
        return res
      }
    }
  })
}
