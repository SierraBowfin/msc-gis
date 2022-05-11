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

function RenderLayerList(props){
    let layersDOM = document.getElementById('layers-list')
    while (layersDOM.firstChild) {
        layersDOM.removeChild(layersDOM.lastChild);
      }

    console.log(props.layerList.map(el => el.selected))
    props.layerList.forEach((layer, idx) => {
        let listItem = document.createElement('li');

        let inputEl = document.createElement('input');
        inputEl.setAttribute('type', 'checkbox');
        inputEl.setAttribute('value', idx);
        inputEl.setAttribute('checked', layer.selected);
        inputEl.checked = layer.selected;
        inputEl.addEventListener('change', function(event){
            props.slectionHandler(this, event)
        });

        selector = document.createElement('input');
        selector.setAttribute('type', 'radio');
        selector.setAttribute('name', 'sel_layer');
        selector.setAttribute('value', idx);
        selector.checked = idx === parseInt(props.currentLayer);
        selector.addEventListener('click',function(e){ return props.radioClickHandler(this,e)});
        
        container = document.createElement('div');
        container.setAttribute('class','listElement');
        container.setAttribute('draggable', true)
        container.appendChild(inputEl);
        container.appendChild(selector);
        container.appendChild(document.createTextNode(layer.name));
        

        container.addEventListener('dragstart', function (event) {
            event.target.style.opacity=0.5;
            dragSrcEl = this;

            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', JSON.stringify({
                'value':this.firstChild.value,
                'checked':this.firstChild.checked,
                'text':this.childNodes[2].textContent}));
        }); 
        container.addEventListener('dragend', function (event) {
            event.target.style.opacity=1;
        });
        container.addEventListener('dragenter', function (event) {
            event.target.classList.add('over');
        });
        container.addEventListener('dragleave', function (event) {
            event.target.classList.remove('over');
        });
        container.addEventListener('dragover', function (event) {
            event.preventDefault();
            return false;
        });
        container.addEventListener('drop', function(e) {props.dropHandler(this, e)});

        listItem.appendChild(container);
        layersDOM.appendChild(listItem);
    })
}

function RenderLayerControls(props){

    let layersControlDOM = document.getElementById('layers-controls')

    let resetBtn = document.createElement('button');
    resetBtn.setAttribute('id', 'layers-reset');
    resetBtn.setAttribute('class', 'layersList');
    resetBtn.innerHTML = 'Reset'
    resetBtn.addEventListener('click', function(e) {props.resetBtnClickHandler(this, e)});

    let chModeBtn = document.createElement('button')
    chModeBtn.setAttribute('id', 'layers-mode');
    chModeBtn.setAttribute('class', 'layersList');
    chModeBtn.innerHTML = 'Change Mode';
    chModeBtn.addEventListener('click', function(e) {props.chModeBtnHandler(this, e)});

    let chModeLabel = document.createElement('label')
    chModeLabel.setAttribute('for', chModeBtn.getAttribute('id'));
    chModeLabel.setAttribute('id', 'layers-mode-label');

    layersControlDOM.appendChild(resetBtn);
    layersControlDOM.appendChild(chModeBtn);
    layersControlDOM.appendChild(chModeLabel);
}

function RenderAddForm(props) {

    if (props.attributes === null){
        let formDiv = document.getElementById('formDiv');
        while (formDiv.firstChild){
            formDiv.removeChild(formDiv.lastChild)
        }
        formDiv.removeAttribute('class')
        formDiv.replaceWith(formDiv.cloneNode(true));
        return
    }
    
    let formDiv = document.getElementById('formDiv');
    formDiv.setAttribute('class', 'formDivStyle');
    formDiv.setAttribute('action', 'javascript:');
    formDiv.addEventListener('submit', function(e) { props.submitHandler(this, e) });
    props.attributes.forEach(attribute => {

        let textBox = document.createElement('input')
        textBox.setAttribute('type', 'text');
        textBox.setAttribute('id', attribute.name);
        textBox.setAttribute('name', attribute.name);

        let label = document.createElement('label');
        label.setAttribute('for', textBox.getAttribute('id'));
        label.innerHTML = attribute.name;
        
        formDiv.appendChild(textBox);
        formDiv.appendChild(label);
        formDiv.appendChild(document.createElement('br'));
    });

    let submit = document.createElement('input');
    submit.setAttribute('type', 'submit');
    formDiv.appendChild(submit) 
}