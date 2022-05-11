gmlUri = "http://www.opengis.net/gml"

function projectCoords(crs, latlngs){
    if (L.Util.isArray(latlngs)) {
        var result = [];
        latlngs.forEach(function (latlng) {
          result.push(projectCoords(crs, latlng));
        });
    
        return result;
      } else {
        return crs.projection.project(latlngs);
    }
};

function posNode(coord, xmlDoc) {
    let pos = xmlDoc.createElementNS(gmlUri, 'gml:pos');
    pos.setAttribute('srsDimension', '2');
    pos.appendChild(xmlDoc.createTextNode(coord.x + ' ' + coord.y));

    return pos
};

function posListNode(coords, close, xmlDoc) {
    var localcoords = [];
    coords.forEach(function (coord) {
      localcoords.push(coord.x + ' ' + coord.y);
    });
    if (close && coords.length > 0) {
      var coord = coords[0];
      localcoords.push(coord.x + ' ' + coord.y);
    }

    var posList = localcoords.join(' ');
    let posListXml = xmlDoc.createElementNS(gmlUri, 'gml:posList');
    posListXml.appendChild(xmlDoc.createTextNode(posList));

    return posListXml;
};

L.CircleMarker.include({
    toGml: function(crs, xmlDoc) {
      var node = xmlDoc.createElementNS(gmlUri, 'gml:Point');
      node.setAttribute('srsName', crs.code);
      node.appendChild(posNode(projectCoords(crs, this.getLatLng()), xmlDoc));
      return node;
    }
});

L.Marker.include({
    toGml: function (crs, xmlDoc) {
        var node = xmlDoc.createElementNS(gmlUri, 'gml:Point');
        node.setAttribute('srsName', crs.code);
        node.appendChild(posNode(projectCoords(crs, this.getLatLng()), xmlDoc));
        return node;
    }
});

L.Polygon.include({
    toGml: function (crs, xmlDoc, forceMulti) {
        var polygons = this.getLatLngs();
        var gmlPolygons = [];

        for (var i = 0; i < polygons.length; i++) {
        var polygonCoordinates = polygons[i];
        var flat = L.LineUtil.isFlat(polygonCoordinates);
        var node = xmlDoc.createElementNS(gmlUri, 'gml:Polygon');
        node.setAttribute('srsName', crs.code);
        node.setAttribute('srsDimension', 2);

        var linearRingNode = xmlDoc.createElementNS(gmlUri, 'gml:LinearRing');
        linearRingNode.setAttribute('srsDimension', 2);
        node.appendChild(xmlDoc.createElementNS(gmlUri, 'gml:exterior'))
            .appendChild(linearRingNode)
            .appendChild(posListNode(projectCoords(crs, flat ? polygonCoordinates : polygonCoordinates[0]), true, xmlDoc));

        if (!flat) {
            for (var hole = 1; hole < polygonCoordinates.length; hole++) {
            node.appendChild(xmlDoc.createElementNS(gmlUri, 'gml:interior'))
                .appendChild(linearRingNode)
                .appendChild(posListNode(projectCoords(crs, polygonCoordinates[hole]), true, xmlDoc));
            }
        }

        gmlPolygons.push(node);
        }

        if (gmlPolygons.length === 1 && !forceMulti) return gmlPolygons[0];

        // else make multipolygon
        var multi = xmlDoc.createElementNS(gmlUri,'gml:MultiSurface');
        multi.setAttribute('srsName', crs.code);
        multi.setAttribute('sersDimension', 2);
        var collection = multi.appendChild(xmlDoc.createElementNS(gmlUri,'gml:surfaceMembers'));
        for (var p = 0; p < gmlPolygons.length; p++) {
        collection.appendChild(gmlPolygons[p]);
        }

        return multi;
    }
});

L.Polyline.include({
    _lineStringNode: function (crs, latlngs, xmlDoc) {
        var node = xmlDoc.createElementNS(gmlUri, 'gml:LineString');
        node.setAttribute('srsName', crs.code);
        node.setAttribute('sersDimension', 2);
        node.appendChild(posListNode(projectCoords(crs, latlngs), false, xmlDoc));
        return node;
    },

    toGml: function (crs, xmlDoc, forceMulti) {
        var latLngs = this.getLatLngs();
        var gmlElements = [];

        if (L.LineUtil.isFlat(latLngs)) {
            gmlElements.push(this._lineStringNode(crs, latLngs, xmlDoc));
        } else {
        for (var i = 0; i < latLngs.length; i++) {
            gmlElements.push(this._lineStringNode(crs, latLngs[i], xmlDoc));
        }
        }

        if(gmlElements.length === 1 && !forceMulti) {
        return gmlElements[0];
        }

        var multi = xmlDoc.createElementNS(gmlUri, 'gml:MultiCurve');
        multi.setAttribute('srsName', crs.code);
        multi.setAttribute('sersDimension', 2);
        var collection = multi.appendChild(xmlDoc.createElementNS(gmlUri, 'gml:curveMembers'));
        for (var lines = 0; lines < gmlElements.length; lines++) {
        collection.appendChild(gmlElements[lines]);
        }

        return multi;
    }
});