import { Association } from './Association';
import * as mongoose from 'mongoose';
export interface IOptions {
}
export declare class Scope {
    name: string;
    association: Association;
    match: any;
    ['constructor']: typeof Scope;
    constructor(name: string, association: Association, match?: any, options?: IOptions);
    static readonly options: string[];
    options: any;
    define(property: string, value: any): any;
    readonly as: any;
    readonly _as: any;
    readonly $as: any;
    readonly $fetch: any;
    readonly $unset: any;
    readonly localField: any;
    readonly foreignField: any;
    readonly through: any;
    readonly throughAsAssociation: any;
    readonly associationType: any;
    readonly nested: any;
    findFor(document: any): mongoose.DocumentQuery<any, any> | mongoose.Aggregate<any>;
    aggregateTo(aggregate: mongoose.Aggregate<any>): mongoose.Aggregate<any>;
}
//# sourceMappingURL=Scope.d.ts.map