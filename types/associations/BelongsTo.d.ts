import * as mongoose from 'mongoose';
import { Association, IOptions } from './Association';
export declare class BelongsTo extends Association {
    static readonly options: string[];
    constructor(options: IOptions, schema: mongoose.Schema);
    readonly associationType: any;
    findFor(document: any): mongoose.DocumentQuery<any, any> | mongoose.Aggregate<any>;
    findManyFor(documents: any[]): mongoose.DocumentQuery<any, any> | mongoose.Aggregate<any>;
    index(order: number, options: object): this;
}
//# sourceMappingURL=BelongsTo.d.ts.map