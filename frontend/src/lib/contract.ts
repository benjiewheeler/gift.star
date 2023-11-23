import type { Action, ExtendedAssetType, NameType, PublicKeyType, SignatureType, UInt64Type } from "@wharfkit/antelope";
import { ABI, Blob, ExtendedAsset, Name, PublicKey, Signature, Struct, UInt64 } from "@wharfkit/antelope";
import type { ActionOptions, ContractArgs, PartialBy, Table } from "@wharfkit/contract";
import { Contract as BaseContract } from "@wharfkit/contract";

export const abiBlob = Blob.from(
    "DmVvc2lvOjphYmkvMS4yAAgMYW5ub3VuY2VsaW5rAAQHY3JlYXRvcgRuYW1lA2tleQpwdWJsaWNfa2V5BXRva2VuDmV4dGVuZGVkX2Fzc2V0BG1lbW8Gc3RyaW5nCmNhbmNlbGxpbmsAAQdsaW5rX2lkBnVpbnQ2NAljbGFpbWxpbmsAAwdsaW5rX2lkBnVpbnQ2NAdjbGFpbWVyBG5hbWURY2xhaW1lcl9zaWduYXR1cmUJc2lnbmF0dXJlBmNvbmZpZwACB3ZlcnNpb24Gc3RyaW5nDGxpbmtfY291bnRlcgZ1aW50NjQEaW5pdAAABmxpbmtfcwAGB2xpbmtfaWQGdWludDY0B2NyZWF0b3IEbmFtZQNrZXkKcHVibGljX2tleQV0b2tlbg5leHRlbmRlZF9hc3NldBJ0b2tlbnNfdHJhbnNmZXJyZWQEYm9vbARtZW1vBnN0cmluZwxsb2dsaW5rc3RhcnQAAQdsaW5rX2lkBnVpbnQ2NApsb2duZXdsaW5rAAUHbGlua19pZAZ1aW50NjQHY3JlYXRvcgRuYW1lA2tleQpwdWJsaWNfa2V5BXRva2VuDmV4dGVuZGVkX2Fzc2V0BG1lbW8Gc3RyaW5nBgCniwpNTec0DGFubm91bmNlbGluawAAAJwuRoWmQQpjYW5jZWxsaW5rAAAAgNNF6UxECWNsYWltbGluawAAAAAAAJDddARpbml0AJCvyRhOFxmNDGxvZ2xpbmtzdGFydAAAAJwucjUZjQpsb2duZXdsaW5rAAIAAAAAMLcmRQNpNjQAAAZjb25maWcAAAAAAAyniwNpNjQAAAZsaW5rX3MAAAAAAA=="
);

export const contractName = Name.from("gift.star");

export const abi = ABI.from(abiBlob);
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, "abi" | "account">) {
        super({
            client: args.client,
            abi: abi,
            account: contractName,
        });
    }
    action<T extends ActionNames>(name: T, data: ActionNameParams[T], options?: ActionOptions): Action {
        return super.action(name, data, options);
    }
    table<T extends TableNames>(name: T, scope?: NameType): Table<RowType<T>> {
        return super.table(name, scope, TableMap[name]);
    }
}
export interface ActionNameParams {
    announcelink: ActionParams.Announcelink;
    cancellink: ActionParams.Cancellink;
    claimlink: ActionParams.Claimlink;
    init: ActionParams.Init;
    loglinkstart: ActionParams.Loglinkstart;
    lognewlink: ActionParams.Lognewlink;
}
export namespace ActionParams {
    export interface Announcelink {
        creator: NameType;
        key: PublicKeyType;
        token: ExtendedAssetType;
        memo: string;
    }
    export interface Cancellink {
        link_id: UInt64Type;
    }
    export interface Claimlink {
        link_id: UInt64Type;
        claimer: NameType;
        claimer_signature: SignatureType;
    }
    export interface Init {}
    export interface Loglinkstart {
        link_id: UInt64Type;
    }
    export interface Lognewlink {
        link_id: UInt64Type;
        creator: NameType;
        key: PublicKeyType;
        token: ExtendedAssetType;
        memo: string;
    }
}
export namespace Types {
    @Struct.type("announcelink")
    export class announcelink extends Struct {
        @Struct.field(Name)
        creator!: Name;
        @Struct.field(PublicKey)
        key!: PublicKey;
        @Struct.field(ExtendedAsset)
        token!: ExtendedAsset;
        @Struct.field("string")
        memo!: string;
    }
    @Struct.type("cancellink")
    export class cancellink extends Struct {
        @Struct.field(UInt64)
        link_id!: UInt64;
    }
    @Struct.type("claimlink")
    export class claimlink extends Struct {
        @Struct.field(UInt64)
        link_id!: UInt64;
        @Struct.field(Name)
        claimer!: Name;
        @Struct.field(Signature)
        claimer_signature!: Signature;
    }
    @Struct.type("config")
    export class config extends Struct {
        @Struct.field("string")
        version!: string;
        @Struct.field(UInt64)
        link_counter!: UInt64;
    }
    @Struct.type("init")
    export class init extends Struct {}
    @Struct.type("link_s")
    export class link_s extends Struct {
        @Struct.field(UInt64)
        link_id!: UInt64;
        @Struct.field(Name)
        creator!: Name;
        @Struct.field(PublicKey)
        key!: PublicKey;
        @Struct.field(ExtendedAsset)
        token!: ExtendedAsset;
        @Struct.field("bool")
        tokens_transferred!: boolean;
        @Struct.field("string")
        memo!: string;
    }
    @Struct.type("loglinkstart")
    export class loglinkstart extends Struct {
        @Struct.field(UInt64)
        link_id!: UInt64;
    }
    @Struct.type("lognewlink")
    export class lognewlink extends Struct {
        @Struct.field(UInt64)
        link_id!: UInt64;
        @Struct.field(Name)
        creator!: Name;
        @Struct.field(PublicKey)
        key!: PublicKey;
        @Struct.field(ExtendedAsset)
        token!: ExtendedAsset;
        @Struct.field("string")
        memo!: string;
    }
}
export const TableMap = {
    config: Types.config,
    links: Types.link_s,
};
export interface TableTypes {
    config: Types.config;
    links: Types.link_s;
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any;
export type ActionNames = keyof ActionNameParams;
export type TableNames = keyof TableTypes;
