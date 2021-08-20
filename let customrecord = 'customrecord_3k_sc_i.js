let customrecord = 'customrecord_3k_sc_item_atrr_procesador';
let fieldId = `custrecord_3k_sc_item_atrr_procesador_id`;

let valores = `[{"id":"98936","name":"Intel Celeron"},{"id":"102027","name":"Intel Atom"},{"id":"98961","name":"Intel Core Duo"},{"id":"98864","name":"Intel Core i5"},{"id":"98882","name":"Intel Core i7"},{"id":"98901","name":"Intel Core i3"},{"id":"7232867","name":"Interl Core i9"},{"id":"313917","name":"AMD Phenom II"},{"id":"7232868","name":"AMD Ryzen 3"},{"id":"7232869","name":"AMD Ryzen 5"},{"id":"7232870","name":"AMD Ryzen 7"}]`;
let valoresObjet = JSON.parse(valores);

//console.log(`valoresObjet: ${JSON.stringify(valoresObjet)}`);

console.log(`valoresObjet.length: ${valoresObjet.length}`);

for (let j = 0; j < valoresObjet.length; j++)
{
    let record = nlapiCreateRecord(customrecord);
    record.setFieldValue('name',valoresObjet[j].name);
    record.setFieldValue(fieldId,valoresObjet[j].id);
    console.log(`indice: ${j} - name: ${valoresObjet[j].name} - id: ${valoresObjet[j].id}`);
    let idNewRecord = nlapiSubmitRecord(record, true);
    console.log(`indice: ${j} - idNewRecord: ${idNewRecord}`);

}