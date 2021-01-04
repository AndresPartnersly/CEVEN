/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/ui/dialog', 'N/query', 'N/search', 'N/https'],

function(currentRecord, url, dialog, query, search, https) {
    
 
    function saveRecord(scriptContext) {

    }


	function completarPackageSublist() {

        var proceso = 'Andreani Gestionar Paquete - Client';

        var title = 'Mensaje';

        var record = currentRecord.get();

        console.log('LINE 24');
        var itemSublist = getSublistItemData(record);
        console.log('LINE 26 - itemSublist: '+JSON.stringify(itemSublist));

        if (!isEmpty(itemSublist) && itemSublist.length > 0)
        {
            console.log('LINE 30');
            var itemArray = getItemData(itemSublist);
            console.log('LINE 32 - itemArray: '+JSON.stringify(itemArray));
        }

        if (!isEmpty(itemArray) && itemArray.length > 0)
        {

            var arrayPackages = [];
        
            if (itemSublist.length > 0)
            {
                for (var i=0; i < itemSublist.length; i++)
                {

                    var idItem = itemSublist[i].idItem;
                    var quantityItem = itemSublist[i].quantityItem;

                    var arrayTemporal =  itemArray.filter(function (elemento) {
                                        
                        if (elemento.idItem == idItem)
                        {
                            var objeto = {};
                            objeto.indicePckg = i;
                            objeto.pesoKg = elemento.pesoKg;
                            objeto.largoCm = elemento.largoCm;
                            objeto.anchoCm = elemento.anchoCm;
                            objeto.altoCm = elemento.altoCm;
                            objeto.dimensiones = elemento.largoCm +'x'+elemento.anchoCm+'x'+elemento.altoCm;
                            objeto.volumenCm3 = elemento.volumenCm3;
                            arrayPackages.push(objeto);
                        }
                    });
                }
                console.log('LINE 64 - arrayPackages: '+JSON.stringify(arrayPackages));
            }
        }

        var cantidadPckg = clearSublistPackage(record);

        console.log('LINE 70 - cantidadPckg: '+cantidadPckg);


         

        /*if (!isEmpty(validEntity) && validEntity)
        {

        }
        else
        {
            var message = {
                title: title,
                message: "No se puede iniciar cotizador ya que el cliente seleccionado en la transacción no coincide con la categoría de cliente configurada ID: "+catClienteParams
            };
            dialog.alert(message);  
        }*/
    }


    function getSublistItemData(record)
    {
        var title = 'getSublistItemData - Mensaje';
        var itemArray = [];
        var sublist = 'item';
        var cantArticulos = record.getLineCount({
            sublistId: sublist
        });
    
        if (cantArticulos > 0)
        {
            for (var i=0; i < cantArticulos; i++)
            {
                record.selectLine({
                    sublistId: sublist,
                    line: i
                });

                var itemreceiveItem = record.getCurrentSublistValue({
                    sublistId: sublist,
                    fieldId: 'itemreceive'
                });

                console.log('indice: '+i+' - itemreceiveItem: '+itemreceiveItem);

                var idItem = nlapiGetLineItemValue(sublist,'item', i+1 )/*record.getCurrentSublistValue({
                    sublistId: sublist,
                    fieldId: 'item'
                });*/

                console.log('indice: '+i+' - idItem: '+idItem+ ' - nlapiGetLineItemValue(item,item,1): ' +nlapiGetLineItemValue('item','item',1));

                var quantityItem = record.getCurrentSublistValue({
                    sublistId: sublist,
                    fieldId: 'quantity'
                });

                console.log('indice: '+i+' - quantityItem: '+quantityItem);

                var line = i;/*record.getCurrentSublistValue({
                    sublistId: sublist,
                    fieldId: 'orderline'
                });*/

                console.log('indice: '+i+' - line: '+line);

                if (itemreceiveItem == 'T' || itemreceiveItem == true)
                {
                    var objeto = {};
                    objeto.idItem = idItem;
                    objeto.line = line;
                    objeto.quantityItem = quantityItem;
                    itemArray.push(objeto);
                }
            }
        }
        else
        {
            var message = {
                title: title,
                message: "La transacción debe tener articulos cargados"
            };
            
            dialog.alert(message);
        }

        alert('itemArray: '+JSON.stringify(itemArray));

        return itemArray;
    }


    function getItemData(array)
    {
        var itemArray = [];
        var arraySS = [];

        if (!isEmpty(array))
        {
            if (array.length > 0)
            {
                for (var i=0; i < array.length; i++)
                {
                    var idItem =  array[0].idItem;
                    itemArray.push(idItem);
                }
            }
        }
        
        if (itemArray.length > 0)
        {
            var ssFullfilment = search.load({
                id: 'customsearch_ptly_item_fullfilment'
            })
    
            var ssIdFilter = search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: itemArray
            });
    
            ssFullfilment.filters.push(ssIdFilter);
    
            var ssFullfilmentRun = ssFullfilment.run();
            var ssFullfilmentRange = ssFullfilmentRun.getRange({
                start: 0,
                end: 1000
            }); 

            for (var j = 0; j < ssFullfilmentRange.length; j++)
            {
                var objeto = {};
                objeto.idItem = ssFullfilmentRange[j].getValue(ssFullfilmentRun.columns[0]);
                objeto.pesoKg = ssFullfilmentRange[j].getValue(ssFullfilmentRun.columns[3]);
                objeto.largoCm = ssFullfilmentRange[j].getValue(ssFullfilmentRun.columns[4]);
                objeto.anchoCm = ssFullfilmentRange[j].getValue(ssFullfilmentRun.columns[5]);
                objeto.altoCm = ssFullfilmentRange[j].getValue(ssFullfilmentRun.columns[6]);
                objeto.volumenCm3 = ssFullfilmentRange[j].getValue(ssFullfilmentRun.columns[7]);
                arraySS.push(objeto);
            }
        }
    
        console.log('arraySS: '+JSON.stringify(arraySS));

        return arraySS;
    }


    function clearSublistPackage(record)
    {
        var sublist = 'package';
        var cantArticulos = record.getLineCount({
            sublistId: sublist
        });

        console.log('LINE 220 - cantArticulos: '+cantArticulos);

        for (var i=0; i < cantArticulos; i++)
        {
            record.removeLine({
                sublistId: sublist,
                line: 0
            });
        }

        cantArticulos = record.getLineCount({
            sublistId: sublist
        });


        console.log('LINE 235 - cantArticulos: '+cantArticulos);

        return cantArticulos;
    }



    function isEmpty(value) {

        if (value === '')
        {
            return true;
        }

        if (value === null)
        {
            return true;
        }

        if (value === undefined)
        {
            return true;
        }
        
        if (value === 'undefined')
        {
            return true;
        }

        if (value === 'null')
        {
            return true;
        }

        return false;
    }

      
    return {
        saveRecord: saveRecord,
        completarPackageSublist: completarPackageSublist
    };
    
});