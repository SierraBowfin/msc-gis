const CQL_SPATIAL_OPERATIONS= [
    'EQUALS', 'DISJOINT', 'INTERSECTS', 'TOUCHES', 'CROSSES', 'WITHIN', 'CONTAINS', 'OVERLAPS', 'RELATE', 'DWITHIN', 'BEYOND'
]

function createURLParams(params){
    res_string = ''
    for (const key of Object.keys(params)){
        if (Array.isArray(params[key]))
            res_string += key + '=' + params[key].join(',').replaceAll(' ', '%20') + '&';
        else
            res_string += key + "=" + params[key].replaceAll(' ', '%20') + '&';
    }
    res_string = res_string.slice(0,-1)
    
    return res_string
}

function multipleLayersUrlFormat(layersArr){
    res_string = ''
    for (let item of layersArr){
        res_string += '(' + item +')'
    }
    return res_string;
}

function zoomToScale(zoom){
    c = 559082264
    scale = c / Math.pow(2,zoom)
    return scale
}

function mapGmlType2LeafletType(gmlType){
    if (gmlType === "Geometry")
        return ['polygon', 'rectangle', 'circle'];
    if (gmlType === "LineString")
        return ['polyline'];
    if (gmlType === "Point")
        return ['marker', 'circlemarker'];

    return undefined;
}

function reproject_geometry(coordinates, ftType){
    var new_coords = []

    switch(ftType){
        case 'Point':
            new_coords = proj.unproject(L.point(coordinates));
            break;
        case 'Polygon':
            coordinates.forEach(
                poly => {
                    new_coords.push([])
                    poly.forEach(
                        element => new_coords[new_coords.length - 1].push(proj.unproject(L.point(element)))
                )}
            )
            break;
        case 'LineString':
            coordinates.forEach(
                element => new_coords.push(proj.unproject(L.point(element))))           
    }
    
    return new_coords
}

function createFeatureRepresentation(ftCoords, ftType){
    switch(ftType){
        case 'Point':
            element = L.circle(ftCoords, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5,
                radius: 5
            })
            break;
        case 'Polygon':
            element = L.polygon(ftCoords, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
            })
            break;
        case 'LineString':
            element = L.polyline(ftCoords,{
                color:'red'
            })          
    }
    return element
}

function createAttributeTable(attObject){

    let table = document.createElement('table');
    let thead = table.createTHead();
    let row = thead.insertRow();
    const head_text = ['Attribute', 'Value']
    for (var x of head_text){
        var th = document.createElement('th');
        var text = document.createTextNode(x);
        th.appendChild(text);
        row.appendChild(th)
    }

    for (const key of Object.keys(attObject)){
        if (attObject[key] == null)
            continue;
        let data_row = table.insertRow();
        cell_att = data_row.insertCell();
        cell_att.appendChild(document.createTextNode(key));
        cell_val = data_row.insertCell();
        cell_val.appendChild(document.createTextNode(attObject[key]));
    }    

    return table
}

function createPostXML(app, attArray, geomIndex){
    let xml = document.implementation.createDocument('','', null);
    let transaction = document.createElementNS(wfsUri,'wfs:Transaction');
    transaction.setAttribute('service', 'WFS');
    transaction.setAttribute('version', '1.1.0');
    let insert = document.createElementNS(wfsUri,'wfs:Insert');
    let typeNS = document.createElementNS('http://geoserver.org/nis', app.layers[app.currentLayer].name)


    attArray.forEach(el => {
        if (el.attributeValue !== ''){
            let attXml = xml.createElementNS('http://geoserver.org/nis', 'nis:' + el.attributeName );
            attXml.appendChild(xml.createTextNode(el.attributeValue));
            typeNS.appendChild(attXml);
        }
    });
    let wayXml = xml.createElementNS('http://geoserver.org/nis', 'nis:way');
    console.log(app.layers[app.currentLayer].drawnItems.getLayers()[geomIndex]);
    wayXml.appendChild(app.layers[app.currentLayer].drawnItems.getLayers()[geomIndex].toGml(proj, xml));

    typeNS.appendChild(wayXml);
    insert.appendChild(typeNS);
    transaction.appendChild(insert);
    xml.appendChild(transaction);

    return xml;
}