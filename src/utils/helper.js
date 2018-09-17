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
