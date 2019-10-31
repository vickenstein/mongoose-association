import * as mongoose from 'mongoose';
import { Association, IOptions, IAggregateOptions } from './Association';
export declare class Has extends Association {
    static readonly options: string[];
    static readonly isReference: boolean;
    constructor(options: IOptions, schema: mongoose.Schema);
    readonly dependent: any;
    readonly isReference: boolean;
    readonly through: any;
    readonly throughModel: any;
    readonly throughCollectionName: any;
    readonly throughModelName: any;
    readonly withAssociation: any;
    readonly throughAs: any;
    readonly _throughAs: any;
    readonly $throughAs: any;
    readonly throughWith: any;
    readonly _throughWith: any;
    readonly $throughWith: any;
    readonly throughAsAssociation: any;
    readonly throughWithAssociation: any;
    readonly throughWithAsAssociation: any;
    readonly localField: any;
    readonly foreignField: any;
    findFor(document: any, options?: any): any;
    findManyFor(documents: any[], options?: any): any;
    aggregateLookUpMatch(options: IAggregateOptions): any;
    aggregateThroughLookUpMatch(options?: IAggregateOptions): any;
    aggregateLookUp(aggregate: mongoose.Aggregate<any>, options?: IAggregateOptions): void;
}
//# sourceMappingURL=Has.d.ts.map