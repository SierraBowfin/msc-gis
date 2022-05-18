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