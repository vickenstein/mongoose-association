import * as mongoose from 'mongoose';
import { Association, IOptions } from './associations/Association';
import { SchemaMixin } from './SchemaMixin';
import { Serializer } from './Serializer';
declare module 'mongoose' {
    interface Schema {
        deleteField: string;
        model: mongoose.Model<any>;
        belongsTo(foreignModelName: string, options?: IOptions, schemaOptions?: any): Association;
        polymorphic(foreignModelNames: string[], options?: IOptions, schemaOptions?: any): Association;
        hasOne(foreignModelName: string, options?: IOptions): Association;
        hasMany(foreignModelName: string, options?: IOptions): Association;
        indexAssociations(...associations: any[]): SchemaMixin;
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
        where(options: any): Aggregate<T>;
        singular(): Aggregate<T>;
        _model: mongoose.Model<any>;
        _pipeline: any[];
        _explain(): any;
        explain(): void;
    }
}
export declare function mongooseAssociation(mongoose: any): void;
export { Serializer };
//# sourceMappingURL=index.d.ts.map