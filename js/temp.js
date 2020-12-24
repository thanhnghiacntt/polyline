var url = "https://temp.map4d.vn/map/hydrometeorology";
//var url = "http://localhost:5000/map/hydrometeorology";
var markers = [];
var polygons = [];
var opRain = "Ngày...";
var core = null;
var fileName = null;
var minRain = null;
var maxRain = null;
var type = null;
var ratThap = "#b8d989";
var thap = "#71bf44";
var trungBinh = "#fff57a";
var cao = "#f7943c";
var ratCao = "#f04d22";

function getValueUrl(http, callback) {
    waiting(true);
    $.ajax({
        url: http,
        type: 'GET',
        success: function(data){
            waiting(false);
            if(data.code == "ok"){
                callback(data.result);
            }else{
                alert(data.message);
            }
        },
        error: function(data) {
            alert('Lỗi kết nối server '+url);
            waiting(false);
        }
    });
}

function setDayRain() {
    http = url + "/get-files-rain";
    getValueUrl(http, function (result) {
        var v = "";
        result.forEach(function (value) {
            var i = value.substr(11,10);
            var d = i.substr(0, 4)+"/"+i.substr(4,2)+"/"+i.substr(6,2)+ " "+i.substr(8,2)+":00:00";
            v += "<option value='" + value + "' >" + d + "</option>";
        });
        $("#dayRain").html("<option selected>"+ opRain +"</option>" + v);
    });
}

function setScore() {
    http = url + "/get-scores";
    getValueUrl(http, function (result) {
        var v = "";
        result.forEach(function (value) {
            var text = "";
            if(value < 2){
                text = "Rất Thấp";
            }else if(value < 4){
                text = "Thấp";
            }else if(value < 6){
                text = "Trung Bình";
            }else if(value < 8){
                text = "Cao";
            }else {
                text = "Rất Cao";
            }
            v += "<option value='" + value + "' >" + text + "</option>";
        });
        $("#score").html("<option selected>Chọn mức độ </option>" + v);
    });
}
function resetOption(it, min, max, text, step) {
    step = step == null ? 1: step;
    var v = "";
    for(var i = min;i <= max; i = i + step){
        v += "<option value='" + i + "' >" + i + "</option>";
    }
    if(valueNum(text) == null){
        v = "<option selected>" + text + "...</option>" + v;
    }
    it.html(v);
}
function start() {
    minRain = valueNum($("#minRain").val());
    maxRain = valueNum($("#maxRain").val());
    var file = $("#dayRain").val();
    fileName = file == opRain ? null : file;
    score = valueNum($("#score").val());
    type = $("#landslide").is(':checked') ? 2: null;
    var http = url + "/get-list-with-condition?";
    http += minRain != null ? "minRain=" + minRain + "&" : "";
    http += maxRain != null ? "maxRain=" + maxRain + "&" : "";
    http += fileName != null ? "fileName=" + fileName + "&" : "";
    http += score != null ? "score=" + score + "&" : "";
    http += type != null ? "type=" + type + "&" : "";
    if(minRain == null && maxRain == null && fileName == null && score == null && type == null){
        alert("Phải chọn ít nhất một vài giá trị");
        return;
    }
    waiting(true);
    getValueUrl(http, function (result) {
        if(result.features.length == 0){
            alert("Không có dữ liệu");
        }else{
            drawData(result);
        }
    })
}
function waiting(is) {
    if(is){
        $('.waiting').css({"display":"flex"});
    }else{
        $('.waiting').css({"display":"none"});
    }
}
function valueNum(v) {
    if(isNaN(Number(v))){
        return null;
    }
    return Number(v);
}

function drawData(data) {
    deleteOldPolygon();
    deleteOldMarkers();
    if(data != null){
        var listRatThap = [];
        var listThap = [];
        var listTrungBinh = [];
        var listCao = [];
        var listRatCao = [];
        data.features.forEach(function (feature) {
            var co = feature.geometry.coordinates;
            if(feature.geometry.type == "Point") {
                addList(feature.properties.rain, co, listRatThap, listThap, listTrungBinh, listCao, listRatCao);
            }else if(feature.geometry.type == "MultiPoint"){
                co.forEach(function (value) {
                    addList(feature.properties.rain, value, listRatThap, listThap, listTrungBinh, listCao, listRatCao);
                })
            }else if(feature.geometry.type == "Polygon"){
                addPolygon(co);
            }else if(feature.geometry.type == "MultiPolygon"){
                co.forEach(function (value) {
                    addPolygon(value);
                })
            }
        });
        addHeaderLayer(listRatThap, ratThap);
        addHeaderLayer(listThap, thap);
        addHeaderLayer(listTrungBinh, trungBinh);
        addHeaderLayer(listCao, cao);
        addHeaderLayer(listRatCao, ratCao);
        if(polygons.length > 0){
            $(".option").css({"display":"block"})
        }else{
            $(".option").css({"display":"none"})
        }
    }
}

