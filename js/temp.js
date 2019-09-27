var polyline = {};

/**
 * Click start
 *
 */
function start(){
	var in1 = $("#in1")[0].value;
	var in2 = $("#in2")[0].value;
	if(in1 == null || in1.trim().length == 0){				
		$("#test").html("Please input polyline1");
		return;
	}	
	if(in2 == null || in2.trim().length == 0){				
		$("#test").html("Please input polyline2");
		return;
	}
	var str = polyline.lineIntersect(in1.trim(), in2.trim());
	$("#test").html(JSON.stringify(str));
}

/**
 * Round
 *
 * @param {Number} value
 * @returns {Number}
 */
function py2_round(value) {
    return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1);
}

/**
 * Encode
 *
 * @param {Number} current
 * @param {Number} previous
 * @param {Number} factor
 * @returns {String}
 */
function encode(current, previous, factor) {
    current = py2_round(current * factor);
    previous = py2_round(previous * factor);
    var coordinate = current - previous;
    coordinate <<= 1;
    if (current - previous < 0) {
        coordinate = ~coordinate;
    }
    var output = '';
    while (coordinate >= 0x20) {
        output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
        coordinate >>= 5;
    }
    output += String.fromCharCode(coordinate + 63);
    return output;
}

/**
 * Point to string
 *
 * @param {Array<Number:2>} point
 * @returns {String}
 */
function pointToString(point) {
	return point[0] + ";" + point[1];
}

/**
 * String to Array<Number:2>
 *
 * @param {String} str
 * @returns {Array<Number>}
 */
function stringToPoint(str) {
	var token = str.split(";");
	var lat = +token[0];
	var lng = +token[1];
	return [lat, lng];
}

/**
 * Distinct of two point
 *
 * @param {Array<Number>} p1
 * @param {Array<Number>} p1
 * @returns {Number}
 */
function distinct(p1, p2){
	return Math.pow(Math.pow(p1[0] - p2[0], 2) +  Math.pow(p1[1] - p2[1], 2), 0.5);
}

/**
 * Find common point of two polyline
 * Returns the common straight line of two lines
 *
 * @param {String} p1
 * @param {String} p1
 * @returns {String}
 */
polyline.lineIntersect = function(p1, p2) {
	var l1 = polyline.decode(p1);
	var l2 = polyline.decode(p2);
	var bk1 = [];
	var bk2 = [];
	l1.forEach(function(e){bk1.push(e);});
	l2.forEach(function(e){bk2.push(e);});
	var rs = {};
	var first = null;
	var firstOfFirst = null;
	var full = [];
	var add1 = [];
	var add2 = [];
	for(var i = 0; i < l1.length - 1; i++){
		var j = 0;
		while(j < bk2.length){
			var a = bk2[j];
			var b = l1[i];
			var c = l1[i + 1];
			if(polyline.isPointOnLine(a, b, c)){
				rs[pointToString(a)] = pointToString(b) + "|" + pointToString(c);
				full.push(pointToString(b) + "|" + pointToString(a) + "|" + pointToString(c));
				bk2.splice(j, 1);
				if(first == null){
					first = a;
					firstOfFirst = b;
				}
				add2.push(a);
			}else{
				j++;
			}
		}
	}
	for(var i = 0; i < l2.length - 1; i++){
		var j = 0;
		while(j < bk1.length){
			var a = bk1[j];
			var b = l2[i];
			var c = l2[i + 1];
			if(polyline.isPointOnLine(a, b, c)){
				rs[pointToString(a)] = pointToString(b) + "|" + pointToString(c);
				full.push(pointToString(b) + "|" + pointToString(a) + "|" + pointToString(c));
				bk1.splice(j, 1);
				if(first == null){
					first = a;
					firstOfFirst = b;
				}
				add1.push(a);
			}else{
				j++;
			}
		}
	}

	var groups = [];
	for(var i in full){
		var e = full[i];
		var t = e.split("|");
		var left = t[0];
		var middle = t[1];
		var right = t[2];
		var exist = false;
		for(var i in groups){
			var group = groups[i];
			if(group[middle] != null || group[left] != null || group[right] != null){
				group[middle] = true;
				group[middle] = true;
				group[middle] = true;
				exist = true;
			}
		}
		if(!exist){
			group = {};
			group[middle] = true;
			group[left] = true;
			group[right] = true;
			groups.push(group);
		}
	}

	if(firstOfFirst != null && rs[pointToString(firstOfFirst)] != null){
		first = firstOfFirst;
	}
	var listResult = [];
	var temp = [];
	// Điểm tồn tại của trong đường
	while(add1.length > 0 || add2.length > 0){
		if(add1.length > 0 && add2.length > 0){
			if(first[0] == add1[0][0] && first[1] == add1[0][1] && first[0] == add2[0][0] && first[1] == add2[0][1]){
				add1.splice(0,1);
				add2.splice(0,1);
			}else if(first[0] == add1[0][0] && first[1] == add1[0][1]){
				add1.splice(0,1);
			} else if(first[0] == add2[0][0] && first[1] == add2[0][1]){
				add2.splice(0,1);
			}
		} else if(add1.length > 0){
			if(first[0] == add1[0][0] && first[1] == add1[0][1]){
				add1.splice(0,1);
			} 
		} else if(add2.length > 0){
			if(first[0] == add2[0][0] && first[1] == add2[0][1]){
				add2.splice(0,1);
			}
		}
		var node = pointToString(first);
		var indexGroup = polyline.findNodeInGroup(groups, node);
		if(temp[indexGroup] == null){
			temp[indexGroup] = [];
		}
		temp[indexGroup].push(first);
		var p1 = [0, 0];
		var p2 = [0, 0];
		var exist = false;
		if(add1.length > 0){
			p1 = add1[0];
			exist = true;
		}
		if(add2.length > 0){
			p2 = add2[0];
			exist = true;
		}
		
		if(exist){
			var t1 = distinct(first, p1);
			var t2 = distinct(first, p2);
			if(t1 < t2){
				first = p1;
			}else{
				first = p2;
			}
		}		
	}
	for(var i in temp){
		var list = temp[i];
		listResult.push(polyline.encode(list));
	}
	return listResult;
}

