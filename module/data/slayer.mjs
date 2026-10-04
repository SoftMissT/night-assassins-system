/** Persisted Slayer data only. Mechanics and derived formulas belong to a later, audited phase. */
export class SlayerData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    const num = () => new f.NumberField({ required: true, nullable: false, initial: 0, min: 0 });
    const resource = () => new f.SchemaField({ value: num(), max: num() });
    return {
      level: new f.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
      rank: new f.StringField({ initial: "Aspirante a Exterminador" }),
      classId: new f.StringField({ initial: "" }),
      originId: new f.StringField({ initial: "" }),
      breathing: new f.StringField({ initial: "" }),
      attributes: new f.SchemaField({
        vit: num(), dex: num(), for: num(), car: num(), fdv: num(), int: num(), sab: num()
      }),
      resources: new f.SchemaField({ pdv: resource(), pdr: resource(), folego: resource() })
    };
  }
}
