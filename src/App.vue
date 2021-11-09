<template>
  <div class="app-wrapp">
    <div class="cesium-container" id="cesium-container"></div>
  </div>
</template>
<script>
import cesiumInit from "./gis3d.js";
import rtAnimateBySocket from "./websocket.js";

export default {
  data() {
    return {
    };
  },
  mounted() {
    var viewer;
    let position = {};
    this.$nextTick((_) => {
      initViewer("cesium-container");
      this.viewer = cesiumInit.init(viewer, position);
      rtAnimateBySocket.init(viewer);
      //初始化viewer
      this.addRealtimeEntityBySocket();
    });

    function initViewer(el) {
      var vmodels = Cesium.createDefaultImageryProviderViewModels();
      viewer = new Cesium.Viewer(el, {
        infoBox: false,
        selectionIndicator: true,
        navigation: false,
        animation: true,
        timeline: false,
        //selectedImageryProviderViewModel:vmodels[15],
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false, //控制右上角第三个位置的选择视角模式，2d，3d
        navigationHelpButton: false,
        shouldAnimate: true,
        //shadows: true,//阴影

        imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
          url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
        }),
      });

      viewer._cesiumWidget._creditContainer.style.display = "none"; //取消版权信息
      viewer.animation.container.style.visibility = "hidden"; // 不显示动画控件
      viewer.scene.globe.depthTestAgainstTerrain = false;
      //取消双击锁定事件
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      );
      //抗锯齿
      if (Cesium.FeatureDetection.supportsImageRenderingPixelated()) {
        //判断是否支持图像渲染像素化处理
        viewer.resolutionScale = window.devicePixelRatio;
      }
      //开启抗锯齿
      viewer.scene.fxaa = true;
      viewer.scene.postProcessStages.fxaa.enabled = true;
      viewer.scene.debugShowFramesPerSecond = true;
      //mapbox dark-v9 暗黑色地图
      //streets-v11 白色底图
      // satellite-streets-v10
      let layer = new Cesium.MapboxStyleImageryProvider({
        styleId: "dark-v9",
        accessToken:
          "pk.eyJ1IjoiamFja3BhbmciLCJhIjoiY2twaHFxZGhiMmd4NzJwbGFuMTQ4OXpncyJ9.FFp8wnBm3dmM8XkAeuHdmA",
        scaleFactor: true,
      });
      viewer.scene.globe.enableLighting = true;
      //viewer.imageryLayers.addImageryProvider(layer);
      //显示纯色地球
      viewer.imageryLayers.get(0).show = false; //不显示底图
      //let earthColor = "27,39,79";  //交通云平台陆地颜色
      let earthColor = "27,37,78"; //交通云平台陆地颜色
      //viewer.scene.globe.baseColor = Cesium.Color.WHITE;//设置地球颜色
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(
        "rgb(" + earthColor + ")"
      ); //设置地球颜色

      //定义光源位置
      let directionalLight = new Cesium.DirectionalLight({
        direction: new Cesium.Cartesian3.fromDegrees(
          112.51123206,
          26.87873453,
          1000
        ),
      });
      let originLight = viewer.scene.light;
      //viewer.scene.light = directionalLight;

      //设置当前时间
      let clock = new Cesium.Clock();
      let clockViewModel = new Cesium.ClockViewModel(clock);
      let viewModel = viewer.animation.viewModel;
      //clockViewModel.currentTime = Cesium.JulianDate.fromIso8601("2012-03-15T15:00:00Z");
      //viewModel.currentTime = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 15));
      viewer.clockViewModel.currentTime = Cesium.JulianDate.fromDate(
        new Date(2015, 2, 25, 9)
      );
      //viewer.clockViewModel.clock.currentTime = Cesium.JulianDate.fromIso8601("2017-07-11T9:00:00Z");
      //柔和阴影
      viewer.shadowMap.softShadows = true;
      viewer.shadowMap.darkness = 0.7;

      //指北针
      var options = {};
      // 用于在使用重置导航重置地图视图时设置默认视图控制。接受的值是Cesium.Cartographic 和 Cesium.Rectangle.
      options.defaultResetView = Cesium.Rectangle.fromDegrees(80, 22, 130, 50);
      // 用于启用或禁用罗盘。true是启用罗盘，false是禁用罗盘。默认值为true。如果将选项设置为false，则罗盘将不会添加到地图中。
      options.enableCompass = true;
      // 用于启用或禁用缩放控件。true是启用，false是禁用。默认值为true。如果将选项设置为false，则缩放控件将不会添加到地图中。
      options.enableZoomControls = true;
      // 用于启用或禁用距离图例。true是启用，false是禁用。默认值为true。如果将选项设置为false，距离图例将不会添加到地图中。
      options.enableDistanceLegend = true;
      // 用于启用或禁用指南针外环。true是启用，false是禁用。默认值为true。如果将选项设置为false，则该环将可见但无效。
      options.enableCompassOuterRing = true;

      //CesiumNavigation.umd(viewer, options);
    }
  },

  methods: {
    addRealtimeEntityBySocket() {
      rtAnimateBySocket.initWebSocket();
    },
    removeRealtimeEntityBySocket() {
      rtAnimateBySocket.removeSenddata();
    },
  },
  beforeDestroy() {
    cesiumInit.destroy();
    rtAnimateBySocket.destroy();
  },
};
</script>
<style  scoped>
.app-wrapp {
  position: absolute;
  left: 0;
  width: 100%;
  height: 100%;
}
.cesium-container {
  height: 100%;
  width: 100%;
}
</style>
