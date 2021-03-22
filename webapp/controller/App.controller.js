sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("com.mjzsoft.FileUploader0Auto.controller.App", {

		onInit : function () {
			
			// Listen for app busy signal 
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.subscribe("App", "StartAppBusy", this.startAppBusy, this);
			oEventBus.subscribe("App", "StopAppBusy", this.stopAppBusy, this);
			
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay(),
				oComponent = this.getOwnerComponent();

			oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				layout : "OneColumn",
				previousLayout : "",
				actionButtonsInfo : {
					midColumn : {
						fullScreen : false
					}
				},
				// Controlling single upload at time
				uploadEnabled: true,
				// Permissions can change per user
				fileReadPermission: true,
				fileDeletePermission: true,
				fileEditPermission: true,
				fileUploadPermission: true
			});
			oComponent.setModel(oViewModel, "appView");
			
			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
			this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
			this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		},
		
		/** 
		 * Returns the `appView` model 
		 * @function
		 * @public
		 * @returns {sap.ui.model.json.JSONModel} JSONModel
		 */
		getViewModel: function () {
			return this.getAppViewModel();
		},
		
		/** 
		 * Inactivates the app busy indicator
		 * @function
		 * @public
		 */
		stopAppBusy: function () {
			this.getViewModel().setProperty("/busy", false);
		},

		/** 
		 * Activates the app busy indicator
		 * @function
		 * @public
		 */
		startAppBusy: function () {
			this.getViewModel().setProperty("/busy", true);
		}

	});
});