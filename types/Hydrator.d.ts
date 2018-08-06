import * as mongoose from 'mongoose';
export interface IHydrateOptions {
    model: typeof mongoose.Model;
    [field: string]: any;
}
export declare class Hydrator {
    static hydrate(documents: any[], hydrateOptions: IHydrateOptions): any[];
}
//# sourceMappingURL=Hydrator.d.ts.map