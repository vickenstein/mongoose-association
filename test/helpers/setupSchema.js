
const { Schema, model } = require('mongoose')

const RiderSchema = new Schema()
RiderSchema.belongsTo('Bike')
RiderSchema.belongsTo('Helmet')

const BikeSchema = new Schema()
BikeSchema.hasOne('Rider')
BikeSchema.hasOne('Helmet', {
  through: 'Rider'
})

const HelmetSchema = new Schema()
HelmetSchema.hasOne('Rider')
HelmetSchema.hasOne('Bike', {
  through: 'Rider'
})

const RegistrationSchema = new Schema()
RegistrationSchema.belongsTo('Car')
RegistrationSchema.belongsTo('Alien', {
  localField: 'owner'
})
RegistrationSchema.belongsTo('Alien', {
  localField: 'approver',
  localField: 'approver_id'
})

const AlienSchema = new Schema()
AlienSchema.hasMany('Registration', {
  foreignKey: 'ownerId'
})
AlienSchema.hasMany('Registration', {
  localField: 'approvedRegistrations',
  foreignKey: 'approver_id'
})
AlienSchema.hasMany('Car', {
  through: 'Registration',
  throughAs: 'owner'
})
AlienSchema.hasMany('Car', {
  through: 'Registration',
  throughAs: 'approver',
  localField: 'approvedCars'
})

const CarSchema = new Schema()
CarSchema.hasMany('Registration')
CarSchema.hasMany('Alien', {
  through: 'Registration',
  throughWith: 'owner'
})

const AssemblySchema = new Schema()
AssemblySchema.polymorphic(['Bike', 'Car'], {
  localField: 'vehicle'
})
AssemblySchema.belongsTo('Part')

const PartSchema = new Schema()
PartSchema.hasMany('Assembly')
PartSchema.hasMany(['Bike', 'Car'], {
  through: 'Assembly',
  throughWith: 'vehicle'
})

CarSchema.hasMany('Assembly')
CarSchema.hasMany('Part', {
  through: 'Assembly',
  throughAs: 'vehicle'
})

BikeSchema.hasMany('Assembly')
BikeSchema.hasMany('Part', {
  through: 'Assembly',
  throughAs: 'vehicle',
  localField: 'components'
})

CarSchema.belongsTo('Rating')
BikeSchema.belongsTo('Rating')

const RatingSchema = new Schema()
RatingSchema.hasOne(['Bike', 'Car'], {
  localField: 'vehicle'
})
RatingSchema.belongsTo('Alien')

AlienSchema.hasMany(['Bike', 'Car'], {
  through: 'Rating',
  throughWith: 'vehicle',
  localField: 'ratedVehicles'
})

AlienSchema.hasOne(['Bike', 'Car'], {
  localField: 'bestRated',
  scope: () => {}
})

module.exports = () => {}
