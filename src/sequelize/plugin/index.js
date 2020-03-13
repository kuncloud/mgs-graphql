// @flow
const singularQueryPlugin = require('./singularQueryPlugin')
const pluralQueryPlugin = require('./pluralQueryPlugin')

const addMutationPlugin = require('./addMutationPlugin')
const deleteMutationPlugin = require('./deleteMutationPlugin')
const updateMutationPlugin = require('./updateMutationPlugin')

const hasManyLinkedFieldPlugin = require('./hasManyLinkedFieldPlugin')
const hasOneLinkedFieldPlugin = require('./hasOneLinkedFieldPlugin')

module.exports = {
  singularQueryPlugin: singularQueryPlugin,
  pluralQueryPlugin: pluralQueryPlugin,

  addMutationPlugin: addMutationPlugin,
  deleteMutationPlugin: deleteMutationPlugin,
  updateMutationPlugin: updateMutationPlugin,

  hasManyLinkedFieldPlugin: hasManyLinkedFieldPlugin,
  hasOneLinkedFieldPlugin: hasOneLinkedFieldPlugin

}
