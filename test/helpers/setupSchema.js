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
  localField: 'owner'
})

registrationSchema.belongsTo('Alien', {
  localField: 'approver',
  foreignKey: 'approver_id'
})

const alienSchema = new Schema()
alienSchema.hasMany('Registration', {
  as: 'owner'
})

alienSchema.hasMany('Registration', {
  localField: 'approvedRegistrations',
  foreignKey: 'approver_id'
})

alienSchema.hasMany('Car', {
  through: 'Registration',
  throughAs: 'owner'
})

alienSchema.hasMany('Car', {
  through: 'Registration',
  throughAs: 'approver',
  localField: 'approvedCars'
})

const carSchema = new Schema()
carSchema.hasMany('Registration')
carSchema.hasMany('Alien', {
  through: 'Registration',
  throughBy: 'owner'
})

const assemblySchema = new Schema()
assemblySchema.polymorphic(['Bike', 'Car'], {
  localField: 'vehicle'
})
assemblySchema.belongsTo('Part')

const partSchema = new Schema()
partSchema.hasMany('Assembly')
partSchema.hasMany(['Bike', 'Car'], {
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
  localField: 'components'
})

carSchema.belongsTo('Rating')
bikeSchema.belongsTo('Rating')

const ratingSchema = new Schema()
ratingSchema.polymorphic(['Bike', 'Car'], {
  localField: 'vehicle'
})
ratingSchema.belongsTo('Alien')

alienSchema.hasOne(['Bike', 'Car'], {
  through: 'Rating',
  throughWith: 'vehicle',
  localField: 'ratedVehicle'
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
