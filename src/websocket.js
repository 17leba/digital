import * as turf from "@turf/turf";

import {
  RealtimeAnimateBySocket,
  diffOperate,
  diffAddRemoveOperate,
  diffUpdateOperate,
  confirmRemove,
  MapUtils,
} from "web3dapisdk";
import { map3dConfig } from "./const";

let rtAnimateBySocket = {
  init(viewer) {
    this.viewer = viewer;
    this.lastallList = [];
    //倒数第三个点
    this.antepenultimate = [];
    this.curStatus = 0;
    this.updateListRender = [];
    this.lastallListRender = [];
    this.isPlay = false;
    //轨迹往后预测的当前段的长度的倍数
    this.forecastMultiple = 1;
    //存储收到的数据
    this.receivedLists = [];
    this.lostList = [];
    this.tempDataSize = 8;
    this.mapUtils = new MapUtils(viewer);
    //存储的点数
    this.storeNum = 50;
    this.LasttimeNeedRemoveList = [];
    this.sn = Math.floor(Math.random() * 10000);
    this.realtimeAnimateBySocket = new RealtimeAnimateBySocket(this.viewer);
  },
  render(allList) {
    let alllist = alllist;
    if (this.lastallList.length === 0) {
      for (let i = 0; i < allList.length; i++) {
        this.realtimeAnimateBySocket.add(allList[i]);
      }
    } else {
      let changeList = diffOperate(this.lastallList, allList);
      let addList = changeList.add;
      let updateList = changeList.update;
      let removeList = changeList.remove;
      // console.log("addList:" + addList);
      // console.log("updateList:" + updateList);
      // console.log("removeList:" + removeList);
      for (let i = 0; i < addList.length; i++) {
        // if(addList[i].type === 3){
        this.realtimeAnimateBySocket.add(addList[i]);
        // }
      }
      for (let i = 0; i < updateList.length; i++) {
        // if(updateList[i].type === 3){
        this.realtimeAnimateBySocket.update(updateList[i]);
        // }
      }
      for (let i = 0; i < removeList.length; i++) {
        // if(removeList[i].type === 3){
        //加前缀
        this.realtimeAnimateBySocket.remove(removeList[i]);
        // }
      }
    }
  },
  render2(allList) {
    if (this.lastallList.length === 0) {
      for (let i = 0; i < allList.length; i++) {
        this.realtimeAnimateBySocket.add(allList[i]);
      }
    } else {
      let changeList = diffOperate(this.lastallList, allList);
      let addList = changeList.add;
      let removeList1 = changeList.remove;
      let updateList = changeList.update;
      let removeList = [];
      //上次需要删除的数据，判断是否在当次数据中
      if (this.LasttimeNeedRemoveList.length != 0) {
        //连续两次数据都不包含，则删除该实体
        let confirmResult = confirmRemove(allList, this.LasttimeNeedRemoveList);
        removeList = confirmResult;
      }
      // removeList = removeList1;
      // console.log("addList:" + addList);
      // console.log("updateList:" + updateList);
      // console.log("removeList:" + removeList);
      for (let i = 0; i < addList.length; i++) {
        let isIn = false;
        for (let j = 0; j < this.LasttimeNeedRemoveList.length; j++) {
          //是否在上次缺失的数据集里面，如果是就更新位置，因为上次没有删除该实体
          if (addList[i].uuid === this.LasttimeNeedRemoveList[j].uuid) {
            isIn = true;
            this.realtimeAnimateBySocket.update(addList[i], this.receivedLists);
          }
        }
        if (!isIn) {
          this.realtimeAnimateBySocket.add(addList[i]);
        }
        // this.realtimeAnimateBySocket.add(addList[i]);
      }
      for (let i = 0; i < updateList.length; i++) {
        this.realtimeAnimateBySocket.update2(updateList[i], this.receivedLists);
      }
      for (let i = 0; i < removeList.length; i++) {
        this.realtimeAnimateBySocket.remove(removeList[i]);
      }
      //将当次需要删除的数据保存起来，用于下一次数据来之后判断是否在下一次数据中
      this.LasttimeNeedRemoveList = [];
      this.LasttimeNeedRemoveList = removeList1;
    }
  },
  initWebSocket(v) {
    this.removeSenddata();
    // let lostListF = manyTimesLostList(this.tempDataSize);
    this.socket = new WebSocket(map3dConfig.wsHost);
    // this.socket = new WebSocket("ws://172.30.33.77:3335/ws");
    this.socket.addEventListener("open", async (e) => {
      if (e.currentTarget["readyState"] === WebSocket.OPEN) {
        this.sendWS(v);
        //开始渲染循环
        this.isPlay = true;
        this.AnimationFrame2();
      }
    });
    this.socket.addEventListener("message", (e) => {
      const res = JSON.parse(e.data);
      if (!res.data) return;
      const data = JSON.parse(res.data);
      const { allList } = data;
      //补帧
      this.dataHandlingAndRender(allList);
      //补帧，加预测
      //  this.dataHandlingForecastAndRender(allList);

      // 单车跟踪模式
      if (v && v.traceOpen) {
        const { sn } = v;
        let curEntity = this.mapUtils.getModelPrimitiveById("realtimeEntity-" + sn);
        if (this.curStatus) {
          if (curEntity) {
            this.viewer.trackedEntity = curEntity;
          }
        } else {
        }
        //   if (curEntity)
      }
      /* if (lostListF.getCount() > this.tempDataSize) {
          lostListF.destroy();
        } else {
          this.lostList = lostListF.removeList(allList);
        }
        let filterList = allList;
        if (this.lostList.length) {
          filterList = allList.filter((v) => this.lostList.indexOf(v.uuid) === -1);
        } */
      //添加实体
      // this.render(allList);

      // this.render(allList);
      // this.lastallList = [];
      // this.lastallList = allList;
    });
    this.socket.addEventListener("error", (e) => {
      console.log("websocket--error:", e);
    });
    this.socket.addEventListener("close", (e) => {
      console.log("websocket--close:", e);
    });
  },
  removeSenddata() {
    if (this.socket) {
      this.isPlay = false;
      this.socket.close();
      this.socket = null;
      // console.log("removeSenddata this.socket:" + this.socket);
    }
  },
  dataHandlingForecastAndRender(allList) {
    try {
      let allListAddAttribute = [];
      for (let i = 0; i < allList.length; i++) {
        let time = new Date().getTime();
        let str = JSON.stringify(allList[i]);
        let obj = JSON.parse(str);
        let isFind = false;
        let units = { units: "kilometers" };
        for (let j = 0; j < this.lastallList.length; j++) {
          if (allList[i].uuid === this.lastallList[j].uuid) {
            isFind = true;
            //当前段的长度
            let point1Arr = [this.lastallList[j].wgslon, this.lastallList[j].wgslat];
            let point2Arr = [obj.wgslon, obj.wgslat];
            let point1 = turf.point(point1Arr);
            let point2 = turf.point(point2Arr);
            let bearing = turf.bearing(point1, point2);
            let segmenlineTwoPoint = turf.lineString([point1Arr, point2Arr]);
            let segmentLength = turf.lineDistance(segmenlineTwoPoint);
            //沿着线的方向往下预测，平移
            let forecastLength = segmentLength * this.forecastMultiple; //轨迹往后预测的当前段的长度的倍数
            let segmenlineForecast = turf.transformTranslate(
              segmenlineTwoPoint,
              forecastLength,
              bearing + 0,
              units
            );
            let segmenlineForecastArr = segmenlineForecast.geometry.coordinates;
            let forcastPointArr = segmenlineForecastArr[1];
            let durationTwoPoint = time - this.lastallList[j].beginTime;
            let forecastTime = durationTwoPoint * this.forecastMultiple;
            let duration = durationTwoPoint + forecastTime;

            obj["duration"] = duration;
            obj["lastwgslon"] = this.lastallList[j].currentwgslon;
            obj["lastwgslat"] = this.lastallList[j].currentwgslat;
            obj["currentwgslon"] = this.lastallList[j].currentwgslon;
            obj["currentwgslat"] = this.lastallList[j].currentwgslat;
            obj["nextwgslon"] = forcastPointArr[0];
            obj["nextwgslat"] = forcastPointArr[1];
            obj["beginTime"] = time;
            break;
          }
        }
        if (!isFind) {
          obj["duration"] = 0;
          obj["currentwgslon"] = obj.wgslon;
          obj["currentwgslat"] = obj.wgslat;
          obj["beginTime"] = time;
        }
        allListAddAttribute.push(obj);
      }
      console.log("allListAddAttribute:", allListAddAttribute);
      this.render5(allListAddAttribute); //补帧，headign作为航向角
      this.lastallList = [];
      this.lastallList = allListAddAttribute;
    } catch (e) {
      console.log("dataHandlingForecastAndRender-error:", e);
    }
  },
  //headign作为航向角
  render5(allList) {
    let changeList = diffOperate(this.lastallList, allList);
    let addList = changeList.add;
    let updateList = changeList.update;
    let removeList = changeList.remove;
    console.log("addList:" + addList);
    console.log("updateList:" + updateList);
    console.log("removeList:" + removeList);
    for (let i = 0; i < addList.length; i++) {
      // if(addList[i].type === 3){
      this.realtimeAnimateBySocket.add(addList[i]);
      // }
    }

    this.updateListRender = updateList;
    console.log("this.updateListRender:", this.updateListRender);

    for (let i = 0; i < removeList.length; i++) {
      // if(removeList[i].type === 3){
      this.realtimeAnimateBySocket.remove(removeList[i]);
      // }
    }
  },
  setView() {
    let p = Cesium.Cartesian3.fromDegrees(116.7356604713664, 40.19832687206192, 100);
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
  sendWS(v = {}) {
    const { lat = 40.19915, lng = 116.738259, trace = 0, traceOpen = 0, sn } = v;
    // 发送设备信息绑定
    this.socket.send(
      JSON.stringify({
        type: "REPORT",
        lat: lat,
        lon: lng,
        sn: sn || this.sn,
        // sn: "1117779",
        // sn: "2228888",
        businessType: 3,
        heading: 1,
        dataAccuracy: 1,
        satelliteTime: +new Date(),
        systemTime: +new Date(),
        // trace=1表示单车追踪，0表示非单车追踪
        color: trace,
        // traceOpen=1表示跟踪，0表示停止跟踪
        cardId: traceOpen,
      })
    );
    if (traceOpen) {
      /* this.curStatus = 1;
      window.traceOpenTimerId = setTimeout((_) => {
        window.clearTimeout(window.traceOpenTimerId);
        this.curStatus = 0;
      }, 5000); */
    }
  },
  beatHeart() {
    this.wsBeatHeart = setInterval((_) => {
      if (this.socket) {
        this.sendWS();
      }
    }, 5 * 1000);
  },
  clearBeatHeart() {
    if (this.wsBeatHeart) {
      clearInterval(this.wsBeatHeart);
      this.wsBeatHeart = null;
    }
  },
  //渲染动画方法，独立运行
  AnimationFrame2() {
    console.log("this.isPlay:", this.isPlay);
    if (this.isPlay) {
      let units = { units: "kilometers" };
      for (let i = 0; i < this.updateListRender.length; i++) {
        let Listpacket = this.updateListRender[i];
        // console.log("Listpacket:",Listpacket)
        if (Listpacket.duration > 0) {
          let timeRender = new Date().getTime();
          let point1Arr = [Listpacket.lastwgslon, Listpacket.lastwgslat];
          let point2Arr = [Listpacket.nextwgslon, Listpacket.nextwgslat];

          let lineTwoPoint = turf.lineString([point1Arr, point2Arr]);
          let lineTwoPointLength = turf.lineDistance(lineTwoPoint);
          let nDistance =
            lineTwoPointLength * ((timeRender - Listpacket.beginTime) / Listpacket.duration);
          // let nDistance = lineTwoPointLength/2;
          // console.log("nDistance:",nDistance);
          let pointCurrent = turf.along(lineTwoPoint, nDistance, units);
          let pointCurrentArr = pointCurrent.geometry.coordinates;
          Listpacket.currentwgslon = pointCurrentArr[0];
          Listpacket.currentwgslat = pointCurrentArr[1];
        }
        this.realtimeAnimateBySocket.update(Listpacket);
      }
      requestAnimationFrame(() => {
        this.AnimationFrame2();
      }); // 返回值是一个long整数,请求ID,是回调列表中唯一的标识，你可以传这个值给window.cancelAnimationFrame()以取消回调函数
      // setTimeout(() => {
      //   this.AnimationFrame();
      // }, 25);
    }
  },

  
  updateShowId(Listpacket) {
    try {
      let position = Cesium.Cartesian3.fromDegrees(Listpacket.wgslon, Listpacket.wgslat, 0);
      // let gheading = Listpacket.heading/180* Math.PI;
      // let gheading = -90/180* Math.PI;
      let gheading = ((Listpacket.heading - 90) / 180) * Math.PI;
      let gpitch = Cesium.Math.toRadians(0);
      let groll = Cesium.Math.toRadians(0);
      let hpr = new Cesium.HeadingPitchRoll(gheading, gpitch, groll);
      let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
      let tempentity = this.viewer.entities.getById("realtimeEntity-" + Listpacket.uuid);
      let positionLasttime = tempentity.position;
      let satelliteTimeLasttime = tempentity.satelliteTime;
      tempentity.satelliteTime =
        Listpacket.satelliteTime != undefined ? Listpacket.satelliteTime.toString() : 0;
      tempentity.position = position;
      tempentity.orientation = orientation;
      
    } catch (e) {
      console.log("update:" + e);
    }
  },
  addFirstPersonPerspectiveByEntity(id) {
    let entity = this.viewer.entities.getById(`realtimeEntity-${id}`);
    if (entity) {
      this.viewer.trackedEntity = entity;
      //(前后距离，左右距离，上下距离)
      //传一个3纬数组，必须为数字，可以不传，默认为[-30,0,10]
      // parameters[0]>=-200 && parameters[0]<=200
      // && parameters[1]>=-30 && parameters[1]<=30
      // && parameters[2]>=-200 && parameters[2]<=200
      let firstpersonPerspectiveParameters = [-10, 0, 20];
      this.realtimeAnimateBySocket.addFirstPersonPerspectiveByEntity(
        firstpersonPerspectiveParameters,
        entity
      );
    }
  },
  removeFirstPersonPerspectiveByEntity() {
    this.realtimeAnimateBySocket.removeFirstPersonPerspectiveByEntity();
    this.viewer.trackedEntity = null;
  },
  dataHandlingAndRender(allList) {
    try {
      let allListAddAttribute = [];
      for (let i = 0; i < allList.length; i++) {
        let time = new Date().getTime();
        let str = JSON.stringify(allList[i]);
        let obj = JSON.parse(str);
        let isFind = false;
        for (let j = 0; j < this.lastallList.length; j++) {
          if (allList[i].uuid === this.lastallList[j].uuid) {
            isFind = true;
            obj["duration"] = time - this.lastallList[j].beginTime;
            obj["lastwgslon"] = this.lastallList[j].currentwgslon;
            obj["lastwgslat"] = this.lastallList[j].currentwgslat;
            obj["currentwgslon"] = this.lastallList[j].currentwgslon;
            obj["currentwgslat"] = this.lastallList[j].currentwgslat;
            obj["nextwgslon"] = obj.wgslon;
            obj["nextwgslat"] = obj.wgslat;
            obj["beginTime"] = time;
            break;
          }
        }
        if (!isFind) {
          obj["duration"] = 0;
          obj["currentwgslon"] = obj.wgslon;
          obj["currentwgslat"] = obj.wgslat;
          obj["beginTime"] = time;
        }
        allListAddAttribute.push(obj);
      }
      console.log("allListAddAttribute:", allListAddAttribute);
      this.render5(allListAddAttribute); //补帧，headign作为航向角
      this.lastallList = [];
      this.lastallList = allListAddAttribute;
    } catch (e) {
      console.log("dataHandlingAndRender-error:", e);
    }
  },
  destroy() {
    this.removeSenddata();
    this.viewer.entities.removeAll();
    // this.viewer.imageryLayers.removeAll(true);
    this.viewer.destroy();
    this.clearBeatHeart();
    // webworker
  },
};
export default rtAnimateBySocket;
