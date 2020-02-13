const mongoose = require('mongoose')
const { Schema } = mongoose

const riderSchema = new Schema({
  age: {
    type: Number
  }
})

riderSchema.methods.doubleAge = function() {
  return this.age * 2
}

riderSchema.methods.asyncAge = async function() {
  return this.age * 2
}

riderSchema.belongsTo('Bike').index(1, { sparse: true })
riderSchema.belongsTo('Helmet')

const bikeSchema = new Schema({
  color: {
    type: String
  }
})

bikeSchema.methods.uppercaseColor = function() {
  return this.color.toUpperCase()
}

bikeSchema.hasOne('Rider', {
  dependent: 'delete'
})
bikeSchema.hasOne('Helmet', {
  through: 'Rider'
})

bikeSchema.softDeleteable({
  deleter: 'Rider'
})

const helmetSchema = new Schema()
helmetSchema.hasOne('Rider')
helmetSchema.hasOne('Bike', {
  through: 'Rider'
})

const registrationSchema = new Schema()
registrationSchema.belongsTo('Car')
registrationSchema.belongsTo('Alien', {
  as: 'owner'
})

registrationSchema.belongsTo('Alien', {
  as: 'approver',
  localField: 'approver_id'
})

const alienSchema = new Schema()
alienSchema.hasMany('Registration', {
  as: 'ownedRegistration',
  with: 'owner'
})

alienSchema.hasMany('Registration', {
  as: 'approvedRegistrations',
  with: 'approver'
})

alienSchema.hasMany('Car', {
  through: 'Registration',
  with: 'owner'
})

alienSchema.hasMany('Car', {
  through: 'Registration',
  with: 'approver',
  as: 'approvedCars'
})

const carSchema = new Schema()
carSchema.hasOne('Registration')
carSchema.hasOne('Alien', {
  through: 'Registration',
  throughAs: 'owner'
})

const assemblySchema = new Schema()
const vehicleAssociation = assemblySchema.polymorphic(['Bike', 'Car'], {
  as: 'vehicle'
})
const partAssociation = assemblySchema.belongsTo('Part')
assemblySchema

const partSchema = new Schema({
  color: {
    type: String
  }
})
partSchema.hasMany('Assembly')
partSchema.hasMany('Bike', {
  through: 'Assembly',
  throughAs: 'vehicle'
})

partSchema.hasMany('Car', {
  through: 'Assembly',
  throughAs: 'vehicle'
})


carSchema.hasMany('Assembly', {
  with: 'vehicle',
  dependent: 'nullify'
})
const hasManyPart = carSchema.hasMany('Part', {
  through: 'Assembly',
  with: 'vehicle'
})
carSchema.scope('Red', hasManyPart, { part: { color: 'red' }})

bikeSchema.hasMany('Assembly', {
  with: 'vehicle',
  dependent: 'delete'
})
bikeSchema.hasMany('Part', {
  through: 'Assembly',
  with: 'vehicle',
  as: 'components'
})

carSchema.hasOne('Rating', {
  with: 'vehicle'
})
bikeSchema.hasOne('Rating', {
  with: 'vehicle'
})

const ratingSchema = new Schema()
ratingSchema.polymorphic(['Bike', 'Car'], {
  as: 'vehicle'
})
ratingSchema.belongsTo('Alien')
ratingSchema.hasOne('Rider', {
  through: 'Bike'
})
riderSchema.hasOne('Rating', {
  through: 'Bike'
})

alienSchema.hasOne('Rating')
alienSchema.hasOne('Car', {
  through: 'Rating',
  throughAs: 'vehicle',
  as: 'ratedCar'
})

const licenseSchema = new Schema({
  valid: Boolean
})
const hasManyLicense = bikeSchema.hasMany('License', {
  nested: true
})

licenseSchema.hasMany('Bike', {
  with: 'licenses'
})

bikeSchema.scope('invalid', hasManyLicense, { valid: false })

const problemSchema = new Schema({
  solved: Boolean
})
problemSchema.belongsTo('Car')
const hasManyProblem = carSchema.hasMany('Problem')
carSchema.scope('solved', hasManyProblem, { solved: true })

const Rider = mongoose.model('Rider', riderSchema)
const Bike = mongoose.model('Bike', bikeSchema)
const Helmet = mongoose.model('Helmet', helmetSchema)
const registration = mongoose.model('Registration', registrationSchema)
const Alien = mongoose.model('Alien', alienSchema)
const Car = mongoose.model('Car', carSchema)
const Assembly = mongoose.model('Assembly', assemblySchema)
const Part = mongoose.model('Part', partSchema)
const Rating = mongoose.model('Rating', ratingSchema)
const License = mongoose.model('License', licenseSchema)
const Problem = mongoose.model('Problem', problemSchema)
module.exports = () => {}
