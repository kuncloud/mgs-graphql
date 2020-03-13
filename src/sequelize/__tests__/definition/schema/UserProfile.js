// @flow
const SG = require('../../../../')

const UserType = 'User'
module.exports = SG.schema('UserProfile', {}).fields({
  owner: {
    $type: UserType,
    required: true
  },
  realName: String,
  age: SG.ScalarFieldTypes.Int,
  gender: {
    $type: String,
    enumValues: ['Male', 'Female']
  }
})
