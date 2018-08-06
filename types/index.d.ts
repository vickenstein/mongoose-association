import * as mongoose from 'mongoose';
import { Association } from './associations/Association';
declare module 'mongoose' {
    interface Schema {
        model: mongoose.Model<any>;
    }
    interface Model<T> {
        associate(as: string): Association;
    }
    interface DocumentQuery<T, DocType extends Document> {
        populateAssociation(options: any): DocumentQuery<any, any>;
        collectAssociation(options: any): DocumentQuery<any, any>;
        model: mongoose.Model<any>;
        _model: mongoose.Model<any>;
        _conditions: any;
        op: string;
        _explain(): any;
        explain(): void;
    }
    interface Aggregate<T> {
        hydrateAssociation(options: any): Aggregate<T>;
        populateAssociation(options: any): Aggregate<T>;
        collectAssociation(options: any): Aggregate<T>;
        singular(): Aggregate<T>;
        _model: mongoose.Model<any>;
        _explain(): any;
        explain(): void;
    }
}
export declare function mongooseAssociation(mongoose: any): void;
//# sourceMappingURL=index.d.ts.map