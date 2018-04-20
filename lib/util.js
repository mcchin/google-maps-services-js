/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */;

/**
 * Polyline encodes an array of LatLng objects.
 *
 * See {@link https://developers.google.com/maps/documentation/utilities/polylinealgorithm}
 *
 * @memberof! module:@google/maps
 * @name module:@google/maps.util.encodePath
 * @function
 * @param {LatLng[]} path
 * @return {string}
 */
exports.encodePath = function(path) {

  var result = [];
  var start = [0, 0];
  var end;

  var encodePart = function(part) {
    part = part < 0 ? ~(part << 1) : (part << 1);
    while (part >= 0x20) {
      result.push(String.fromCharCode((0x20 | (part & 0x1f)) + 63));
      part >>= 5;
    }
    result.push(String.fromCharCode(part + 63));
  };

  for (var i = 0, I = path.length || 0; i < I; ++i) {
    if ( typeof path[i].lat === 'function' ) {
      end = [Math.round(path[i].lat() * 1e5), Math.round(path[i].lng() * 1e5)];
    } else {
      end = [Math.round(path[i].lat * 1e5), Math.round(path[i].lng * 1e5)];
    }
    encodePart(end[0] - start[0]);  // lat
    encodePart(end[1] - start[1]);  // lng
    start = end;
  }

  return result.join('');
}

/**
 * Decodes a polyline encoded string.
 *
 * See {@link https://developers.google.com/maps/documentation/utilities/polylinealgorithm}
 *
 * @memberof! module:@google/maps
 * @name module:@google/maps.util.decodePath
 * @function
 * @param {string} path
 * @return {LatLng[]}
 */
exports.decodePath = function(encodedPath) {

  var len = encodedPath.length || 0;
  var path = new Array(Math.floor(encodedPath.length / 2));
  var index = 0;
  var lat = 0;
  var lng = 0;

  for (var pointIndex = 0; index < len; ++pointIndex) {
    var result = 1;
    var shift = 0;
    var b;
    do {
      b = encodedPath.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));

    result = 1;
    shift = 0;
    do {
      b = encodedPath.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));

    path[pointIndex] = {lat: lat * 1e-5, lng: lng * 1e-5};
  }
  path.length = pointIndex;

  return path;
};

const vb = (a, b, c) => {
  null != b && (a = Math.max(a, b));
  null != c && (a = Math.min(a, c));
  return a;
};

const wb = (a, b, c) => {
  c -= b;
  return ((a - b) % c + c) % c + b;
};

function _LatLng(a, b, c) {
  if (a && (void 0 !== a.lat || void 0 !== a.lng)) {
    try {
      if ( typeof a === 'number' ) {
        a.lat = a;
        a.lng = b;
      } else if ( typeof a === 'string' ) {
        a.lat = Number(a);
        a.lng = Number(b);
      }
      b = a.lng;
      a = a.lat;
      c = !1;
    } catch (d) {
      console.error('Unable to process LatLng', d);
    }
  }
  a -= 0;
  b -= 0;
  c || (a = vb(a, -90, 90),
  180 != b && (b = wb(b, -180, 180)));
  this.lat = function() {
    return a
  };
  this.lng = function() {
    return b
  };
};

exports.LatLng = _LatLng;

exports.getGeodesicPolyline = (start, end) => {
  var geodesicPoints = [];

  var lat1 = start.lat() * (Math.PI/180);
  var lon1 = start.lng() * (Math.PI/180);
  var lat2 = end.lat() * (Math.PI/180);
  var lon2 = end.lng() * (Math.PI/180);

  var d = 2*Math.asin(Math.sqrt( Math.pow((Math.sin((lat1-lat2)/2)),2) + Math.cos(lat1)*Math.cos(lat2)*Math.pow((Math.sin((lon1-lon2)/2)),2)));

  for (var n = 0 ; n < 61 ; n++ ) {
    var f = (1/60) * n;
    f = f.toFixed(6);
    var A = Math.sin((1-f)*d)/Math.sin(d);
    var B = Math.sin(f*d)/Math.sin(d);

    var x = A*Math.cos(lat1)*Math.cos(lon1) + B*Math.cos(lat2)*Math.cos(lon2);
    var y = A*Math.cos(lat1)*Math.sin(lon1) + B*Math.cos(lat2)*Math.sin(lon2);
    var z = A*Math.sin(lat1) + B*Math.sin(lat2);

    var latN = Math.atan2(z,Math.sqrt(Math.pow(x,2)+Math.pow(y,2)));
    var lonN = Math.atan2(y,x);
    var p = new _LatLng(latN/(Math.PI/180), lonN/(Math.PI/180));
    geodesicPoints.push(p);
  }

  return geodesicPoints;
};
