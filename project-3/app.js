const proj = L.CRS.EPSG3857;
const wfsUri = 'http://www.opengis.net/wfs'

class GeoLayer {
    constructor(name, selected){
        this.name = name;
        this.selected = selected;
        this.cql_filter = 'INCLUDE';
    }
}

class App{

    constructor(url){
        this.url = url;
        this.map = L.map('map').setView([43.32, 21.88], 13);
        this.wms_layer = 'nis_bato';
        this.layers = [];
        this.currentLayer = '0';
        this.mode = 'Selection';
        this.modeTransistions = {
            'Selection': 'Edit',
            'Edit': 'Selection'
        };
        this.clickedItems = []
        this.mode = 'selection'

        this.getCapabilities();

        RenderLayerControls({
            'resetBtnClickHandler': this.handleResetBtnClick.bind(this),
            'chModeBtnHandler': this.handleChMode.bind(this),
        });

        let mapClickHandler = this.handleMapClick.bind(this);
        this.map.on('click', function(e) { mapClickHandler(this, e)});
    }

    get selectedLayersNames() {
        let layerNames = this.layers.filter((item) => item.selected);
        return layerNames.map(value => value.name);
    }

    get selectedLayerFilters() {
        let layerFilters = this.layers.filter(item => item.selected);
        return layerFilters.map(value => value.cql_filter);
    }

    setLayers(newLayers){
        this.layers = newLayers;
        this.loadLayers();
    }

    setMode(newMode) {

        this.mode = newMode;
        let modelLabel = document.getElementById('layers-mode-label');
        modelLabel.innerHTML = this.mode;
        this.map.off('click');

        if (this.mode === 'selection'){
            this.map.removeLayer(this.layers[this.currentLayer].drawnItems);
            this.map.removeControl(this.drawControl);
            RenderAddForm({
                'attributes': null
            });

            let mapClickHandler = this.handleMapClick.bind(this);
            this.map.on('click', function(e) { mapClickHandler(this, e)});
            this.map.off(L.Draw.Event.CREATED);

            return;
        }

        if(this.mode === 'edit'){
            this.map.addLayer(this.layers[this.currentLayer].drawnItems);
            this.drawControl = this.createDrawControl();
            RenderAddForm({
                'attributes':this.layers[this.currentLayer].attributes,
                'submitHandler': this.handleSubmit.bind(this),
            })

            this.map.addControl(this.drawControl);
            let drawCreatedHandler = this.handleDrawCreated.bind(this)
            this.map.on(L.Draw.Event.CREATED, function(e) { drawCreatedHandler(this, e) })
            return;
        }
    }

    createDrawControl() {
        const currentLayer = this.layers[this.currentLayer]
        let draw = {
            polygon: {
                allowIntersection: false,
                showArea: true,
            },
            polyline: {
                allowIntersection: false,
                showLength:true,
            },
            marker: {},
            circle: {},
            circlemarker: {},
            rectangle: {},
        };

        for(let prop in draw){
            if (!currentLayer.type.includes(prop))
                draw[prop] = false
        }

        let ctrl = new L.Control.Draw({
            draw: draw,
            edit: {
                featureGroup: this.layers[this.currentLayer].drawnItems,
                allowIntersection: false,
            }, 
        });
        return ctrl;
    } 

    loadLayers(cql_filter) {
        if (cql_filter === undefined){
            console.log(this.layers)
            cql_filter = '';
            let filters = this.selectedLayerFilters;
            filters.forEach(el => cql_filter += el + ';')
            cql_filter = cql_filter.slice(0, -1);
        }
        console.log(cql_filter)

        let options = {
            layers: this.selectedLayersNames,
            format: 'image/png',
            transperent: true,
            cql_filter: cql_filter,
        }

        let wms_tileLayer = L.tileLayer.wms("http://localhost:8080/geoserver/nis/wms", options);
        wms_tileLayer.addTo(this.map)
    }

