const tsDefaultValue1 = `
export interface FlowInternalConsumption {
    id: number;
    item: number;
    model: number;
    family: number;
    sub_section: number;
    section: number;
    universe: number;
    quantity: number;
    wacp: number;
    currency: string;
    creation_date: Date;
    reference: number;
    profil: string;
}`.trim();

export const tsDefaultValue = `type Sort = {
    unsorted: boolean;
  }
  interface Other {
      other: string
  }

  type TypedObjectUnion = Sort|Other

  type Ids = Array<number>

  interface Pageable {
    sort: Sort;
    profil: string;
    pageNumber: number;
    creation_date: Date;
  }

  export interface ApiResponse {
    content: object;
    pageable: Pageable;
    sort: Sort;
    obj: { first: string, second: Sort };
    ids: Ids;
    literalStr: "lit";
    literalNb: 123;
    union: "aaa"|"bbb"|"ccc";
    never: never;
    undefined: undefined;
      null: null;
      any: any;
      intersection: Sort & Other;
      tuple: [string, number];
      objUnion: TypedObjectUnion
      void: void
      enum: Enum
      optional?: string
      symbol: Symbol
      true: true;
      thiis: this;
      arr: string[]
      arr2: Array<string>
      date: Date
      unknown: unknown
  record: Record<string, string>
  }

  enum Enum {
   first, second, third
  }
  `;
