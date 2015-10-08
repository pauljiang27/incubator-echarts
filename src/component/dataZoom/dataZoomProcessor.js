/**
 * @file Data zoom processor
 */
define(function (require) {

    var echarts = require('../../echarts');
    var zrUtil = require('zrender/core/util');
    var linearMap = require('../../util/number').linearMap;

    echarts.registerProcessor(function (ecModel) {
        ecModel.eachComponent('dataZoom', function (dataZoomModel) {
            dataZoomModel.eachTargetAxis(processSingleAxis);
        });
    });

    // TODO
    // undo redo

    function processSingleAxis(dimNames, axisIndex, dataZoomModel, ecModel) {

        // Process axis data
        var axisModel = ecModel.getComponent(dimNames.axis, axisIndex);
        var isCategoryFilter = axisModel.get('type') === 'category';
        var seriesModels = dataZoomModel.getTargetSeriesModels(dimNames.name, axisIndex);
        var dataExtent = calculateDataExtent(dimNames, axisModel, seriesModels);
        var dataWindow = calculateDataWindow(axisModel, dataZoomModel, dataExtent, isCategoryFilter);

        // if (isCategoryFilter) {
            // var axisData = axisModel.getData();
            // FIXME
            // setter?
            // axisData = axisModel.option.data = axisData.slice(dataWindow[0], dataWindow[1] + 1);
        // }

        // Process series data
        zrUtil.each(seriesModels, function (seriesModel) {
            // FIXME
            // 这里仅仅处理了list类型
            var seriesData = seriesModel.getData();
            if (!seriesData) {
                return;
            }

            // if (isCategoryFilter) {
            //     seriesData.filterSelf(function (entry) {
            //         var dataIndex = entry[dimNames.getter]();
            //         var reserve = dataIndex >= dataWindow[0] && dataIndex <= dataWindow[1];
            //         if (reserve) {
            //             entry.setDataIndex(dataIndex - dataWindow[0]);
            //         }
            //         return reserve;
            //     });
            // }
            // else {
            //     seriesData.filterSelf(function (entry) {
            //         var value = entry[dimNames.getter]();
            //         return value >= dataWindow[0] && value <= dataWindow[1];
            //     });
            // }
            seriesData.filterSelf(dimNames.name, function (value) {
                return value >= dataWindow[0] && value <= dataWindow[1];
            });

            // FIXME
            // 对于value轴的过滤（另一个轴是category），效果有问题，现在简单去除节点不行。
            // FIXME
            // 对于数值轴，还要考虑log等情况.
            // FIXME
            // 对于时间河流图，还要考虑是否须整块移除。
        });
    }

    function calculateDataExtent(dimNames, axisModel, seriesModels) {
        var dataExtent = [Number.MAX_VALUE, Number.MIN_VALUE];

        // if (axisModel.get('type') === 'category') {
        //     // Only category axis has property 'data's.
        //     var axisData = axisModel.getData() || [];
        //     dataExtent = [0, axisData.length];
        // }
        // else {
        zrUtil.each(seriesModels, function (seriesModel) {
            var seriesData = seriesModel.getData();
            if (seriesData) {
                var seriesExtent = seriesData.getDataExtent(dimNames.name);
                seriesExtent[0] < dataExtent[0] && (dataExtent[0] = seriesExtent[0]);
                seriesExtent[1] > dataExtent[1] && (dataExtent[1] = seriesExtent[1]);
            }
        }, this);
        // }

        return dataExtent;
    }

    function calculateDataWindow(axisModel, dataZoomModel, dataExtent, isCategoryFilter) {
        var dataZoomRange = dataZoomModel.getRange();
        var percentExtent = [0, 100];

        var result = [
            linearMap(dataZoomRange[0], percentExtent, dataExtent, true),
            linearMap(dataZoomRange[1], percentExtent, dataExtent, true)
        ];
        if (isCategoryFilter) {
            result = [Math.floor(result[0]), Math.ceil(result[1])];
        }

        return result;
    }

});
