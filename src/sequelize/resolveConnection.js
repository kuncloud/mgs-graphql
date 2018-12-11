// @flow
import Sequelize from 'sequelize'
import { GraphQLID } from 'graphql'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
export default async function resolveConnection (dbModel:Sequelize.Model, args:{
  after?: GraphQLID,
  first?: number,
  before?: GraphQLID,
  last?: number,
  include?:Array<any>,
  condition?:any,
  group?: any,
  sort?: Array<{field: string, order: "ASC"|"DESC"}>
}):Promise<{
  pageInfo: {
    startCursor:GraphQLID,
    endCursor:GraphQLID,
    hasPreviousPage: boolean,
    hasNextPage: boolean
  },
  edges: Array<{
    node:any,
    cursor:GraphQLID
  }>,
  count: number
}> {
  let {after, first = 100, before, last, group, include = [], condition = {}, sort = [{
    field: 'id',
    order: 'ASC'
  }]} = args
  if (after) after = fromGlobalId(after).id
  if (before) before = fromGlobalId(before).id
  let reverse = false
  const count = await dbModel.count({
    include: include,
    where: condition
  })
  if (last || before) {
    reverse = true
    first = last || 100
    before = before || (count + 1)
    after = count - (parseInt(before) - 1)
    sort = sort.map(s => {
      return {
        field: s.field,
        order: (s.order === 'ASC' ? 'DESC' : 'ASC')
      }
    })
  }
  const offset = Math.max(after != null ? parseInt(after) : 0, 0)

  let sequelizeOptions = {
    include: include,
    where: condition,
    order: sort.map(s => [s.field, s.order]),
    limit: first,
    offset: offset
  }
  if (group) {
    sequelizeOptions = {
      ...sequelizeOptions,
      group
    }
  }

  const result = await dbModel.findAll(sequelizeOptions)
  // console.log('fr:',result)

  let index = 0
  let startCursor = offset + 1
  let endCursor = offset + result.length
  if (reverse) {
    startCursor = count - startCursor + 1
    endCursor = count - endCursor + 1
  }
  return {
    pageInfo: {
      startCursor: toGlobalId(dbModel.name, startCursor),
      endCursor: toGlobalId(dbModel.name, endCursor),
      hasPreviousPage: offset > 0,
      hasNextPage: offset + result.length < count
    },
    edges: reverse ? result.map(node => {
      return {
        node: node,
        cursor: toGlobalId(dbModel.name, count - (offset + (index++)))
      }
    }).reverse() : result.map(node => {
      return {
        node: node,
        cursor: toGlobalId(dbModel.name, offset + (++index))
      }
    }),
    count: count
  }
}
