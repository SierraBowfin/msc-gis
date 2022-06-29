const proj = L.CRS.EPSG3857;
const wfsUri = 'http://www.opengis.net/wfs'

class GeoLayer {
    constructor(name, selected){
        this.name = name;
        this.selected = selected;
        this.cql_filter = 'INCLUDE';
    }
}

class BufferedLayer {
    constructor(url, map, options){
        this.url = url
        this.layers = new Array(2);
        this.layers[0] = L.tileLayer.wms(url, options);
        this.layers[0].addTo(map);
        this.layers[1] = L.tileLayer.wms(url, options);
        this.layers[1].addTo(map);
        this.layers[1].bringToFront();
    }

    setParams(options) {
        this.layers[0] = this.layers[1];
        this.layers[0].bringToFront();
        this.layers[1].setParams(options, false);
        this.layers[1].on('load', e => {
            this.layers[1].bringToFront();
        })
    }
}

class App{

    constructor(url){
        this.url = url;
        this.map = L.map('map').setView([43.32, 21.88], 13);
        this.wms_layer = 'nis_bato';
        this.wmsBufferedLayer = null;
        this.layers = [];
        this.currentLayer = '0';
        this.mode = 'Selection';
        this.modeTransistions = {
            'Selection': 'Edit',
            'Edit': 'Selection'
        };
        this.clickedItems = [];
        this.queryItems = new L.FeatureGroup();
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
            if(this.drawControl !== undefined)
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
        cql_filter = '';
        let filters = this.selectedLayerFilters;
        filters.forEach(el => cql_filter += el + ';')
        cql_filter = cql_filter.slice(0, -1);

        let options = {
            layers: this.selectedLayersNames,
            format: 'image/png',
            transperent: true,
            cql_filter: cql_filter,
            v: new Date().valueOf().toString(),
            }

        if (this.wmsBufferedLayer === null)
            this.wmsBufferedLayer = new BufferedLayer("http://localhost:8080/geoserver/nis/wms", this.map, options);
        else
            this.wmsBufferedLayer.setParams(options);

        console.log(this.map._layers)
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

        const params = {
            service:'wfs',
            version:'2.0.0',
            request: 'Transaction',
        }
        
        const request = this.url + '/wfs?' + createURLParams(params)

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
                if (this.layers[this.currentLayer].drawnItems.length > 0) {
                    drawn = this.layers[this.currentLayer].drawnItems.getLayers()[0];
                    drawn.setStyle({
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0.5,
                    })
                }
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
                'filterMOverHandler': this.handleFilterMOver.bind(this),
            });
        }
        
        return false;
    }

    handleClearBtnClick(caller, event) {
        this.layers.forEach(el => {
            el.cql_filter = 'INCLUDE';
        });

        document.getElementById('filter-textbox').value = '';

        this.loadLayers();
    }

    handleFilterMOver(caller, event){
        let ind = caller.firstChild.value;
        caller.setAttribute('title', this.layers[ind].cql_filter);
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
        
        this.loadLayers();
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
    
        const request = this.url + '/wfs?' + createURLParams(params)
    
        fetch(request)
            .then(response => response.json())
            .then(data => this.draw_first_way(data, e))
            .then(data => this.clickedItems.forEach(element => element.openPopup(e.latlng)))
    }

    handleQueryClear(caller, e) {
        this.map.removeLayer(this.queryItems);
        this.queryItems.clearLayers();
    }

    handleTemporalQuerySubmit(caller, e) {
        console.log(caller);

        let A = caller.getElementsByTagName('select')['A'];
        A = A.options[A.selectedIndex].value;

        let operation = caller.getElementsByTagName('select')['operation'];
        let domain = CQL_TEMPORAL_OPERATIONS.domain[operation.selectedIndex];
        operation = operation.options[operation.selectedIndex].value;

        let time = '';
        if (domain === 'time') {
            time = document.getElementById('time-datetime-picker')._flatpickr;
            time = time.formatDate(time.selectedDates[0], 'Y-d-mTH:i:S');
            console.log(time);
        }
        if (domain === 'timePeriod') {
            let timeA = document.getElementById('timePeriodA-datetime-picker')._flatpickr;
            let timeB = document.getElementById('timePeriodB-datetime-picker')._flatpickr;
            timeA = timeA.formatDate(timeA.selectedDates[0], 'Y-d-mTH:i:S');
            timeB = timeB.formatDate(timeB.selectedDates[0], 'Y-d-mTH:i:S');
            time = `${timeA} / ${timeB}`;
        }

        let filterV = caller.getElementsByTagName('input')['filterV'].value;
        let filterA = caller.getElementsByTagName('input')['filterA'].value;
        let distance = document.getElementById('distance-text-temporal').value;

        if (filterV == '')
            filterV = 'INCLUDE';
        if (filterA == '')
            filterA = 'INCLUDE';

        let cql_filter = `${filterA} AND DWITHIN(way, collectGeometries(queryCollection('nis:avl_datapoints', 'way', 'dtime ${operation} ${time} AND ${filterV}')), ${distance}, meters)`

        const params = {
            service:'wfs',
            version:'2.0.0',
            request: 'GetFeature',
            typeNames: A,
            outputFormat: 'application/json',
            cql_filter: cql_filter
        }

        console.log(params);
    
        const request = this.url + '/wfs?' + createURLParams(params)
    
        console.log(request)
        fetch(request)
            .then(response => {
                if (!response.ok){
                    alert(`BadRequest: ${response.status}`);
                    throw new Error(`BadRequest: ${response.status}`)
                }
                alert(`Response status: ${response.status}, processing`)
                return response.json();
            })
            .then(data => this.drawAllWays(data, e));
    }

    handleSpatialQuerySubmit(caller, e) {
        console.log(caller);
        console.log(caller.getElementsByTagName('select'));

        let A = caller.getElementsByTagName('select')['A'];
        A = A.options[A.selectedIndex].value;

        let B = caller.getElementsByTagName('select')['B'];
        B = B.options[B.selectedIndex].value;
        
        let operation = caller.getElementsByTagName('select')['operation'];
        operation = operation.options[operation.selectedIndex].value;

        let filterA = caller.getElementsByTagName('input')['filterA'].value;
        let filterB = caller.getElementsByTagName('input')['filterB'].value; 

        if (filterB == '')
            filterB = 'INCLUDE';
        if (filterA == '')
            filterA = 'INCLUDE';

        let distance = document.getElementById('distance-text');

        let cql_filter = '';
        if (distance !== null) {
            distance = distance.value;
            cql_filter = `${filterA} AND ${operation}(way,collectGeometries(queryCollection('${B}', 'way', '${filterB}')), ${distance}, meters)`
        }
        else {
            cql_filter = `${filterA} AND ${operation}(way,collectGeometries(queryCollection('${B}', 'way', '${filterB}')))`;
        }

        const params = {
            service:'wfs',
            version:'2.0.0',
            request: 'GetFeature',
            typeNames: A,
            outputFormat: 'application/json',
            cql_filter: cql_filter
        }
    
        const request = this.url + '/wfs?' + createURLParams(params)
    
        console.log(request)
        fetch(request)
            .then(response => {
                if (!response.ok){
                    alert(`BadRequest: ${response.status}`);
                    throw new Error(`BadRequest: ${response.status}`)
                }
                alert(`Response status: ${response.status}, processing`)
                return response.json();
            })
            .then(data => this.drawAllWays(data, e));
    }

    drawAllWays(obj, e) {
        this.map.removeLayer(this.queryItems);
        this.queryItems.clearLayers();
    
        console.log(obj)
        if (obj.features.length == 0) return;

        obj.features.forEach(feature => {
            let geom = reproject_geometry(feature.geometry.coordinates, feature.geometry.type);
            this.queryItems.addLayer(
                createFeatureRepresentation(geom, feature.geometry.type, {color:'green', fillColor: "seagreen"})
            );
        });

        this.map.addLayer(this.queryItems);
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
                    'filterMOverHandler': this.handleFilterMOver.bind(this),
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
            
                const request = this.url + '/wfs?' + createURLParams(params)
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
                        RenderFilterControl({
                            'filterBtnClickHandler': this.handleFilterButtonClick.bind(this),
                            'attributes': this.layers[this.currentLayer].attributes, 
                            'clearBtnClickHandler': this.handleClearBtnClick.bind(this),
                        });

                        RenderSpatialQueryControl({
                            'layers': this.layers,
                            'submitHandler': this.handleSpatialQuerySubmit.bind(this),
                            'clearHandler': this.handleQueryClear.bind(this),
                        });

                        RenderTemporalQueryControl({
                            'layers': this.layers,
                            'clearHandler': this.handleSpatialQuerySubmit.bind(this),
                            'submitHandler': this.handleTemporalQuerySubmit.bind(this),
                        })
                    });
            });
    }
}

let app = new App('http://localhost:8080/geoserver/nis')

