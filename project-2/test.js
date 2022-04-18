const proj = L.CRS.EPSG3857;

var map = L.map('map').setView([43.32, 21.88], 13);
var popup = L.popup();

var STATE = {
    polygons: [],
    wms: {
        layers: ['nis_bato'] },
    wfs: {
        layers: []
    }
}

fetch('http://localhost:8080/geoserver/nis/nis_bato/wms?version=2.0.0&request=GetCapabilities')
    .then(res => {return res.text()})
    .then(text => {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(text,"text/xml");
        return xmlDoc.childNodes[0].childNodes[3].childNodes[5]; })
    .then(xmlDoc => {
        var ft_arr = xmlDoc.getElementsByTagName('Layer')
        console.log(ft_arr)
        for( let item of ft_arr){
            layer_name = 'nis:' + item.getElementsByTagName('Name')[0].innerHTML
            STATE.wfs.layers.push(layer_name);
        }
        STATE.wfs.layers = STATE.wfs.layers.slice(1)
    })

wms_tileLayer = L.tileLayer.wms("http://localhost:8080/geoserver/nis/wms",{
    layers: ["nis_bato"],
    format: 'image/png',
    transperent: true
})
wms_tileLayer.addTo(map)


function drawLegend(e){

    scale = zoomToScale(map.getZoom());

    bbox = map.getBounds()
    bbox._southWest = proj.project(bbox._southWest)
    bbox._northEast = proj.project(bbox._northEast)
    bbox_arr = [bbox._southWest.x, bbox._southWest.y, bbox._northEast.x, bbox._northEast.y ]

    url = 'http://localhost:8080/geoserver/nis/wms';
    params = {
        service: 'wms',
        version: '1.1.1',
        request: 'GetLegendGraphic',
        format: 'image/png',
        width: '20',
        height: '20',
        layer: 'nis_bato',
        scale: `${scale}`,
        bbox: `${bbox_arr}`,
        srs: 'EPSG:3857',
        srcwidth: '512',
        srcheight: '512',
        legend_options: 'hideEmptyRules:true'
    }

    request = url + '?' + createURLParams(params);

    fetch(request)
      .then(res=>{return res.blob()})
      .then(blob=>{
        var img = URL.createObjectURL(blob);
        document.getElementById('legend').setAttribute('src', img);
      });
}

function onMapClick(e) {
    if (STATE.wfs.layers.length == 0){
        console.log('No Layers Added')
        return
    }

    point = proj.project(e.latlng)
    console.log(point)
    
    url = 'http://localhost:8080/geoserver/nis/wfs';
    params = {
        service:'wfs',
        version:'2.0.0',
        request: 'GetFeature',
        typeNames: multipleLayersUrlFormat(STATE.wfs.layers),
        outputFormat: 'application/json',
        // cql_filter: `INTERSECTS(way,POINT (${point.x} ${point.y}))`
        cql_filter: `DWITHIN(way,POINT(${point.x} ${point.y}),5,meters)`
    }

    request = url + '?' + createURLParams(params)

    console.log(request)

    fetch(request)
        .then(response => response.json())
        .then(data => draw_single_way(data, e))
        .then(data => STATE.polygons.forEach(element => element.openPopup(e.latlng)))
}

function draw_single_way(obj, e){
    STATE.polygons.forEach(element => map.removeLayer(element))
    STATE.polygons = []

    console.log(obj)
    if (obj.features.length == 0) return;

    // Just the first geometry
    feature = obj.features[obj.features.length - 1]
    geom = reproject_geometry(feature.geometry.coordinates, feature.geometry.type);
    table_html = createAttributeTable(feature.properties)

    popup
        .setLatLng(e.latlng)
        .setContent(table_html)
        .openOn(map);

    STATE.polygons.push(
        createFeatureRepresentation(geom, feature.geometry.type).addTo(map));
}

map.on('click', onMapClick);
map.on('zoom', drawLegend);
map.on('move', drawLegend);