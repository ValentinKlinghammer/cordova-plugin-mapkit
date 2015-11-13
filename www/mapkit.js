var cordovaRef = window.PhoneGap || window.Cordova || window.cordova || window.phonegap;

var MapArray = []
var MapDict = {}

var that;

function isPlainObject(o) {
   return ((o === null) || Array.isArray(o) || typeof o == 'function') ?
           false
          :(typeof o == 'object');
}

var MKLocationManager = function () {
  this.locationAuthStatus = "LOCATION_AUTH_NOT_CHECKED"
  this.canUseLocation = false

  this.execSuccess = function (data) {
    console.log("#MKLocationManager() Executed native command successfully")
    console.log(data)
  }
  this.execFailure = function (err) {
    console.warn("#MKLocationManager() MapKit failed to execute native command:")
    console.warn(err)
  }

  this.handleLocationAuthStatus = function (locationAuthStatus) {
    console.log(locationAuthStatus)
    console.log(that)

    that.locationAuthStatus = locationAuthStatus
    if (that.checkLocationAuthStatus_callback != undefined)
    {
      that.checkLocationAuthStatus_callback(locationAuthStatus)
    }

    if (locationAuthStatus == "LOCATION_AUTH_AUTHORIZED" || locationAuthStatus == "LOCATION_AUTH_AUTHORIZED_ALWAYS" || locationAuthStatus == "LOCATION_AUTH_AUTHORIZED_WHEN_IN_USE")
    {
      that.canUseLocation = true
    }
    else
    {
      that.canUseLocation = false
    }
  }
  this.checkLocationAuthStatus = function (callback) {
    this.checkLocationAuthStatus_callback = callback
    that = this; //Fix for this inside callback
    cordovaRef.exec(this.handleLocationAuthStatus, this.execFailure, 'MapKit', 'checkLocationAuthStatus')
  }
  this.requestLocationAlwaysPermission = function () {
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'requestLocationAlwaysPermission')
  }
  this.requestLocationWhenInUsePermission = function () {
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'requestLocationWhenInUsePermission')
  }
}

var locationManager = new MKLocationManager()
locationManager.checkLocationAuthStatus()


var MKSimplePin = function (map, lat, lon, title, description) {
  this.map = map
  this.lat = lat
  this.lon = lon
  this.title = title
  this.description = description
  this.execSuccess = function (data) {
    console.log(`#MKSimplePin(${that.title}) Executed native command successfully`)
    console.log(data)
  }
  this.execFailure = function (err) {
    console.warn(`#MKSimplePin(${that.title}) MapKit failed to execute native command:`)
    console.warn(err)
  }
  this.createPin = function () {
    that = this
    console.log(`Creating pin: ${[this.map.mapId, this.lat, this.lon, this.title, this.description].join(" - ")}`)
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'addSimpleMapPin', [this.map.mapId, this.lat, this.lon, this.title, this.description])
  }
  this.createPinArray = function () {
    return [this.lat, this.lon, this.title, this.description]
  }
  this.removePin = function () {
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'removeMapPin', [this.map.mapId, this.title])
  }
}

var MKComplexPin = function (map, lat, lon, title, description, pinColor, draggable, canShowCallout, showInfoButton, infoClickCallback) {
  this.map = map
  this.lat = lat
  this.lon = lon
  this.title = title
  this.description = description
  this.pinColor = pinColor
  this.draggable = draggable
  this.canShowCallout = canShowCallout
  this.showInfoButton = showInfoButton
  this.infoClickCallback = infoClickCallback
  this.execSuccess = function (data) {
    console.log(`#MKSimplePin(${that.title}) Executed native command successfully`)
    console.log(data)
  }
  this.execFailure = function (err) {
    console.warn(`#MKSimplePin(${that.title}) MapKit failed to execute native command:`)
    console.warn(err)
  }
  this.createPin = function () {
    that = this
    console.log(`Creating pin: ${[this.map.mapId, this.lat, this.lon, this.title, this.description].join(" - ")}`)
    console.dir([this.map.mapId, this.lat, this.lon, this.title, this.description, ((this.pinColor == "purple")?3:((this.pinColor == "green")?2:1)), ((this.draggable)?1:0), ((this.canShowCallout)?1:0), ((this.showInfoButton)?1:0)])
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'addSimpleMapPin', [this.map.mapId, this.lat, this.lon, this.title, this.description, ((this.pinColor == "purple")?3:((this.pinColor == "green")?2:1)), ((this.draggable)?1:0), ((this.canShowCallout)?1:0), ((this.showInfoButton)?1:0)])
  }
  this.createPinArray = function () {
    return [this.lat, this.lon, this.title, this.description]
  }
  this.removePin = function () {
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'removeMapPin', [this.map.mapId, this.title])
  }
}