function addHeaderLayer(list, color) {
    if(list.length > 0){
        var options = {
            minOpacity: 0.05,
            maxZoom: 18,
            radius: 25,
            blur: 15,
            max: 1.0,
            gradient:{1: color}
        };
        var marker = L.heatLayer(list, options);
        marker.addTo(map);
        markers.push(marker);
        map.setView(list[0]);
    }
}

function addList(rain, coodinate, listRatThap, listThap, listTrungBinh, listCao, listRatCao) {
    if(rain != null){
        if(rain <= 5){
            listRatThap.push([coodinate[1], coodinate[0]]);
        }else if(rain <= 30){
            listThap.push([coodinate[1], coodinate[0]]);
        }else if(rain <= 60){
            listTrungBinh.push([coodinate[1], coodinate[0]]);
        }else if(rain <= 100){
            listCao.push([coodinate[1], coodinate[0]]);
        }else {
            listRatCao.push([coodinate[1], coodinate[0]]);
        }
    }else{
        listRatCao.push([coodinate[1], coodinate[0]]);
    }
}

function addPolygon(co) {
    var paths = [];
    co.forEach(function (ring) {
        var tRing = [];
        ring.forEach(function (point) {
            var v = {lat: point[1], lng: point[0]};
            tRing.push(v);
        })
        paths.push(tRing);
    });
    var poly = L.polygon(paths);
    if(score != null){
        poly.options.fillOpacity=0.9;
        poly.options.width = 1;
        if(score < 2){
            poly.options.fillColor = ratThap;
        } else if(score < 4){
            poly.options.fillColor = thap;
        } else if(score < 6){
            poly.options.fillColor = trungBinh;
        } else if(score < 8){
            poly.options.fillColor = cao;
        } else if(score < 10){
            poly.options.fillColor = ratCao;
        }
        if(!$("#optionVien").is(':checked')){
            poly.options.color = poly.options.fillColor;
        }
    }
    poly.addTo(map);
    polygons.push(poly);
}
function deleteOldPolygon() {
    deleteObject(polygons);
}

function deleteOldMarkers() {
    deleteObject(markers);
}

function deleteObject(values) {
    values.forEach(function (value) {
        try {
            value.onRemove();
        }catch(err) {
            console.error(err);
        }
    });
    values.length = 0;
}

function setBasemap (basemap) {
    if (layer) {
        map.removeLayer(layer);
    }
    layer = L.tileLayer(basemap, {
        attribution: 'IOT Link',
    }).addTo(map);

    map.addLayer(layer);
}


setDayRain();
resetOption($("#minRain"));
resetOption($("#maxRain"));

//resetOption($("#score"), 0, 10, "Chọn loại");
setScore();

$("#basemaps").change(function (e) {
    setBasemap(e.target.value);
})
$("#minRain").change(function (e) {
    var v = valueNum(e.target.value);
    var it = $("#maxRain");
    if(v == null){
        resetOption(it, 1, 3000, "Đến", 1);
    }else{
        resetOption(it, v, Math.min(v + 10, 3000), "Đến", 1);
    }
});
$("#dayRain").change(function (e) {
    if(e.target.value == opRain){
        displayRain(false);
    }else{
        displayRain(true);
    }
});

$("#optionVien").change(function (e) {
    if($("#optionVien").is(':checked')){
        updatePolygon(false);
    }else{
        updatePolygon(true);
    }
})

function updatePolygon(e) {
    if(e){
        polygons.forEach(function (poly) {
            poly.setStyle({"color": poly.options.fillColor})
        })
    }else{
        polygons.forEach(function (poly) {
            poly.setStyle({"color": "#3388ff"});
        })
    }
}

function displayRain(is) {
    var maxRain = $("#maxRain");
    var minRain = $("#minRain");
    if(is){
        $(".rain").attr('style', 'display: block !important');
        resetOption(minRain, 0, 3000, "Từ", 1);
        resetOption(maxRain, 0, 10, "Đến", 1);
    }else{
        $(".rain").attr('style', 'display: none !important');
        resetOption(minRain);
        resetOption(maxRain);
    }
}

$("#ratThap").attr('style', 'color: blue; background: ' + ratThap);
$("#thap").attr('style', 'background: ' + thap);
$("#trungBinh").attr('style', 'color: blue; background: ' + trungBinh);
$("#cao").attr('style', 'background: ' + cao);
$("#ratCao").attr('style', 'color: blue; background: ' + ratCao);