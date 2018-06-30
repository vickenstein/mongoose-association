require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')

const BandSchema = new mongoose.Schema({})
BandSchema.hasMany('Member')
BandSchema.hasMany('Instrument', {
  localField: 'toys',
  foriegnKey: 'band_id'
})
const Band = mongoose.model('Band', BandSchema)

const MemberSchema = new mongoose.Schema({})
MemberSchema.belongsTo('Band')
const Member = mongoose.model('Member', MemberSchema)

const InstrumentSchema = new mongoose.Schema({})
InstrumentSchema.belongsTo('Band', {
  foriegnKey: 'brand_id'
})
const Instrument = mongoose.model('Instrument', InstrumentSchema)

describe("assign association class", () => {

  describe("#hasMany", () => {
    it('', async () => {
      const count = 5
      const band = await new Band().save()
      for (let i = 0; i < count; i++) {
        let member = await new Member({
          band: band
        }).save()
        let instrument = await new Instrument({
          band: band
        }).save()
      }
      const members = await band.members
      const toys = await band.toys
      assert.strictEqual(members.length, count)
      assert.strictEqual(toys.length, count)
    })

    it('', async () => {
      const count = 5
      const band1 = await new Band().save()
      const band2 = await new Band().save()
      for (let i = 0; i < count; i++) {
        let member = await new Member({
          band: band1
        }).save()
        let instrument = await new Instrument({
          band: band1
        }).save()
        member = await new Member({
          band: band2
        }).save()
        instrument = await new Instrument({
          band: band2
        }).save()
      }
      const bands = await Band.find().populateAssociation('members', 'toys')
      let mongooseRequestCount = mongoose.requestCount
      let members = await bands[0].members
      let toys = await bands[0].toys
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
      const band = await Band.findOne().populateAssociation('members', 'toys')
      mongooseRequestCount = mongoose.requestCount
      members = await bands[0].members
      toys = await bands[0].toys
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })
})