var MKMap = function (mapId) {
  if (mapId != undefined)
  {

    this.mapId = mapId
    // this.mapArrayId = MapArray.push(this)
  }
  else
  {
    this.mapId = "map_" + MapArray.length
    // this.mapId = "map_" + this.mapArrayId
  }

  if (MapDict[mapId] != undefined)
  {
    MapDict[mapId].destroyMap()
  }

  MapDict[mapId] = this;
  this.mapArrayId = MapArray.push(this) - 1

  this.locationManager = locationManager;

  this.created = false
  this.destroyed = false
  this.options = {}
  this.options.xPos = 0
  this.options.yPos = 0
  this.options.height = window.innerHeight || 100
  this.options.width = window.innerWidth || 100
  this.options.mapScale = false
  this.options.mapTraffic = false
  this.options.mapCompass = false
  this.options.mapBuildings = false
  this.options.mapPointsOfInterest = true
  this.options.mapUserLocation = false
  this.PinsArray = []
  this.Pins = {}
  this.setBounds = function (data) {
    if (Number.isFinite(arguments[0]) && Number.isFinite(arguments[1]))
    {
      height = arguments[0]
      width = arguments[1]
    }
    else if (data.height != undefined || data.width != undefined) {
      height = data.height
      width = data.width
    }
    else {
      console.warn(`#MKMap(${this.mapId}) setBounds was called with neither object nor numeric values`)
      return "ERR_INVALID_VALUES"
    }

    if (this.created)
    {
      if (height != null && width != null)
      {
        this.options.height = height
        this.options.width = width
        that = this
        cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'changeMapBounds', [this.mapId, height, width])
      }
      else if (height != null) {
        this.options.height = height
        that = this
        cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'changeMapHeight', [this.mapId, height])
      }
      else if (width != null) {
        this.options.width = width
        that = this
        cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'changeMapWidth', [this.mapId, width])
      }
      else {
        console.warn(`#MKMAP(${this.mapId}) setBounds called with null-like parameters`)
      }
    }
    else
    {
      if (height == null && width == null)
      {
        console.warn(`#MKMAP(${this.mapId}) setBounds called with null-like parameters`)
      }
      this.options.height = height || this.options.height
      this.options.width = width || this.options.width
    }
  }
  this.setPosition = function (data) {
    if (Number.isFinite(arguments[0]) && Number.isFinite(arguments[1]))
    {
      xPos = arguments[0]
      yPos = arguments[1]
    }
    else if (data.height != undefined || data.width != undefined) {
      height = data.height
      width = data.width
    }
    else {
      console.warn(`#MKMap(${this.mapId}) setPosition was called with neither object nor numeric values`)
      return "ERR_INVALID_VALUES"
    }

    if (this.created)
    {
      if (xPos != null && yPos != null)
      {
        this.options.xPos = xPos
        this.options.yPos = yPos
        that = this
        cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'changeMapPosition', [this.mapId, xPos, yPos])
      }
      else if (xPos != null) {
        this.options.xPos = xPos
        that = this
        cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'changeMapXPos', [this.mapId, xPos])
      }
      else if (yPos != null) {
        this.options.yPos = yPos
        that = this
        cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'changeMapYPos', [this.mapId, yPos])
      }
      else {
        console.warn(`#MKMAP(${this.mapId}) setPosition called with null-like parameters`)
      }
    }
    else
    {
      if (xPos == null && yPos == null)
      {
        console.warn(`#MKMAP(${this.mapId}) setPosition called with null-like parameters`)
      }
      this.options.xPos = xPos || this.options.xPos
      this.options.yPos = yPos || this.options.yPos
    }
  }
  this.execSuccess = function (data) {
    console.log(`#MKMap(${that.mapId}) Executed native command successfully`)
    console.log(data)
  }
  this.execFailure = function (err) {
    console.warn(`#MKMap(${that.mapId}) MapKit failed to execute native command:`)
    console.warn(err)
  }
  this.createMap = function (c) {
    if (!this.created)
    {
      console.log(`#Map(${this.mapId}) Creating map`)
      this.created = true
      that = this
      cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'createMapView', [this.mapId, this.options.height, this.options.width, this.options.xPos, this.options.yPos])
    }
  }
  this.destroyMap = function () {
    console.log(`#Map(${this.mapId}) Destroying map`)
    this.destroyed = true
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'removeMapView', [this.mapId])
  }
  this.showMap = function () {
    console.log(`#Map(${this.mapId}) Showing map`)
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'showMapView', [this.mapId])
  }
  this.hideMap = function () {
    console.log(`#Map(${this.mapId}) Hiding map`)
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'hideMapView', [this.mapId])
  }

  this.showMapScale = function () {
    this.options.mapScale = true
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'showMapScale', [this.mapId])
  }
  this.hideMapScale = function () {
    this.options.mapScale = false
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'hideMapScale', [this.mapId])
  }

  this.showMapCompass = function () {
    if (!this.locationManager.canUseLocation)
    {
      console.warn("Attempt was made to use Location#Compass without system location access. MapKit will automatically attempt to ask for WhenInUse authorization.")
      this.locationManager.requestLocationWhenInUsePermission()
    }
    this.options.mapCompass = true
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'showMapCompass', [this.mapId])
  }
  this.hideMapCompass = function () {
    this.options.mapCompass = false
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'hideMapCompass', [this.mapId])
  }

  this.showMapTraffic = function () {
    this.options.mapTraffic = true
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'showMapTraffic', [this.mapId])
  }
  this.hideMapTraffic = function () {
    this.options.mapTraffic = false
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'hideMapTraffic', [this.mapId])
  }

  this.showMapBuildings = function () {
    this.options.mapBuildings = true
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'showMapBuildings', [this.mapId])
  }
  this.hideMapBuildings = function () {
    this.options.mapBuildings = false
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'hideMapBuildings', [this.mapId])
  }

  this.showMapUserLocation = function () {
    if (!this.locationManager.canUseLocation)
    {
      console.warn("Attempt was made to use Location#UserLocation without system location access. MapKit will automatically attempt to ask for WhenInUse authorization.")
      this.locationManager.requestLocationWhenInUsePermission()
    }
    this.options.mapUserLocation = true
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'showMapUserLocation', [this.mapId])
  }
  this.hideMapUserLocation = function () {
    this.options.mapUserLocation = false
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'hideMapUserLocation', [this.mapId])
  }
  this.userLocationVisible = function (callback) {
    cordovaRef.exec(callback, this.execFailure, 'MapKit', 'isShowingUserLocation', [this.mapId])
  }

  this.showMapPointsOfInterest = function () {
    this.options.mapPointsOfInterest = true
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'showMapPointsOfInterest', [this.mapId])
  }
  this.hideMapPointsOfInterest = function () {
    this.options.mapPointsOfInterest = false
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'hideMapPointsOfInterest', [this.mapId])
  }

  this.addSimpleMapPin = function (data) {
    console.log(isPlainObject(data))
    if (data != undefined && isPlainObject(data))
    {
      lat = data.lat
      lon = data.lon
      title = data.title || ("Pin " + this.PinsArray.length)
      description = data.description || ""
    }
    else
    {
      lat = arguments[0]
      lon = arguments[1]
      title = arguments[2] || ("Pin " + this.PinsArray.length)
      description = arguments[3] || ""
    }
    if (this.Pins[title] != undefined)
    {
      this.Pins[title].removePin()
    }
    Pin = new MKSimplePin(this, lat, lon, title, description)
    this.Pins[title] = Pin
    this.PinsArray.push(Pin)
    Pin.createPin()
  }
  this.addSimpleMapPins = function (pinArr) {
    PinsToAdd = []
    for (var i in pinArr)
    {
      pin = pinArr[i]
      lat = pin.lat || 58
      lon = pin.lon || 11
      title = pin.title || ("Pin " + this.PinsArray.length)
      description = pin.description || ""

      if (this.Pins[title] != undefined)
      {
        this.Pins[title].removePin()
      }
      Pin = new MKSimplePin(this, lat, lon, title, description)
      this.Pins[title] = Pin
      this.PinsArray.push(Pin)

      PinsToAdd.push(Pin.createPinArray())
    }
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'addSimpleMapPins', [this.mapId, PinsToAdd])
  }
  this.addComplexMapPin = function (data) {
    data = data || {}
    lat = data.lat || 58
    lon = data.lon || 11
    title = data.title || ("Pin " + this.PinsArray.length)
    description = data.description || ""
    pinColor = data.pinColor || "red" // red/green/purple
    draggable = data.draggable || false;
    canShowCallout = data.canShowCallout || true;
    showInfoButton = data.showInfoButton || false;
    infoClickCallback = data.infoClickCallback || function (pin) { console.log("PinInfo was clicked: "+pin.title) }

    if (this.Pins[title] != undefined)
    {
      this.Pins[title].removePin()
    }
    Pin = new MKComplexPin(this, lat, lon, title, description, pinColor, draggable, canShowCallout, showInfoButton, infoClickCallback)
    this.Pins[title] = Pin
    this.PinsArray.push(Pin)
    Pin.createPin()
  }
  this.removeAllMapPins = function () {
    that = this
    cordovaRef.exec(this.execSuccess, this.execFailure, 'MapKit', 'removeAllMapPins', [this.mapId])
  }




}

function handlePinInfoClickCallback(title)
{
  Pins[title].infoClickCallback(Pins[title])
}


window.MKInterface = {}
window.MKInterface.MKMap = MKMap
window.MKInterface.locationManager = locationManager
window.MKInterface.getMapByArrayId = function (aid) { return MapArray[aid] }
window.MKInterface.getMapByMapId = function (mid) { return MapDict[mid] }
window.MKInterface.pinInfoClickCallback = handlePinInfoClickCallback
