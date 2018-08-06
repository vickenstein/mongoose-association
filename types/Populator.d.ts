import * as mongoose from 'mongoose';
import { Fields } from './Fields';
export declare class Populator {
    static checkFields(populateFields: any): any;
    static populate(model: mongoose.Model<any>, documents: any, ...populateFields: any[]): Promise<any>;
    static explainPopulate(model: mongoose.Model<any>, documents: any, ...populateFields: any[]): {}[];
    static populateField(model: mongoose.Model<any>, documents: any, field: string, childrenFields: Fields): Promise<any>;
    static explainPopulateField(model: mongoose.Model<any>, documents: any, field: string, childrenFields: Fields): any;
    static prePopulateAggregate(aggregate: mongoose.Aggregate<any>, ...populateFields: any[]): void;
    static populateAggregate(model: mongoose.Model<any>, documents: any, populateOptions: any): Promise<any>;
    static explainPopulateAggregate(model: mongoose.Model<any>, documents: any, populateOptions: any): any[];
    static queryConditionToAggregateMatch(conditions: any): any;
    static aggregateFromQuery(query: mongoose.DocumentQuery<any, any>, fields: any): mongoose.Aggregate<any[]>;
}
//# sourceMappingURL=Populator.d.ts.map