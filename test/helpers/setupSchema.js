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
  as: 'owner'
})

alienSchema.hasMany('Registration', {
  as: 'approvedRegistrations',
  foreignField: 'approver_id'
})

alienSchema.hasMany('Car', {
  through: 'Registration',
  throughAs: 'owner'
})

alienSchema.hasMany('Car', {
  through: 'Registration',
  throughAs: 'approver',
  as: 'approvedCars'
})

const carSchema = new Schema()
carSchema.hasMany('Registration')
carSchema.hasMany('Alien', {
  through: 'Registration',
  throughBy: 'owner'
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
  throughBy: 'vehicle'
})

partSchema.hasMany('Car', {
  through: 'Assembly',
  throughBy: 'vehicle'
})

carSchema.hasMany('Assembly')
carSchema.hasMany('Part', {
  through: 'Assembly',
  throughAs: 'vehicle'
})

bikeSchema.hasMany('Assembly')
bikeSchema.hasMany('Part', {
  through: 'Assembly',
  throughAs: 'vehicle',
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
  with: 'vehicle',
  through: 'Bike'
})
riderSchema.hasOne('Rating', {
  through: 'Bike',
  throughWith: 'vehicle'
})

alienSchema.hasOne('Rating')
alienSchema.hasOne('Car', {
  through: 'Rating',
  throughBy: 'vehicle',
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
