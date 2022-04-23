const proj = L.CRS.EPSG3857;

var map = L.map('map').setView([43.32, 21.88], 13);
var popup = L.popup();

var STATE = {
    polygons: [],
    wms: {
        layers: ['nis_bato'] },
    all_layers: [],
    selected_layers: [],

    setSelectedLayers: function(newLayers){
        this.selected_layers = newLayers
        this.layers_listener(newLayers)
    },
    getSelectedLayerNames: function(){
        layerNames = this.all_layers.filter((item, i) => this.selected_layers[i]);
        return layerNames;
    },

    layers_listener: function(newLayers){
        layersToShow = this.all_layers.filter((item, i) => newLayers[i]);
        wms_tileLayer = L.tileLayer.wms("http://localhost:8080/geoserver/nis/wms",{
            layers: layersToShow,
            format: 'image/png',
            transperent: true
        })
        wms_tileLayer.addTo(map)
    },

    handleDrop: function(event) {
        event.stopPropagation();
        event.target.classList.remove('over');
        
        if (dragSrcEl !== this) {
            props = JSON.parse(event.dataTransfer.getData('text/plain'));
            dragSrcEl.firstChild.checked = this.firstChild.checked
            dragSrcEl.firstChild.setAttribute('checked', this.firstChild.checked);
            dragSrcEl.childNodes[1].nodeValue = this.childNodes[1].textContent;

            this.firstChild.checked = props.checked;
            this.firstChild.setAttribute('checked', props.checked);
            this.childNodes[1].nodeValue = props.text;

            let arr = STATE.all_layers.slice();
            arr.splice(this.firstChild.value, 1, this.childNodes[1].textContent);
            arr.splice(dragSrcEl.firstChild.value, 1, dragSrcEl.childNodes[1].textContent);
            STATE.all_layers = arr

            arr = STATE.selected_layers.slice();
            arr.splice(this.firstChild.value, 1, this.firstChild.checked);
            arr.splice(dragSrcEl.firstChild.value, 1, dragSrcEl.firstChild.checked);
            STATE.setSelectedLayers(arr)
        }
        
        return false;
    },

    handleDropAlternative: function (event){
        event.stopPropagation();
        event.target.classList.remove('over'); 
        
        if (dragSrcEl !== this) {
            src = JSON.parse(event.dataTransfer.getData('text/plain'));

            // let arr = STATE.all_layers.slice();
            // arr.splice(this.firstChild.value, 1, src.text);
            // arr.splice(src.value, 1, this.childNodes[1].textContent);
            // STATE.all_layers = arr

            let arr = STATE.all_layers.slice();
            if (src.value < parseInt(this.firstChild.value)){
                arr.splice(parseInt(this.firstChild.value) + 1, 0, src.text);
                arr.splice(src.value, 1);
                STATE.all_layers = arr

                arr = STATE.selected_layers.slice();
                arr.splice(parseInt(this.firstChild.value) + 1, 0, src.checked);
                arr.splice(src.value, 1);
                STATE.setSelectedLayers(arr)
            } 

            else{
                arr.splice(parseInt(this.firstChild.value), 0, src.text);
                arr.splice(parseInt(src.value) + 1, 1);
                STATE.all_layers = arr

                arr = STATE.selected_layers.slice();
                arr.splice(parseInt(this.firstChild.value), 0, src.checked);
                arr.splice(parseInt(src.value) + 1, 1);
                STATE.setSelectedLayers(arr)
            }
            console.log(STATE.all_layers)
            renderLayersList({
                'layersList':STATE.all_layers,
                'toggleList':STATE.selected_layers,
                'slectionHandler':STATE.handleSelection,
                'dropHandler':STATE.handleDropAlternative
            });
        }
        
        return false;
    },

    handleSelection: function(event){
        let arr = STATE.selected_layers.slice();
        arr[event.currentTarget.value] = event.currentTarget.checked;
        this.setAttribute('checked', this.checked)
        console.log(arr)
        STATE.setSelectedLayers(arr)
    },
}


fetch('http://localhost:8080/geoserver/nis/nis_bato/wms?version=2.0.0&request=GetCapabilities')
    .then(res => {return res.text()})
    .then(text => {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(text,"text/xml");
        return xmlDoc.childNodes[0].childNodes[3].childNodes[5]; })
    .then(xmlDoc => {
        var ft_arr = xmlDoc.getElementsByTagName('Layer')
        let layers = []
        for( let item of ft_arr){
            layer_name = 'nis:' + item.getElementsByTagName('Name')[0].innerHTML
            layers.push(layer_name);
        }
        STATE.all_layers = layers.slice(1);
        STATE.setSelectedLayers(Array(STATE.all_layers.length).fill(true)); 
        renderLayersList({
            'layersList':STATE.all_layers,
            'toggleList':STATE.selected_layers,
            'slectionHandler':STATE.handleSelection,
            'dropHandler':STATE.handleDropAlternative
        });
    })


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
    if (STATE.getSelectedLayerNames().length == 0){
        STATE.polygons.forEach(element => map.removeLayer(element))
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
        typeNames: multipleLayersUrlFormat(STATE.getSelectedLayerNames()),
        outputFormat: 'application/json',
        cql_filter: `DWITHIN(way,POINT(${point.x} ${point.y}),5,meters)`
    }

    request = url + '?' + createURLParams(params)

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
//map.on('zoom', drawLegend);
//map.on('move', drawLegend);