    handleSubmit(caller, event) {
        let arr = Array.from(event.srcElement.elements).slice(0,-1);
        let attArray = arr.map(el => {
            let ret = {};
            ret.attributeName= el.name;
            ret.attributeValue = el.value
            return ret;
        })

        let xml = createPostXML(this, attArray, 0);
        console.log(xml)

        const params = {
            service:'wfs',
            version:'2.0.0',
            request: 'Transaction',
        }
        
        const request = this.url + '?' + createURLParams(params)

        fetch(request, {
            method: 'POST',
            body: (new XMLSerializer()).serializeToString(xml)
        })
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => console.log(data))
            .then(() => {
                let drawn = this.layers[this.currentLayer].drawnItems.getLayers()[0];
                drawn.remove();
                drawn.removeFrom(this.layers[this.currentLayer].drawnItems);
                drawn = this.layers[this.currentLayer].drawnItems.getLayers()[0];
                drawn.setStyle({
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                })
            })
            .then(this.loadLayers());
    }

    handleDrop(dragDstEl, event) {
        event.stopPropagation();
        event.target.classList.remove('over'); 
        
        if (dragSrcEl !== dragDstEl) {
            let src = JSON.parse(event.dataTransfer.getData('text/plain'));
            let arr = this.layers.slice();
            const layerChange = this.layers.filter(el => src.text === el.name)[0];

            if (src.value < parseInt(dragDstEl.firstChild.value)){
                arr.splice(parseInt(dragDstEl.firstChild.value) + 1, 0, layerChange);
                arr.splice(src.value, 1);
                this.setLayers(arr)
            } 

            else{
                arr.splice(parseInt(dragDstEl.firstChild.value), 0, layerChange);
                arr.splice(parseInt(src.value) + 1, 1);
                this.setLayers(arr);
            }

            switch(this.currentLayer){
                case src.value:
                    this.currentLayer = dragDstEl.firstChild.value;
                    break;
                case dragDstEl.firstChild.value:
                    this.currentLayer = src.value;
                    break
            }

            RenderLayerList({
                'layerList':this.layers,
                'currentLayer':this.currentLayer,
                'slectionHandler':this.handleSelection.bind(this),
                'dropHandler':this.handleDrop.bind(this),
                'radioClickHandler':this.handleRadioClick.bind(this),
            });
        }
        
        return false;
    }

    handleSelection(checkbox, event) {
        let newLayers = this.layers.slice()
        newLayers[event.currentTarget.value].selected = event.currentTarget.checked;
        checkbox.setAttribute('checked', this.checked)
        this.setLayers(newLayers)
    }

    handleResetBtnClick(button, event) {
        this.setMode("selection");
        this.currentLayer = '0';
        this.getCapabilities();
    }

    handleRadioClick(radio, event) {
        if (this.mode === 'edit') {
            event.preventDefault();
            return false;
        }
        this.currentLayer = event.currentTarget.value
        return true;
    }

    handleDrawCreated(caller, event){
        let new_layer = event.layer;
        if (this.layers[this.currentLayer].drawnItems.getLayers().length === 0) {
            console.log('FIRST');
            new_layer.setStyle({
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5,
            });
        }
        this.layers[this.currentLayer].drawnItems.addLayer(new_layer);
    }

    handleChMode(caller, event) {
        this.clickedItems.forEach(element =>
            this.map.removeLayer(element));
        this.map.closePopup();

        if (this.mode === 'selection'){
            this.setMode('edit');
            return;
        }

        if (this.mode === 'edit'){
            this.setMode('selection');
            return;
        }
    }

    handleFilterButtonClick(caller, event) {
        let filter = arguments[2];
        if (filter === '')
            filter = 'INCLUDE';

        this.layers[this.currentLayer].cql_filter = filter;
        
        let resFilter = ''
        this.layers.filter(el => el.selected).forEach(el => {
            resFilter += el.cql_filter + ';'
        })
        
        resFilter = resFilter.slice(0, -1);
        this.loadLayers(resFilter);
    }

    handleMapClick(caller, e) {
        const selectedLayerNames = this.selectedLayersNames
        if (selectedLayerNames.length == 0){
            this.clickedItems.forEach(element => map.removeLayer(element))
            console.log('No Layers Added')
            return
        }
    
        const point = proj.project(e.latlng)
        console.log(point)
        
        const params = {
            service:'wfs',
            version:'2.0.0',
            request: 'GetFeature',
            typeNames: multipleLayersUrlFormat(this.selectedLayersNames),
            outputFormat: 'application/json',
            cql_filter: `DWITHIN(way,POINT(${point.x} ${point.y}),5,meters)`
        }
    
        const request = this.url + '?' + createURLParams(params)
    
        fetch(request)
            .then(response => response.json())
            .then(data => this.draw_first_way(data, e))
            .then(data => this.clickedItems.forEach(element => element.openPopup(e.latlng)))
    }

    draw_first_way(obj, e){
        this.clickedItems.forEach(element => this.map.removeLayer(element))
        this.clickedItems = []
    
        console.log(obj)
        if (obj.features.length == 0) return;
    
        // Just the first geometry
        const feature = obj.features[obj.features.length - 1]
        const geom = reproject_geometry(feature.geometry.coordinates, feature.geometry.type);
        const table_html = createAttributeTable(feature.properties)
    
        L.popup()
            .setLatLng(e.latlng)
            .setContent(table_html)
            .openOn(this.map);
    
        this.clickedItems.push(
            createFeatureRepresentation(geom, feature.geometry.type).addTo(this.map));
    }

    getCapabilities() {
        fetch('http://localhost:8080/geoserver/nis/nis_bato/wms?version=2.0.0&request=GetCapabilities')
            .then(res => {return res.text()})
            .then(text => {
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(text,"text/xml");
                return xmlDoc.childNodes[0].childNodes[3].childNodes[5]; })
            .then(xmlDoc => {
                var ft_arr = xmlDoc.getElementsByTagName('Layer')
                let layers = []

                for( let item of ft_arr){
                    let layerName = 'nis:' + item.getElementsByTagName('Name')[0].innerHTML 
                    layers.push(new GeoLayer(layerName, true));
                }
                this.setLayers(layers.slice(1));

                RenderLayerList({
                    'layerList':this.layers,
                    'currentLayer':this.currentLayer,
                    'slectionHandler':this.handleSelection.bind(this),
                    'dropHandler':this.handleDrop.bind(this),
                    'radioClickHandler':this.handleRadioClick.bind(this),
                });

                this.layers.forEach(layer => {
                    layer.drawnItems = new L.FeatureGroup();
                });
                return this.layers.map(layer => layer.name)
            })
            .then(layers => {
                const params = {
                    service:'wfs',
                    version:'2.0.0',
                    request: 'DescribeFeatureType',
                    typeNames: layers,
                    outputFormat: 'application/json',
                }
            
                const request = this.url + '?' + createURLParams(params)
                fetch(request)
                    .then(response => response.json())
                    .then(data=> {
                        data.featureTypes.forEach((el, index) => {
                            let way = el.properties.filter(el => el.name === 'way');
                            this.layers[index].type = mapGmlType2LeafletType(way[0].localType);
                            this.layers[index].attributes = el.properties.filter(el => el.name).slice(0,-2);
                        })
                    })
                    .then(() => {
                        console.log(this.layers[this.currentLayer])
                        RenderFilterControl({
                            'filterBtnClickHandler': this.handleFilterButtonClick.bind(this),
                            'attributes': this.layers[this.currentLayer].attributes,
                        });
                    });
            });
    }
}

app = new App('http://localhost:8080/geoserver/nis/wfs')