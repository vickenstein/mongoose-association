const mongoose = require('mongoose')
const { Schema } = mongoose

const riderSchema = new Schema()
riderSchema.belongsTo('Bike')
riderSchema.belongsTo('Helmet')

const bikeSchema = new Schema()
bikeSchema.hasOne('Rider')
bikeSchema.hasOne('Helmet', {
  through: 'Rider'
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
assemblySchema.polymorphic(['Bike', 'Car'], {
  as: 'vehicle'
})
assemblySchema.belongsTo('Part')

const partSchema = new Schema()
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
  with: 'vehicle'
})
carSchema.hasMany('Part', {
  through: 'Assembly',
  with: 'vehicle'
})

bikeSchema.hasMany('Assembly', {
  with: 'vehicle'
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

const Rider = mongoose.model('Rider', riderSchema)
const Bike = mongoose.model('Bike', bikeSchema)
const Helmet = mongoose.model('Helmet', helmetSchema)
const registration = mongoose.model('Registration', registrationSchema)
const Alien = mongoose.model('Alien', alienSchema)
const Car = mongoose.model('Car', carSchema)
const Assembly = mongoose.model('Assembly', assemblySchema)
const Part = mongoose.model('Part', partSchema)
const Rating = mongoose.model('Rating', ratingSchema)

module.exports = () => {}
