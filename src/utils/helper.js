const _ = require('lodash')

const StringHelper = require('./StringHelper')

const validateType = (value, type = 'string') => {
  if (type === 'string') { return (typeof value === 'string' || (value && typeof value.$type === 'string')) }
  return (value instanceof type || (value && value.$type instanceof type))
}
function formatLinkId (key) {
  return StringHelper.toInitialLowerCase(key) + 'Id'
}
function pluralQueryName (schemaName) {
  return StringHelper.toInitialLowerCase(schemaName) + 's'
}
function contactPath (...values) {
  return _.reduce(values, (path, v) => {
    return path + '_' + v
  })
}
function calcRemoteLevels (description) {
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

module.exports = {
  validateType,
  formatLinkId,
  pluralQueryName,
  contactPath,
  calcRemoteLevels
}
