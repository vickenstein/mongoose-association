require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')

const ProfileSchema = new mongoose.Schema()
ProfileSchema.belongsTo('User')
const Profile = mongoose.model('Profile', ProfileSchema)

const SettingSchema = new mongoose.Schema()
SettingSchema.belongsTo('User', {
  localField: 'controller',
  foreignKey: 'controller_id'
})
const Setting = mongoose.model('Setting', SettingSchema)

const UserSchema = new mongoose.Schema()
UserSchema.hasOne('Profile')
UserSchema.hasOne('Setting', {
  localField: 'controls',
  foreignKey: 'controller_id'
})
const User = mongoose.model('User', UserSchema)

describe("assign association class", () => {

  describe("#hasOne", () => {
    it('', async () => {
      const user = await new User().save()
      const profile = await new Profile({
        user: user
      }).save()
      const setting = await new Setting({
        controller: user
      }).save()
      const userProfile = await user.profile
      assert.strictEqual(userProfile._id.toString(), profile._id.toString())
      const userControls = await user.controls
      assert.strictEqual(userControls._id.toString(), setting._id.toString())
    })
  })
})
