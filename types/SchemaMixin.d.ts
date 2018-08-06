import * as mongoose from 'mongoose';
import { Association, IOptions } from './associations/Association';
import { Associations } from './Associations';
declare module "mongoose" {
    interface Schema {
        indexAssociations(...associations: any[]): Schema;
    }
}
export declare class SchemaMixin extends mongoose.Schema {
    associations: Associations;
    associate(as: string): Association;
    indexAssociations(...associations: any[]): this;
    belongsTo(foreignModelName: string, options?: IOptions, schemaOptions?: any): Association;
    defineBelongsToSchema({ foreignModelName, localField }: IOptions, schemaOptions?: any): void;
    defineBelongsToVirtual(association: Association): void;
    polymorphic(foreignModelNames?: string[], options?: IOptions, schemaOptions?: any): Association;
    definePolymorphicSchema({ foreignModelNames, localField, typeField }: IOptions, schemaOptions?: any): void;
    definePolymorphicVirtual(association: Association): void;
    hasOne(foreignModelName: string, options?: IOptions): Association;
    defineHasOneVirtual(association: Association): void;
    hasMany(foreignModelName: string, options?: IOptions): Association;
    defineHasManyVirtual(association: Association): void;
    static apply(originalClass: any): void;
}
//# sourceMappingURL=SchemaMixin.d.ts.map