/**
 * Lat lng to meters
 *
 * @param {Array{lat, lng}} p1
 * @param {Array{lat, lng}} p2
 * @returns {Integer} meters
 *
 */
polyline.latLngToMeter = function(p1, p2){
	var lat1 = p1[0];
	var lng1 = p1[1];
	var lat2 = p2[0];
	var lng2 = p2[1];
    var R = 6378137; // Bán kính trái đất đơn vị mét
    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lng2 * Math.PI / 180 - lng1 * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d; // meters
}

/**
 * Return index of groups content node
 *
 * @param {Array} groups
 * @param {String} node
 * @returns {Integer}
 *
 */
polyline.findNodeInGroup = function(groups, node){
	for(var i in groups){
		var group = groups[i];
		if(group[node]){
			return i;
		}
	}
	return -1;
}

/**
 * Find node in full array, if exist add into hash
 *
 * @param {Hash} hash
 * @param {Array} full
 * @param {String} node
 * @returns {Hash}
 *
 */
polyline.findFullAddHash = function(hash, full, node) {
	for(var i in full){
		var value = full[i];
		if(value.indexOf("|" + node + "|") > -1){
			var temp = value.split("|");
			hash[temp[0]] = true;
			hash[temp[1]] = true;
			hash[temp[2]] = true;
		}
	}
	return hash;
}

/**
 * Decodes to a [latitude, longitude] coordinates array.
 * This is adapted from the implementation in Project-OSRM.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Array}
 *
 */
polyline.decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, Number.isInteger(precision) ? precision : 5);
    while (index < str.length) {
        byte = null;
        shift = 0;
        result = 0;
        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += latitude_change;
        lng += longitude_change;
        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

/**
 * Encodes the given [latitude, longitude] coordinates array.
 *
 * @param {Array.<Array.<Number>>} coordinates
 * @param {Number} precision
 * @returns {String}
 */
polyline.encode = function(coordinates, precision) {
    if (!coordinates.length) { return ''; }

    var factor = Math.pow(10, Number.isInteger(precision) ? precision : 5);
    var output = encode(coordinates[0][0], 0, factor) + encode(coordinates[0][1], 0, factor);

    for (var i = 1; i < coordinates.length; i++) {
        var a = coordinates[i], b = coordinates[i - 1];
        output += encode(a[0], b[0], factor);
        output += encode(a[1], b[1], factor);
    }

    return output;
};

/**
 * Check a in middle b and c
 * If cos(bac) < anpha return true, else return false
 *
 * @param {Array[2]} a
 * @param {Array[2]} b
 * @param {Array[2]} c
 * @param {Number} anpha
 * @returns {Boolean}
 */
polyline.isPointOnLine = function(a, b, c, anpha = Math.PI/90){
	if (polyline.latLngToMeter(a, b) < 2.5 || polyline.latLngToMeter(a, c) < 2.5){
		return true;
	}
	var x1 = b[0] - a[0];
	var y1 = b[1] - a[1];
	var x2 = c[0] - a[0];
	var y2 = c[1] - a[1];
	var cos = (x1 * x2 + y1 * y2)/(Math.pow(Math.pow(x1, 2) + Math.pow(y1, 2), 0.5) * Math.pow(Math.pow(x2, 2) + Math.pow(y2, 2), 0.5));
	if(cos +  Math.cos(anpha) < 0){
		return true;
	}
	return false;
}
