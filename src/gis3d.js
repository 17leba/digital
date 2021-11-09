import {
  InitMap,
  TrackedAnimate,
  trackData722,
  RoadSurface,
  GreenBeltsss,
  DividerLayer,
  Arrowsss,
  Stoplinesss,
  Zebrasss,
  ThreeAnchor,
  CountdownSignal,
  StreetLight,
  MapUtils,
  weblogUtils,
  cesiumUtils,
  Map3dCompass,
} from "./sdk.js";
import { map3dConfig } from "./const";
const { staticHost, dataHost } = map3dConfig;

let cesiumInit = {
  init(el, position) {
    this.viewer = el;
    this.launchedAnimate = false;
    this.isPlyay = false;
    this.isFirstlaunchedAnimate = true;
    this.drawNumber = 10000;
    // 上次点击的entity
    this.clickedEntity = null;
    //记录上一次的地图范围
    this.lastMapBound = {};
    //红绿灯名称数组
    this.trafficlightNames = ["hongdeng", "lvdeng", "huangdeng"];
    // let firstPointtrack_hengyang = trackData.gettrack_hengyang_2021030()[0];
    let firstPointtrack_hengyang = trackData722.gettrack_hengyang_20210722()[0];
    let log1 = parseFloat(firstPointtrack_hengyang[1]) + 0.0004;
    let lat1 = parseFloat(firstPointtrack_hengyang[2]) - 0.0009;
    this.mapcenter = Cesium.Cartesian3.fromDegrees(log1, lat1, 100);
    this.LayerNames = [];

    // this.initViewer(el);

    //获取当前三维地图范围
    // var Rectangle = this.viewer.camera.computeViewRectangle();

    //初始化高精地图
    this.initHDMap(position);

    // this.load3dtiles();
    // this.addEntity();
    // this.setView();
    this.trackedAnimate = new TrackedAnimate(this.viewer);
    return this.viewer;
  },
  handleEntityEvent(type, cb) {
    let handler3D = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    // handler3D.setInputAction(function(movement) {
    handler3D.setInputAction((movement) => {
      //获取primitive
      // let a = this.getCurrentMapCenter();
      // console.log("movement.position", movement.position, a);
      var pick = this.viewer.scene.pick(movement.position);
      if (pick && pick.id) {
        if (typeof pick.id === "string") {
          this.selectedEntityChanged(pick.primitive, type, cb);
        } else {
          this.selectedEntityChanged(pick.id, type, cb);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  },

  initHDMap(position) {
    //指南针
    this.setCompass();
    let initMap = new InitMap(this.viewer);
    //顺义数据
    let WFSLayerUrlObjShunyi = [
      {
        layerName: "Road",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Aroad_shunyi_2020101401_1_V1_2&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "DividerPolygon",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3AdividerPolygon_shunyi_2020101401_1_V1_2_divtype1_7_8_9_12&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "DividerPolyline",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Adivider_shunyi_2020101401_1_V1_2&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "Stopline",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Ashunyi_stopline&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "Arrow",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Ashunyi_arrow&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "Zebra",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Ashunyi_zebra&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "StreetLight",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Ashunyi_streetlight_v1.0&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "CameraByType",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Acamera_shunyi_V1.1&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "TrafficLightByType",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Atrafficlight_shunyi_V1.1&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "Pole",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Apole_shunyi_V1.1&maxFeatures=50000&outputFormat=application%2Fjson",
      },
    ];
    this.setView(position);
    initMap.loadHDDataLayers(WFSLayerUrlObjShunyi);
    //衡阳数据
    let initMap2 = new InitMap(this.viewer);
    let WFSLayerUrlObjHengyang = [
      {
        layerName: "Road",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Aroad_Hengyang_all_V1.1&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "GreenBelts",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Agreenbelts_Hengyang_NoAltitude&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "DividerPolygon",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3AdividerPolygon_Hengyang_all_V1.1_divtype1_7_8_9_12&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "DividerPolyline",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3AdividerHengyangNoaltitude&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "Stopline",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3AStopLine_Hengyang_Noaltitude&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "Arrow",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Aarrow_hengyang&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "Zebra",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Azebra_Hengyang&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "Camera",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Acamera_hengyang&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "TrafficLight",
        layerUrl:
          dataHost +
          "/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Atrafficlight_hengyang&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "TrafficSign",
        layerUrl:
          "http://10.0.12.42:9090/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Atrafficsign_hengyang_1qi&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "BusOverpass",
        layerUrl:
          "http://10.0.12.42:9090/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Abusoverpass_hengyang_1qi&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "RoadName",
        layerUrl:
          "http://10.0.12.42:9090/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Aroadname_hengyang_1qi&maxFeatures=50000&outputFormat=application%2Fjson",
      },
      {
        layerName: "Diversion",
        layerUrl:
          "http://10.0.12.42:9090/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Adiversion_hengyang_1qi&maxFeatures=50&outputFormat=application%2Fjson",
      },
    ];
    // this.setView();
    initMap2.loadHDDataLayers(WFSLayerUrlObjHengyang);

    let initTime = new Date();
    let clientId = localStorage.getItem("clientId");
    if (clientId === null) {
      clientId = cesiumUtils.guid();
      localStorage.setItem("clientId", clientId);
    }
    let initLog = {
      clientId: clientId,
      time: initTime,
      layerNames: this.LayerNames,
    };
    let initLogStr = JSON.stringify(JSON.stringify(initLog));
    console.log("initLogStr:", initLogStr);
    weblogUtils.sendLog(1, "init", initLogStr);

    //地图移动结束事件，重载视频里列表
    // this.addReloadCameraLiveStreamingListEventListener();
    //限制地图显示高度
    this.limitMaxmumMaplevel();
  },
  setCompass() {
    let map3dcompass = new Map3dCompass(this.viewer);
  },
  setView(v = {}) {
    // 112.57756565920 ","26.82019106028 衡阳
    // 112.587131,26.821554 科学城路口
    const { lng = 116.7356604713664, lat = 40.19832687206192, h = 100 } = v;
    console.log(lng, lat, h);
    let p = Cesium.Cartesian3.fromDegrees(lng, lat, h);
    let flyToOpts = {
      destination: p,
      orientation: {
        // heading: 5.837346505274043,
        heading: 0,
        pitch: -0.7927209256695096,
        roll: 6.281137980253018,
      },
      duration: 1,
    };
    this.viewer.scene.camera.setView(flyToOpts);
  },
  
  setPositions() {
    // let track_hengyang = trackData.gettrack_hengyang_2021030();
    let track_hengyang = trackData722.gettrack_hengyang_20210722();
    let positions = [];
    var n = Math.min(this.drawNumber, track_hengyang.length);
    for (var i = 0; i < n; i++) {
      // console.log([track_hengyang[i][1], track_hengyang[i][2]]);
      let p = Cesium.Cartesian3.fromDegrees(track_hengyang[i][1], track_hengyang[i][2], 0);
      // console.log(p);
      positions.push(p);
      // console.log(positions);
    }
    // console.log(positions);
    return positions;
  },
  
  //加载3dtiles数据
  load3dtiles() {
    var tileset = this.viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset({
        url: "http://data.marsgis.cn/3dtiles/max-ytlhz/tileset.json",
      })
    );
  },
  addFirstPersonPerspective() {
    //(前后距离，左右距离，上下距离)
    //传一个3纬数组，必须为数字，可以不传，默认为[-30,0,10]
    // parameters[0]>=-200 && parameters[0]<=200
    // && parameters[1]>=-30 && parameters[1]<=30
    // && parameters[2]>=-200 && parameters[2]<=200
    let firstpersonPerspectiveParameters = [-80, 0, 200];
    console.log(firstpersonPerspectiveParameters);
    this.trackedAnimate.addFirstPersonPerspective(firstpersonPerspectiveParameters);
    // this.trackedAnimate.addFirstPersonPerspective();
  },
  removeFirstPersonPerspective() {
    this.trackedAnimate.removeFirstPersonPerspective();
  },
  getCurrentMapBound() {
    let mapUtils = new MapUtils(this.viewer);
    let bound = mapUtils.getCurrentMapBound();
    // console.log("CurrentMapBound:",bound);
    return bound;
  },
  getCurrentMapCenter() {
    let mapUtils = new MapUtils(this.viewer);
    let center = mapUtils.getCurrentMapCenter();
    return center;
  },
  changeTrafficlight(id, status) {
    try {
      let modelId = `trafficlight_shunyi_V1.1.${id}`;
      // console.log("modelId", modelId);
      // let modelId = "trafficlight_shunyi_V1.0.43";
      let idPre = modelId.split("|")[0];
      let newModelStatus = status;
      let NewstatusId = idPre + "|" + newModelStatus;
      let mapUtils = new MapUtils(this.viewer);
      //ModelStatus为数组
      let objArr = mapUtils.getTrafficLightModelAndStatusById(modelId);
      let trafficlightModelId = mapUtils.getModelPrimitiveById(NewstatusId);
      //如果灯已经存在，没有显示，则将它显示即可
      if (trafficlightModelId) {
        trafficlightModelId.show = true;
        //删除其他灯态的模型
        for (let i = 0; i < objArr.length; i++) {
          if (objArr[i].modelStatus != newModelStatus) {
            let removeId = idPre + "|" + objArr[i].modelStatus;
            let removeResult = mapUtils.removeModelPritiveById(removeId);
            // console.log("removeResult1:", removeResult);
          }
        }
      } else {
        //创建一个灯
        let modelMatrix = objArr[0].model.modelMatrix;
        let modelUri = `${staticHost}/static/gltf/${newModelStatus}.glb`;
        let model = mapUtils.createModelByModelMatrix(NewstatusId, modelUri, modelMatrix);
        if (model != undefined) {
          model.readyPromise.then(function(model) {
            //删除其他灯态的模型
            for (let i = 0; i < objArr.length; i++) {
              if (objArr[i].modelStatus != newModelStatus) {
                let removeId = idPre + "|" + objArr[i].modelStatus;
                let removeResult = mapUtils.removeModelPritiveById(removeId);
                // console.log("removeResult2:", removeResult);
              }
            }
          });
        } else {
          // console.log("changeTrafficlight:添加模型失败");
        }
      }
    } catch (e) {
      // console.log("changeTrafficlight:", e);
    }
  },
  changeCountdownSignal() {
    let id = "trafficlight_shunyi_V1.0.43";
    let color = "red";
    let number = 20;
    // countdownSignal.updateCountdownSignalById(id,color,number);
    this.updateCountdownSignal(id, color, number);
  },
  updateCountdownSignal(id, color, number) {
    let that = this;
    setTimeout(() => {
      let countdownSignal = new CountdownSignal(this.viewer);
      // countdownSignal.updateCountdownSignalById(id,color,number);
      countdownSignal.updateCountdownSignalDoubledigitModelById(id, color, number);

      number = number - 1;
      console.log("number:", number);
      if (number >= -1) {
        that.updateCountdownSignal(id, color, number);
      }
    }, 1000);
  },
  setCountdownSignal(id, color, number) {
    let countdownSignal = new CountdownSignal(this.viewer);
    let modelId = `trafficlight_shunyi_V1.1.${id}`;
    countdownSignal.updateCountdownSignalDoubledigitModelById(modelId, color, number);
  },
  limitMaxmumMaplevel() {
    let mapUtils = new MapUtils(this.viewer);
    mapUtils.setMaximumZoomDistance(1000);
  },
  releaseLimitMaxmumMaplevel() {
    let mapUtils = new MapUtils(this.viewer);
    mapUtils.setMaximumZoomDistance(10000000);
  },
  drawRoad() {
    let Road = new RoadSurface(this.viewer);
    let WFSroad_Hengyang_all_V1_1 = `${dataHost}geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Aroad_Hengyang_all_V1.1&maxFeatures=50000&outputFormat=application%2Fjson`;
    Road.drawRoadWFS(WFSroad_Hengyang_all_V1_1);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSroad_Hengyang_all_V1_1);
    this.LayerNames.push(layerName);
  },
  drawRoadShunyi() {
    let Road = new RoadSurface(this.viewer);
    let road_shunyi_2020101401_1_V1_2 = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Aroad_shunyi_2020101401_1_V1_2&maxFeatures=50000&outputFormat=application%2Fjson`;
    Road.drawRoadWFS(road_shunyi_2020101401_1_V1_2);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(road_shunyi_2020101401_1_V1_2);
    this.LayerNames.push(layerName);
  },
  drawGreenBelts() {
    let GreenBelts = new GreenBeltsss(this.viewer);
    // let WFSgreenbelts_Hengyang = "https://eagle.zhidaozhixing.com/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Agreenbelts_Hengyang&maxFeatures=50000&outputFormat=application%2Fjson";
    let WFSgreenbelts_Hengyang_NoAltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Agreenbelts_Hengyang_NoAltitude&maxFeatures=50000&outputFormat=application%2Fjson`;
    GreenBelts.drawGreenBeltsWFS(WFSgreenbelts_Hengyang_NoAltitude);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSgreenbelts_Hengyang_NoAltitude);
    this.LayerNames.push(layerName);
  },
  drawDivider() {
    let Divider = new DividerLayer(this.viewer);
    // let WFSdivider_Hengyang_all_V1_1 = "https://eagle.zhidaozhixing.com/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Adivider_Hengyang_all_V1.1&maxFeatures=50000&outputFormat=application%2Fjson";
    // Divider.drawDividerWFS(WFSdivider_Hengyang_all_V1_1);

    //div_type=1单实线 7 8 9 12   ， 以polygon绘制
    let WFSdividerPolygonHengyangNoaltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3AdividerPolygon_Hengyang_all_V1.1_divtype1_7_8_9_12&maxFeatures=50000&outputFormat=application%2Fjson`;
    Divider.drawDividerPolygonWFSPrimitive(WFSdividerPolygonHengyangNoaltitude);
    let WFSdividerHengyangNoaltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3AdividerHengyangNoaltitude&maxFeatures=50000&outputFormat=application%2Fjson`;
    // Divider.drawDividerWFS(WFSdividerHengyangNoaltitude);
    Divider.drawDividerPolylineWFSPrimitive(WFSdividerHengyangNoaltitude);
    let wmsurl = "https://eagle.zhidaozhixing.com/geoserver/mogoHDMap2/wms";
    let wmslayer = "mogoHDMap2:divider_Hengyang_all_V1.1";
    // Divider.drawDividerWMS(wmsurl,wmslayer);
    // Divider.addDividerLocalGeojson();

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSdividerHengyangNoaltitude);
    this.LayerNames.push(layerName);
  },
  drawDividerShunyi() {
    let Divider = new DividerLayer(this.viewer);
    // let WFSdividerHengyangNoaltitude = "https://eagle.zhidaozhixing.com/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Adivider_shunyi_2020101401_1_V1_2&maxFeatures=50000&outputFormat=application%2Fjson";
    // Divider.drawDividerWFS(WFSdividerHengyangNoaltitude);
    let WFSdividerPolygonshunyiNoaltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3AdividerPolygon_shunyi_2020101401_1_V1_2_divtype1_7_8_9_12&maxFeatures=50000&outputFormat=application%2Fjson`;
    // Divider.drawDividerPolygonWFS(WFSdividerPolygonHengyangNoaltitude);
    //div_type=1单实线 7 8 9 12   ， 以polygon绘制
    Divider.drawDividerPolygonWFSPrimitive(WFSdividerPolygonshunyiNoaltitude);
    //div_type=2 3 4 5 6  虚线 双线， 以polylin绘制
    let WFSdividerPolylineshunyiNoaltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Adivider_shunyi_2020101401_1_V1_2&maxFeatures=50000&outputFormat=application%2Fjson`;
    Divider.drawDividerPolylineWFSPrimitive(WFSdividerPolylineshunyiNoaltitude);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSdividerPolylineshunyiNoaltitude);
    this.LayerNames.push(layerName);
  },
  drawStoplineShunyi() {
    let Stopline = new Stoplinesss(this.viewer);
    let WFSStoplinePolylineshunyiNoaltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Ashunyi_stopline&maxFeatures=50000&outputFormat=application%2Fjson`;
    Stopline.drawStoplinePolylineWFSPrimitive(WFSStoplinePolylineshunyiNoaltitude);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSStoplinePolylineshunyiNoaltitude);
    this.LayerNames.push(layerName);
  },
  drawStopline() {
    let Stopline = new Stoplinesss(this.viewer);
    // let WFSStoplinePolylineHengyang = "https://eagle.zhidaozhixing.com/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3AStopLine_Hengyang&maxFeatures=50000&outputFormat=application%2Fjson";
    let WFSStoplinePolylineHengyangNoAltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3AStopLine_Hengyang_Noaltitude&maxFeatures=50000&outputFormat=application%2Fjson`;
    Stopline.drawStoplinePolylineWFSPrimitive(WFSStoplinePolylineHengyangNoAltitude);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSStoplinePolylineHengyangNoAltitude);
    this.LayerNames.push(layerName);
  },
  drawArrowShunyi() {
    let Arrow = new Arrowsss(this.viewer);
    let WFSarrowPolygonShunyiNoaltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Ashunyi_arrow&maxFeatures=50000&outputFormat=application%2Fjson`;
    Arrow.drawArrowPolygonWFSPrimitive(WFSarrowPolygonShunyiNoaltitude);
    // Arrow.drawArrowPolygonWFS(WFSarrowPolygonShunyiNoaltitude);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSarrowPolygonShunyiNoaltitude);
    this.LayerNames.push(layerName);
  },
  drawArrow() {
    let Arrow = new Arrowsss(this.viewer);
    //衡阳箭头
    let WFSarrowPolygonHengyangNoaltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Aarrow_hengyang&maxFeatures=50000&outputFormat=application%2Fjson`;
    Arrow.drawArrowPolygonWFSPrimitive(WFSarrowPolygonHengyangNoaltitude);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSarrowPolygonHengyangNoaltitude);
    this.LayerNames.push(layerName);
  },
  drawZebraShunyi() {
    let Zebra = new Zebrasss(this.viewer);
    let WFSzebraPolygonShunyiNoaltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Ashunyi_zebra&maxFeatures=50000&outputFormat=application%2Fjson`;
    Zebra.drawZebraPolygonWFSPrimitive(WFSzebraPolygonShunyiNoaltitude);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSzebraPolygonShunyiNoaltitude);
    this.LayerNames.push(layerName);
  },
  drawZebra() {
    let Zebra = new Zebrasss(this.viewer);
    //衡阳斑马线
    let WFSzebraPolygonHengyangNoaltitude = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Azebra_Hengyang&maxFeatures=50000&outputFormat=application%2Fjson`;
    Zebra.drawZebraPolygonWFSPrimitive(WFSzebraPolygonHengyangNoaltitude);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSzebraPolygonHengyangNoaltitude);
    this.LayerNames.push(layerName);
  },
  drawStreetLightsShunyi() {
    let streetLight = new StreetLight(this.viewer);
    let WFSStreetLightsShunyi = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Ashunyi_streetlight_v1.0&maxFeatures=50000&outputFormat=application%2Fjson`;
    streetLight.drawStreetLightPrimitiveCollection(WFSStreetLightsShunyi);

    //用于日志记录，初始化的图层
    let layerName = cesiumUtils.getLayernameByWFSUrl(WFSStreetLightsShunyi);
    this.LayerNames.push(layerName);
  },
  //摄像头、公交站、交通信号灯、交通标志
  drawThreeAnchor() {
    //摄像头
    let WFScamera_hengyang = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Acamera_hengyang&maxFeatures=50000&outputFormat=application%2Fjson`;
    let WFSbusoverpass_hengyang = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Abusoverpass_hengyang&maxFeatures=50000&outputFormat=application%2Fjson`;
    let WFStrafficlight_hengyang = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Atrafficlight_hengyang&maxFeatures=50000&outputFormat=application%2Fjson`;
    let WFStrafficsign_hengyang = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Atrafficsign_hengyang&maxFeatures=50000&outputFormat=application%2Fjson`;
    let threeAnchor = new ThreeAnchor(this.viewer);
    threeAnchor.drawCamera(WFScamera_hengyang);
    // threeAnchor.drawTrafficlight(WFStrafficlight_hengyang);
    // threeAnchor.drawTrafficsign(WFStrafficsign_hengyang);
    threeAnchor.drawBusoverpass(WFSbusoverpass_hengyang);

    //读秒器
    let countdownSignal = new CountdownSignal(this.viewer);
    countdownSignal.drawCountdownSignalPicturePrimitive(WFStrafficlight_hengyang);

    //用于日志记录，初始化的图层
    let layerName1 = cesiumUtils.getLayernameByWFSUrl(WFScamera_hengyang);
    this.LayerNames.push(layerName1);
    let layerName2 = cesiumUtils.getLayernameByWFSUrl(WFSbusoverpass_hengyang);
    this.LayerNames.push(layerName2);
    let layerName3 = cesiumUtils.getLayernameByWFSUrl(WFStrafficlight_hengyang);
    this.LayerNames.push(layerName3);
  },
  drawThreeAnchorShunyi() {
    //摄像头
    // let WFScamera_shunyi = "https://eagle.zhidaozhixing.com/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Acamera_shunyi_V1.0&maxFeatures=50000&outputFormat=application%2Fjson";
    let WFScamera_shunyi = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Acamera_shunyi_V1.1&maxFeatures=50000&outputFormat=application%2Fjson`;
    let WFSbusoverpass_shunyi = "";
    // let WFStrafficlight_shunyi = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Atrafficlight_shunyi_V1.0&maxFeatures=50000&outputFormat=application%2Fjson`;
    let WFStrafficlight_shunyi = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Atrafficlight_shunyi_V1.1&maxFeatures=50000&outputFormat=application%2Fjson`;
    let WFStrafficsign_shunyi = "";
    // let WFSPole_shunyi = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Apole_shunyi_V1.0&maxFeatures=50000&outputFormat=application%2Fjson`;
    let WFSPole_shunyi = `${dataHost}/geoserver/mogoHDMap2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mogoHDMap2%3Apole_shunyi_V1.1&maxFeatures=50&outputFormat=application%2Fjson`;
    let threeAnchor = new ThreeAnchor(this.viewer);
    threeAnchor.drawCameraByType(WFScamera_shunyi);
    threeAnchor.drawTrafficlightByType(WFStrafficlight_shunyi);
    threeAnchor.drawPole(WFSPole_shunyi);

    // threeAnchor.drawTrafficsign(WFStrafficsign_hengyang);
    // threeAnchor.drawBusoverpass(WFSbusoverpass_hengyang);

    //用于日志记录，初始化的图层
    let layerName1 = cesiumUtils.getLayernameByWFSUrl(WFScamera_shunyi);
    this.LayerNames.push(layerName1);
    let layerName2 = cesiumUtils.getLayernameByWFSUrl(WFStrafficlight_shunyi);
    this.LayerNames.push(layerName2);
    let layerName3 = cesiumUtils.getLayernameByWFSUrl(WFSPole_shunyi);
    this.LayerNames.push(layerName3);
  },
  setRotate(entity) {
    var rotateX = -30;
    var rotateY = 0;
    var rotateZ = 0;
    const origin = entity.position.getValue();
    const heading = Cesium.Math.toRadians(rotateX);
    const pitch = Cesium.Math.toRadians(rotateY);
    const roll = Cesium.Math.toRadians(rotateZ);

    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(origin, hpr);
    entity.orientation = orientation;
  },
  clearRoam() {
    if (this.isPlyay) {
      this.viewer.animation.viewModel.pauseViewModel.command();
      this.isPlyay = false;
    }
    this.trackedAnimate.clearRoam();
    this.viewer.entities.remove(this.entity2);
    this.entity2 = undefined;
    this.launchedAnimate = false;
    //清除弹窗
    if (this.Window1) {
      this.Window1.windowClose();
      this.Window1 = undefined;
    }
  },
  //实体选中事件
  selectedEntityChanged(entity, type, cb) {
    if (!entity) return;
    if (typeof cb !== "function") return;
    if (this.clickedEntity) {
      let { model } = this.clickedEntity;
      if (model && model.silhouetteColor) {
        model.silhouetteColor = new Cesium.Color(0, 0, 1.0, 0.0);
      }
      if (this.clickedEntity.silhouetteColor) {
        this.clickedEntity.silhouetteColor = new Cesium.Color(0, 0, 1.0, 0.0);
      }
    }
    this.clickedEntity = entity;
    const { id } = entity;
    console.log("clickid:", id);
    if (!id) return;
    let entityTypeExec = /camera|trafficlight|realtimeEntity/gi.exec(id);
    let entityType = entityTypeExec ? entityTypeExec[0] : "";
    if (!entityType) return;
    let sn;
    // entityType:trafficlight | camera | realtimeEntity
    if (entityType === "camera") {
      sn = id.slice(id.lastIndexOf(".") + 1);
    } else if (entityType === "trafficlight") {
      let splitId = id.split("|")[0];
      sn = splitId.slice(splitId.lastIndexOf(".") + 1);
    } else if (entityType === "realtimeEntity") {
      let splitIds = id.split("-")[0];
      sn = id.slice(splitIds.length + 1);
      // 进入第一视角
    }
    if (entity.model && entity.model.silhouetteColor) {
      entity.model.silhouetteColor = new Cesium.Color(0, 0, 1.0, 1.0);
      entity.model.silhouetteSize = 2.0;
    }
    if (entity.silhouetteColor) {
      entity.silhouetteColor = new Cesium.Color(0, 0, 1.0, 1.0);
      entity.silhouetteSize = 2.0;
    }
    if (entityType === type && sn) {
      cb(sn, entity);
    }
  },

  destroy() {
    if (this.Window1) {
      this.Window1.windowClose();
      this.Window1 = undefined;
    }
    this.viewer.entities.removeAll();
    this.viewer.imageryLayers.removeAll(true);
    this.viewer.destroy();
  },
};
export default cesiumInit;
