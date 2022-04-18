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

function reproject_geometry(coordinates, ftType){
    var new_coords = []

    switch(ftType){
        case 'Point':
            new_coords = proj.unproject(L.point(feature.geometry.coordinates));
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

    var table = document.createElement('table');
    var thead = table.createTHead()
    var row = thead.insertRow()
    head_text = ['Attribute', 'Value']
    for (var x of head_text){
        var th = document.createElement('th');
        var text = document.createTextNode(x);
        th.appendChild(text);
        row.appendChild(th)
    }

    for (const key of Object.keys(attObject)){
        if (attObject[key] == null)
            continue;
        var row = table.insertRow();
        cell_att = row.insertCell();
        cell_att.appendChild(document.createTextNode(key));
        cell_val = row.insertCell();
        cell_val.appendChild(document.createTextNode(attObject[key]));
    }    

    return table
}