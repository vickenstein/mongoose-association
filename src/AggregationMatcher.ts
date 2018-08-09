import * as mongoose from 'mongoose'
import * as _ from 'lodash'
import { Association } from './associations/Association'

export class AggregationMatcher {

  aggregate: mongoose.Aggregate<any>
  ['constructor']: typeof AggregationMatcher

  static match(pipeline: any[]) {
    for (let i = 0; i < pipeline.length; i++) {
      const step = pipeline[i]
      if (step.$match) return step
    }
  }

  constructor(aggregate: mongoose.Aggregate<any>, match: any = {}) {
    this.aggregate = aggregate
    this.processPipeline(match)
  }

  get pipeline() {
    return this.aggregate._pipeline
  }

  get modelName() {
    return Association.decapitalize(this.aggregate._model.modelName)
  }

  get match() {
    return this.constructor.match(this.pipeline)
  }

  lookup(as: string) {
    for (let i = 0; i < this.pipeline.length; i++) {
      const step = this.pipeline[i]
      if (step.$lookup && step.$lookup.as === as) return [step, i]
    }
    return [null, null]
  }

  updateLookup(as: string, match: any) {
    const [step, index] = this.lookup(as)
    if (step) {
      const localMatch = this.constructor.match(step.$lookup.pipeline)
      if (localMatch) {
        _.merge(localMatch.$match, match)
      }
    }
  }

  updateMatch(match: any) {
    if (this.match) {
      _.merge(this.match, match)
    } else {
      this.pipeline.unshift({
        $match: match
      })
    }
  }

  update(as: string, match: any) {
    if (as === this.modelName) {
      this.updateMatch(match)
    } else {
      this.updateLookup(as, match)
    }
  }

  processPipeline(match: any) {
    Object.keys(match).forEach((key: string) => {
      const localMatch = match[key]
      this.update(key, localMatch)
    })
  }
}
