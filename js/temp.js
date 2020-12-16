var polyline = {};
var lineInput = null;
var lineResult = null;
var markers = [];

/**
 * Click start
 *
 */
function clickStart(){
	if(lineInput != null){
		lineInput.setMap(null);
	}
	if(lineResult != null){
		lineResult.setMap(null);
	}
	if(markers.length > 0){
		markers.forEach(e=> e.setMap(null));
	}
	var in1 = $("#in1")[0].value;
	var in2 = $("#in2")[0].value;
	if(in1 == null || in1.trim().length == 0){				
		$("#test").html("Nhập polyline cần tính");
		return;
	}	
	if(in2 == null || in2.trim().length == 0){				
		$("#test").html("Nhập vào khoảng cách số km");
		return;
	}
	var k = +in2.trim();
	var str = start(in1.trim(), k);	
	var temp = polyline.encode(str, 5);
	$("#test").html(temp);
	//tạo đối tượng polyline từ PolylineOptions
	var t1 = polyline.decode(in1.trim(), 5);
	lineInput = new map4d.Polyline({
		path: switchLatLng(t1),
		strokeColor: "#ff0000",
		strokeOpacity: 1.0,
        style: "dotted",
		strokeWidth: 4});
		
	var rs = switchLatLng(str);
	lineInput.setMap(map);
	lineResult = new map4d.Polyline({
		path: rs,
		strokeColor: "#0000FF",
		strokeOpacity: 1.0,
		strokeWidth: 2});
	lineResult.setMap(map);
	var i = 0;
	rs.forEach(e=>{
		let marker = new map4d.Marker({
		  title: i + "",
		  position: {lat: e[1], lng:e[0]},
		})
		marker.setMap(this.map)
		markers.push(marker);
		i++;
	});
	
}

function switchLatLng(arr){
	var rs = [];
	arr.forEach(e=>{ var a = [e[1],e[0]]; rs.push(a)});
	return rs;
}

/**
* Lấy danh sách các điểm với khoảng cách k cho trước
* @param {String} arr
* @param {Number} k là khoảng cách tính bằng km* 
* @returns {Array<Array<Number>>} trả về danh sách các điểm
*/
function start(arr, k){
	var points = polyline.decode(arr, 5);
	var r = meterToDegreeLatitude(k * 1000);
	var list = getListPoints(points, r);
	return list;
}

/**
* Lấy danh sách các điểm với khoảng cách r cho trước
* @param {Array<Array<Number>>} points là danh sách array cần tính
* @param {Number} r là khoảng cách tính bằng radius
* @returns {Array<Array<Number>>} trả về danh sách các điểm
*/
function getListPoints(points, r){
	var l = 0.0;
	var i = 0;
	var rs = [];
	var dis = r;
	while(i < points.length - 1){
		l += distinct(points[i], points[i+1]);
		if(l >= r){
			while(l >= r){
				var t = getPoint(points[i], points[i+1], dis);
				points[i][0] = t[0];
				points[i][1] = t[1];
				rs.push(t);
				l = l - r;
				dis = r;
			}
			dis = r - l;
		}
		i++;
	}
	return rs;
}

/**
* Chuyển đổi đơn vị độ dài ra radius
* @param {Number} meter là khoảng cách tính bằng meter 
* @returns {Number} trả về khoảng cách đơn vị radius
*/
function meterToDegreeLatitude(meter){
	var R = 6378137;
	// Radius in meter of each
	var earthRadiusInMeters = R;
	// Ciruference half each
	var halfEachCircuferenceInMeter = earthRadiusInMeters * Math.PI;
	// Meter per degree latitude
	var metersPerDegreeLatitude = halfEachCircuferenceInMeter / 180;
	// Result meter to degree latitude
	var result = meter / metersPerDegreeLatitude;
	return result;
}

/**
* Lấy điểm t nằm giữa p1 và p2 sao cho từ p1 đến t là bằng dis
* @param {Array<Number>} p1
* @param {Array<Number>} p2
* @param {Number} dis
* @returns {Array<Number>} trả về điểm t
*/
function getPoint(p1, p2, dis){
	var a = dis;
	var t = distinct(p1, p2);
	var b = t - a;
	var x1 = p1[0];
	var y1 = p1[1];
	var x2 = p2[0];
	var y2 = p2[1];
	var x = 0;
	var y = 0;
	if(dis == 0){
		return p1;
	}else if(dis == t){
		return p2;
	}else if(x1 == x2 && y1 == y2){
		return p1;
	}else if(x1 == x2){
		x = x1;
		if(y2 > y1){
			y = y1 + a;
		}else{
			y = y1 - a;
		}
	}else if(y1 == y2){
		y = y1;
		if(x2 > x1){
			x = x1 + a;
		}else{
			x = x1 - a;
		}
	}else{
		// Giải phương trình đường tròn giao với đường thẳng
		// (x-x1)^2 + (y-y1)^2 = a^2
		// (y1-y2)(x-x1) + (x2-x1)(y-y1) = 0
		// Đặt X = x-x1, Y = y-y1
		// X^2 + Y^2 = a^2 (1)
		// (y1-y2)X + (x2-x1)Y = 0 => X = ((x1-x2)/(y1-y2))*Y
		var t = (x1-x2)/(y1-y2);
		// Thay vào phương trình (1)
		// t^2*Y^2 + Y^2 = a^2
		// Nghiệm thứ 1
		var Y = a/Math.pow(t*t + 1, 0.5);
		var X = ((x1-x2)/(y1-y2)) * Y;
		var x = X + x1;
		var y = Y + y1;
		if(isMiddle(x1, x2, x) && isMiddle(y1, y2, y)){
			return [x,y];
		}else{
			// Nghiệm thứ 2
			Y = 0 - a/Math.pow(t*t + 1, 0.5);
			X = ((x1-x2)/(y1-y2)) * Y;
			x = X + x1;
			y = Y + y1;
			if(isMiddle(x1, x2, x) && isMiddle(y1, y2, y)){
				return [x,y];
			}
		}
	}
	return [x,y];
}

/**
 * Kiểm tra z có nằm giữa z và y không
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @returns {Boolean}
 */
function isMiddle(x, y, z){
	if(x >= y){
		if(x >= z && z >= y){
			return true;
		}
	}else {
		if(y >= z && z >= x){
			return true;
		}
	}
	return false;
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
 * Distinct of point to array
 *
 * @param {Point} p
 * @param {Array<Point>} array
 * @returns {Number, Point} Dist and point in array which has minimum distinct
 */
function minDistinctPoint(p, array){
	var rs = null;
	var dist = 360;
	for(var i in array){
		var temp = distinct(p, array[i]);
		if(temp < dist){
			dist = temp;
			rs = array[i];
		}
	};
	return {"distinct":dist, "point": rs};
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
