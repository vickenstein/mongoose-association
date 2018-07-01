require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')

const BikeSchema = new mongoose.Schema()
BikeSchema.hasOne('License', {
  foreignKey: 'vehicleId'
})
const Bike = mongoose.model('Bike', BikeSchema)

const CarSchema = new mongoose.Schema()
CarSchema.hasMany('License', {
  foreignKey: 'vehicleId'
})
const Car = mongoose.model('Car', CarSchema)

const LicenseSchema = new mongoose.Schema()
LicenseSchema.polymorphic(['Car', 'Bike'], {
  localField: 'vehicle'
})
const License = mongoose.model('License', LicenseSchema)

describe("assign association class", () => {

  describe("#polymorphic", () => {
    it('', async () => {
      const count = 5
      const bike = await new Bike().save()
      const car = await new Car().save()
      const bikeLicense = await new License({
        vehicle: bike
      }).save()
      const carLicenses = []
      for (let i = 0; i < count; i++) {
        let carLicense = await new License({
          vehicle: car
        }).save()
        carLicenses.push(carLicense)
      }
      const licenseBike = await bikeLicense.vehicle
      assert.strictEqual(bike._id.toString(), licenseBike._id.toString())
      const licenseCar = await carLicenses[0].vehicle
      assert.strictEqual(car._id.toString(), licenseCar._id.toString())
      const theBikeLicense = await bike.license
      assert.strictEqual(theBikeLicense._id.toString(), bikeLicense._id.toString())
      const theCarLicenses = await car.licenses
      assert.strictEqual(theCarLicenses.length, count)

      const licenses = await License.find()
      let vehicle = await licenses[0].vehicle
      assert.isOk(vehicle)
      const license = await License.findOne()
      vehicle = await license.vehicle
      assert.isOk(vehicle)
    })

    it('', async () => {
      const count = 5
      const bike = await new Bike().save()
      const car = await new Car().save()
      const bikeLicense = await new License({
        vehicle: bike
      }).save()
      const carLicenses = []
      for (let i = 0; i < count; i++) {
        let carLicense = await new License({
          vehicle: car
        }).save()
        carLicenses.push(carLicense)
      }
      const licenses = await License.find().populateAssociation('vehicle')
      let mongooseRequestCount = mongoose.requestCount
      let vehicle = await licenses[0].vehicle
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
      const license = await License.findOne().populateAssociation('vehicle')
      mongooseRequestCount = mongoose.requestCount
      vehicle = await license.vehicle
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })
})
