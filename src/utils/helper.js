import _ from 'lodash'

import StringHelper from './StringHelper'

export const validateType = (value, type = 'string') => {
  if (type === 'string') { return (typeof value === 'string' || (value && typeof value.$type === 'string')) }
  return (value instanceof type || (value && value.$type instanceof type))
}
export function formatLinkId (key:string):string {
  return StringHelper.toInitialLowerCase(key) + 'Id'
}
export function pluralQueryName (schemaName: string): string {
  return StringHelper.toInitialLowerCase(schemaName) + 's'
}
export function contactPath (...values) {
  return _.reduce(values, (path, v) => {
    return path + '_' + v
  })
}
export function calcRemoteLevels (description: string): number {
  if (_.isEmpty(description)) { return 0 }

  let level = 0
  let start = 0
  const len = '__'.length
  while (description.substr(start, len) === '__') {
    level++
    start += len
  }

  return level
}
