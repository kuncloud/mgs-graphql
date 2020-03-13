/**
 * Created by yuyanq on 2018/9/13.
 */
const _ = require('lodash')
const graphql = require('graphql')
const RemoteSchema = require('../definition/RemoteSchema')
const helper = require('../utils/helper')
const invariant = require('../utils/invariant')
const relay = require('graphql-relay')

const _deadTimeLine = 3 * 60 * 1000 // 3 minute
const _numberOneSession = 20 // 每次清理的个数
const _mergeNQueryBulk = {}
function cleanNQuery () {
  let counter = 0
  const now = Date.now()
  for (const qid in _mergeNQueryBulk) {
    // const oneSession = _mergeNQueryBulk[qid]
    if (_mergeNQueryBulk[qid].createTime && (now - _mergeNQueryBulk[qid].createTime > _deadTimeLine)) {
      // console.log('cleanNQuery', now, _mergeNQueryBulk[qid].createTime)
      delete _mergeNQueryBulk[qid]
      counter++
      if (counter >= _numberOneSession) { break }
    }
  }
}

async function mergeNQuery (qid, edges, schema, getTargetBinding, info, toDbId) {
  if (!edges || edges.length <= 1) {
    return
  }

  const findSelectionNode = (field, findName, isDeep) => {
    // console.log('findSelectionNode field:', findName, graphql.print(field))
    if (!field) { return null }

    if (field.name && field.name.value === findName) { return field }

    const selections = field.selectionSet && field.selectionSet.selections
    if (isDeep && selections) {
      for (let i = 0; i < selections.length; ++i) {
        const node = findSelectionNode(selections[i], findName, isDeep)
        if (node) { return node }
      }
    }

    return null
  }

  // console.log('mergeNQuery', qid, schema.name, graphql.responsePathAsArray(info.path), edges, _mergeNQueryBulk)
  const path = helper.contactPath(graphql.responsePathAsArray(info.path), 'edges', 'node') // 有点写死了
  let node = null
  // 处理Remote字段，生成N次查询的合并查询函数
  const fieldsCfg = schema.config.fields
  for (const key in fieldsCfg) {
    if (!fieldsCfg.hasOwnProperty(key)) { continue }
    const value = fieldsCfg[key]
    if (!value || !(value.$type instanceof RemoteSchema)) continue

    if (!node) { // lazy fetch node
      const findNode = (info) => {
        const {fieldNodes = []} = info
        const nodeName = 'node'
        let node = null
        for (let i = 0; i < fieldNodes.length; ++i) {
          node = findSelectionNode(fieldNodes[i], nodeName, true)
          if (node) { break }
        }
        if (!node) {
          // console.log(`${schema.name} plural query cant find node selection`)
        }
        return node
      }
      node = findNode(info)
      if (!node) {
        return
      }
    }

    // console.log('mergeNQuery:createNQuery',key,value)
    const createMergeNQuery = async(key, value) => {
      const linkId = helper.formatLinkId(key)
      invariant(linkId, `schema ${schema.name}: ${linkId} is null`)
      const targetModelName = value['$type'].name
      const apiName = helper.pluralQueryName(targetModelName)
      const currPath = helper.contactPath(path, key)
      const binding = getTargetBinding(targetModelName)
      invariant(binding, `${targetModelName} remote binding not exist`)
      if (!binding) {
        // throw new Error(`${targetModelName} remote binding not exist`)
        return
      }

      const findCurrNodeOnlyInSub = (parent, key) => {
        let curr = null
        const selections = parent.selectionSet && parent.selectionSet.selections
        if (selections) {
          for (let i = 0; i < selections.length; ++i) {
            curr = findSelectionNode(selections[i], key, false)
            if (curr) { return curr }
          }
        }
        return curr
      }
      let currNode = findCurrNodeOnlyInSub(node, key)
      if (!currNode) {
        // console.warn('mergeNQuery:cant find curr node', key)
        return
      }
      const id = 'id'
      const isIncludeId = findCurrNodeOnlyInSub(currNode, id)
      const currSelection = graphql.print(currNode)
      currNode = _.trimStart(currSelection, key)
      const firstBrace = currNode.indexOf('{')
      if (firstBrace < 0) {
        throw new Error('Invalid selection:', currNode)
      }
      if (!isIncludeId) { currNode = currNode.replace('{', `{ ${id}`) }
      invariant(!_.isEmpty(currNode), `${schema.name} plural query cant find selection set in ${currSelection}`)

      cleanNQuery()
      if (!_mergeNQueryBulk[qid]) {
        _mergeNQueryBulk[qid] = {createTime: Date.now()}
      }

      _mergeNQueryBulk[qid][currPath] = {}
      const queryContext = _mergeNQueryBulk[qid][currPath]
      // 找到所有sub id
      // const subIds = _.map(edges, (v) => v.node[linkId])
      const uniqueIds = (edges) => {
        let ids = new Set()
        edges.forEach(x => {
          const v = x.node[linkId]
          // console.log('linkId:',linkId,v,typeof v)
          const type = typeof v
          if (type === 'object') {
            if (!_.isEmpty(v)) {
              ids.add(v)
            }
          } else {
            ids.add(v)
          }
        })
        return [...ids]
      }
      const subIds = uniqueIds(edges)
      if (binding.query[`get${targetModelName}sByIds`]) {
        const res = await binding.query[`get${targetModelName}sByIds`]({ids: subIds.map(subId => relay.toGlobalId(targetModelName, subId))}, currNode)
        for (let node of res) {
          queryContext[+toDbId(targetModelName, node.id)] = node
        }
      } else {
        const selection = `{
            edges{
              node ${currNode}
            }
          }`
        const res = await binding.query[apiName]({options: {where: {id: {in: subIds}}}}, selection)
        const nodeArr = res && res.edges
        const length = nodeArr && nodeArr.length
        for (let i = 0; i < length; ++i) {
          const node = nodeArr[i].node
          queryContext[+toDbId(targetModelName, node.id)] = node
        }
      }

      queryContext.fn = (targetName, id, qContext) => {
        id = toDbId(targetName, id)
        try {
          id = parseInt(id)
        } catch (err) {
          console.error(err.message)
          return
        }

        // console.log('mergeNQuery:queryContext.fn:', id, qContext)
        invariant(_.includes(subIds, id), `schema ${schema.name}'s remote ${targetName} query ${apiName}: id(${id}) must be included in ${subIds} `)

        const res = qContext[id]
        // delete qContext[id]
        // if (Object.keys(qContext).length === 1) {
        //   invariant(qContext.hasOwnProperty('fn'), 'invalid queryContext', qContext)
        //   delete qContext['fn']
        // }

        return res
      }
    }
    await createMergeNQuery(key, value)
  }
}

module.exports = {
  mergeNQueryBulk: _mergeNQueryBulk,
  mergeNQuery
}
