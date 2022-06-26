function RenderLayerList(props){
    let layersDOM = document.getElementById('layers-list')
    while (layersDOM.firstChild) {
        layersDOM.removeChild(layersDOM.lastChild);
      }

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
        container.addEventListener('mouseenter', function(e) {props.filterMOverHandler(this, e)});

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
    chModeLabel.appendChild(document.createTextNode('selection'));

    layersControlDOM.appendChild(resetBtn);
    layersControlDOM.appendChild(chModeBtn);
    layersControlDOM.appendChild(chModeLabel);
}

function RenderFilterControl(props){

    let div = document.getElementById('layer-filter');
    while (div.firstChild) {
        div.removeChild(div.lastChild);
      }

    let dropdown = document.createElement('select');
    dropdown.setAttribute('id','filter-list');

    props.attributes.forEach(el => {
        let option = document.createElement('option');
        option.appendChild(document.createTextNode(el.name));
        dropdown.appendChild(option);
    });

    let filterButton = document.createElement('input');
    filterButton.setAttribute('type', 'button');
    filterButton.setAttribute('value', 'Filter');

    let clearButton = document.createElement('input');
    clearButton.setAttribute('type','button');
    clearButton.setAttribute('value', 'Clear');

    let filterText = document.createElement('input');
    filterText.setAttribute('type', 'text');
    filterText.setAttribute('id', 'filter-textbox');

    dropdown.addEventListener('change', e => {
        filterText.value = `${dropdown.options[dropdown.selectedIndex].value}`;
    })
    filterButton.addEventListener('click', function(e) { props.filterBtnClickHandler(this, e, filterText.value)});
    clearButton.addEventListener('click', function(e) { props.clearBtnClickHandler(this, e)});

    let divInter = document.createElement('div');
    divInter.appendChild(dropdown);
    divInter.appendChild(filterButton);
    divInter.appendChild(clearButton);
    div.append(divInter);
    div.appendChild(filterText);
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

function RenderSpatialQueryControl(props){
    let queryContainer = document.getElementById("spatial-query");
    while (queryContainer.firstChild) {
        queryContainer.removeChild(queryContainer.lastChild);
      }

    let container = document.createElement('form');

    let subjectA = document.createElement('select')
    subjectA.setAttribute('name', 'A');
    props.layers.forEach(el => {
        let op = document.createElement('option');
        op.appendChild(document.createTextNode(el.name.split(':')[1]));
        op.setAttribute('value', el.name);
        subjectA.appendChild(op);
    })

    let filterA = document.createElement('input');
    filterA.setAttribute('name', 'filterA');
    filterA.setAttribute('type', 'text');
    filterA.setAttribute('placeholder', 'Attribute filter A');

    let subjectB = document.createElement('select')
    subjectB.setAttribute('name', 'B');
    props.layers.forEach(el => {
        let op = document.createElement('option');
        op.appendChild(document.createTextNode(el.name.split(':')[1]));
        op.setAttribute('value', el.name);
        subjectB.appendChild(op);
    })
    
    let filterB = document.createElement('input');
    filterB.setAttribute('name', 'filterB');
    filterB.setAttribute('type', 'text');
    filterB.setAttribute('placeholder', 'Attribute filter B');

    let operation = document.createElement('select');
    operation.setAttribute('name', 'operation');
    CQL_SPATIAL_OPERATIONS.forEach(el => {
        let op = document.createElement('option');
        op.appendChild(document.createTextNode(el));
        op.setAttribute('value', el);
        operation.appendChild(op);
    });

    operation.addEventListener('change', event => {
        let target = event.target;
        operation = target.options[target.selectedIndex].value;
        console.log(operation);

        let text = document.getElementById('distance-text');
        let label = document.getElementById('distance-label');

        if (text !== null)
            text.parentNode.removeChild(text);
        
        if (text !== null)
            label.parentNode.removeChild(label);

        if (['DWITHIN', 'BEYOND'].includes(operation)){
            let distance = document.createElement('input');
            distance.setAttribute('type', 'text');
            distance.setAttribute('name', 'distance');
            distance.setAttribute('id', 'distance-text');

            let label = document.createElement('label');
            label.setAttribute('id', 'distance-label');
            label.appendChild(document.createTextNode('Distance: '));

            target.parentNode.appendChild(label);
            target.parentNode.appendChild(distance);
        }
    })

    let submit = document.createElement('input');
    submit.setAttribute('type', 'submit');
    let clear = document.createElement('button');
    clear.appendChild(document.createTextNode('Clear'));

    container.appendChild(document.createTextNode(
        `Select all objects of [Layer A] with [Filter A]
        that are in [Spatial Relation] with
        objects of [Layer B] wiht [Filter B]`));
    container.appendChild(document.createElement('br'));
    container.appendChild(document.createTextNode(`Layer A: `));
    container.appendChild(subjectA);
    container.appendChild(filterA);
    container.appendChild(document.createElement('br'));
    container.appendChild(document.createTextNode(`Spatial Relation: `));
    container.appendChild(operation);
    container.appendChild(document.createElement('br'));
    container.appendChild(document.createTextNode(`Layer B: `));
    container.appendChild(subjectB);
    container.appendChild(filterB);
    container.appendChild(submit);

    container.setAttribute('action', 'javascript:');
    container.addEventListener('submit', function(e) { props.submitHandler(this, e) });
    clear.addEventListener('click', function(e) { props.clearHandler(this, e)});

    queryContainer.appendChild(container);
    queryContainer.appendChild(clear);
}


function RenderTemporalQueryControl(props){
    let queryContainer = document.getElementById("temporal-query");
    while (queryContainer.firstChild) {
        queryContainer.removeChild(queryContainer.lastChild);
      }

    let container = document.createElement('form');

    let subjectA = document.createElement('select')
    subjectA.setAttribute('name', 'A');
    props.layers.forEach(el => {
        let op = document.createElement('option');
        op.appendChild(document.createTextNode(el.name.split(':')[1]));
        op.setAttribute('value', el.name);
        subjectA.appendChild(op);
    });

    let filterA = document.createElement('input');
    filterA.setAttribute('name', 'filterA');
    filterA.setAttribute('type', 'text');
    filterA.setAttribute('placeholder', 'Attribute filter');

    let distance = document.createElement('input');
    distance.setAttribute('type', 'number');
    distance.setAttribute('name', 'distance');
    distance.setAttribute('id', 'distance-text-temporal');
    distance.setAttribute('value', 5);

    let operation = document.createElement('select');
    operation.setAttribute('name', 'operation');
    CQL_TEMPORAL_OPERATIONS.name.forEach(el => {
        let op = document.createElement('option');
        op.appendChild(document.createTextNode(el));
        op.setAttribute('value', el);
        operation.appendChild(op);
    });

    operation.addEventListener('change', event => {
        let target = event.target;
        domain = CQL_TEMPORAL_OPERATIONS.domain[target.selectedIndex];

        let time = document.getElementById('time-datetime-picker');
        let timePeriodA = document.getElementById('timePeriodA-datetime-picker');
        let timePeriodB = document.getElementById('timePeriodB-datetime-picker');

        if (time !== null)
            time.parentNode.removeChild(time);

        if (timePeriodA !== null){
            timePeriodA.parentNode.removeChild(timePeriodA);
            timePeriodB.parentNode.removeChild(timePeriodB);
        }

        if (domain === 'time'){
            let dateDiv = document.createElement('input');
            dateDiv.setAttribute('type', 'text');
            dateDiv.setAttribute('placeholder', 'Select date & time');
            dateDiv.setAttribute('id', 'time-datetime-picker');
            let dateA = flatpickr(dateDiv,{
                enableTime: true,
                defaultDate: "2013-08-09",
            });

            target.parentNode.removeChild(submit);
            target.parentNode.appendChild(dateDiv);
            target.parentNode.appendChild(submit);
        }

        if (domain === 'timePeriod'){
            let dateDivA = document.createElement('input');
            dateDivA.setAttribute('type', 'text');
            dateDivA.setAttribute('placeholder', 'Select start date & time');
            dateDivA.setAttribute('id', 'timePeriodA-datetime-picker');
            let dateA = flatpickr(dateDivA,{
                enableTime: true,
                defaultDate: "2013-08-09",
            });

            let dateDivB = document.createElement('input');
            dateDivB.setAttribute('type', 'text');
            dateDivB.setAttribute('placeholder', 'Select end date & time');
            dateDivB.setAttribute('id', 'timePeriodB-datetime-picker');
            let dateB = flatpickr(dateDivB,{
                enableTime: true,
                defaultDate: "2013-08-09",
            });

            
            target.parentNode.removeChild(submit);
            target.parentNode.appendChild(dateDivA);
            target.parentNode.appendChild(dateDivB);
            target.parentNode.appendChild(submit);
        }
    })

    let speed = document.createElement('input');
    speed.setAttribute('type', 'text');
    speed.setAttribute('placeholder', 'Attribute filter')
    speed.setAttribute('name', 'filterV');

    let submit = document.createElement('input');
    submit.setAttribute('type', 'submit');

    let clear = document.createElement('button');
    clear.appendChild(document.createTextNode('Clear'));
    clear.addEventListener('click', function(e) { props.clearHandler(this, e)});

    container.setAttribute('action', 'javascript:');
    container.addEventListener('submit', function(e) { props.submitHandler(this, e) });

    container.appendChild(document.createTextNode(
        `Select all objects of [Layer] with [Filter] 
        that is within [Distance] of vehicle path
        within a certain [Period] of time`));
    container.appendChild(document.createElement('br'));
    container.appendChild(document.createTextNode('Layer: '));
    container.appendChild(subjectA);
    container.appendChild(filterA);
    container.appendChild(document.createElement('br'));
    container.appendChild(document.createTextNode('Distance(m): '));
    container.appendChild(distance);
    container.appendChild(document.createElement('br'));
    container.appendChild(document.createTextNode('Vehicle: '));
    container.appendChild(speed);
    container.appendChild(operation);
    container.appendChild(submit);

    queryContainer.appendChild(container);
    queryContainer.appendChild(clear);

    let eventChange = new Event('change');
    operation.dispatchEvent(eventChange); 
}