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
    it('create and fetch has one association model', async () => {
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

    it('', async () => {
      const user1 = await new User().save()
      const user2 = await new User().save()
      const profile1 = await new Profile({
        user: user1
      }).save()
      const setting1 = await new Setting({
        controller: user1
      }).save()
      const profile2 = await new Profile({
        user: user2
      }).save()
      const setting2 = await new Setting({
        controller: user2
      }).save()
      const users = await User.find().populateAssociation('profile', 'controls')
      let mongooseRequestCount = mongoose.requestCount
      let profile = await users[0].profile
      let controls = await users[0].controls
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
      const user = User.findOne().populateAssociation('profile', 'controls')
      mongooseRequestCount = mongoose.requestCount
      profile = await user.profile
      controls = await user.controls
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })
})
