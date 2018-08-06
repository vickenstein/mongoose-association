import * as mongoose from 'mongoose';
import { Association, IOptions, IAggregateOptions } from './Association';
export declare class Polymorphic extends Association {
    static readonly options: string[];
    constructor(options: IOptions, schema: mongoose.Schema);
    readonly associationType: any;
    readonly typeField: any;
    findFor(document: any): mongoose.DocumentQuery<any, any>;
    findManyFor(documents: any[]): mongoose.DocumentQuery<any, any>;
    aggregateMatch(options: IAggregateOptions): any;
    aggregateLookUp(aggregate: mongoose.Aggregate<any>, options: IAggregateOptions): void;
    aggregate(options?: IAggregateOptions): mongoose.Aggregate<any>;
    index(order: number, options: object): this;
}
//# sourceMappingURL=Polymorphic.d.ts.map