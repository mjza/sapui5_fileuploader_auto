sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/UploadCollectionParameter",
	"sap/m/PDFViewer",
	"sap/m/MessageToast"
], function (Controller, History, Filter, FilterOperator, UploadCollectionParameter, PDFViewer, MessageToast) {
	"use strict";

	return Controller.extend("com.mjzsoft.FileUploader0Auto.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},

		/* =========================================================== */
		/* File Uploader                        					   */
		/* =========================================================== */
		
		/**
		 * Convenience method for getting the app view model.
		 * @public
		 * @returns {sap.ui.model.Model} the appView model instance
		 */
		getAppViewModel: function () {
			return this.getOwnerComponent().getModel("appView");
		},
		
		/** 
		 * Will publish a message on the event bus for starting the busy indicator 
		 * when `AppController` is the view manager.
		 */
		startAppBusy: function () {
			sap.ui.getCore().getEventBus().publish("App", "StartAppBusy", null);
		},

		/** 
		 * Will publish a message on the event bus for stopping the busy indicator 
		 * when `AppController` is the view manager.
		 */
		stopAppBusy: function () {
			sap.ui.getCore().getEventBus().publish("App", "StopAppBusy", null);
		},
		
		/** 
		 * change event triggered for UploadCollection
		 * @param {sap.ui.base.Event} oEvent pattern match event in change
		 */
		onUploadCollectionChange: function (oEvent) {
			var oDataModel = this.getView().getModel("filesModel");
			var oUploadCollection = oEvent.getSource();
			oUploadCollection.setUploadUrl(oDataModel.sServiceUrl + "/DocumentFileSet");
		},

		/** 
		 * too big file exception by UploadCollection
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onFileSizeExceed: function (oEvent) {
			MessageToast.show(this.getResourceBundle().getText("fileUploader_ErrorMaxSize"));
		},

		/** 
		 * too big file name length exception by UploadCollection
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onFilenameLengthExceed: function (oEvent) {
			MessageToast.show(this.getResourceBundle().getText("fileUploader_ErrorMaxFileNameSize"));
		},

		/** 
		 * not supported format error
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onTypeMissmatch: function (oEvent) {
			MessageToast.show(this.getResourceBundle().getText("fileUploader_ErrorFormatSupport"));
		},

		/** 
		 * file uploading complete
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onUploadComplete: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
			oUploadCollection.getBinding("items").refresh();
			oUploadCollection.setUploadUrl(null);
			this.getAppViewModel().setProperty("/uploadEnabled", true);
		},

		/** 
		 * file uploading terminated
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onUploadTerminated: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
			oUploadCollection.getBinding("items").refresh();
			oUploadCollection.setUploadUrl(null);
			this.getAppViewModel().setProperty("/uploadEnabled", true);
		},

		/** 
		 * fileRenamed event of UpladCollection
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onFileRenamed: function (oEvent) {
			var oUploadCollection = oEvent.getSource(),
				oDataModel = this.getView().getModel("filesModel"),
				oUploadCollectionItem = oEvent.getParameter("item"),
				sObjectId = oUploadCollection.data("myObjectId"),
				sObjectType = oUploadCollection.data("myObjectType"),
				sDocumentType = oUploadCollection.data("myDocumentType"),
				sFileId = oEvent.getParameter("documentId"),
				sDocumentnumber = oUploadCollectionItem.data("myDocumentnumber"),
				sFilePath = "/" + oDataModel.createKey("DocObjFileSet", {
					Objecttype: sObjectType,
					Objectkey: sObjectId,
					Documentnumber: sDocumentnumber,
					Documenttype: sDocumentType,
					FileId: sFileId
				}),
				oFile = oDataModel.getProperty(sFilePath);
			oFile.FileName = oEvent.getParameter("fileName");
			// only PUT is working to update file
			oDataModel.sDefaultUpdateMethod = "PUT";
			oDataModel.update(sFilePath, oFile, {
				success: function () {
					oDataModel.sDefaultUpdateMethod = "MERGE";
					MessageToast.show(this.getResourceBundle().getText("fileUploader_SuccessRenaming"));
				}.bind(this),
				error: function () {
					oDataModel.sDefaultUpdateMethod = "MERGE";
				}
			});
		},

		/** 
		 * preconfiguration before file upload starts
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onBeforeUploadStarts: function (oEvent) {
			var oUploadCollection = oEvent.getSource(),
				oDataModel = this.getView().getModel("filesModel"),
				token = oDataModel.getSecurityToken(),
				sFileName = oEvent.getParameter("fileName"),
				sObjectId = oUploadCollection.data("myObjectId"),
				sObjectType = oUploadCollection.data("myObjectType"),
				sDocumentType = oUploadCollection.data("myDocumentType");

			// check for existence:
			var aItems = oUploadCollection.getItems();
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].getFileName() === sFileName) {
					oEvent.bCancelBubble = true;
					oEvent.preventDefault();
					MessageToast.show(this.getResourceBundle().getText("fileUploader_ErrorDuplicateFileName"));
					return;
				}
			}

			if (!String.prototype.endsWith) { // To resolve IE problem 
				String.prototype.endsWith = function (sSearchString, iPosition) { // eslint-disable-line
					var subjectString = this.toString(),
						iPos = iPosition;
					if (typeof iPos !== "number" || !isFinite(iPos) || Math.floor(iPos) !== iPos || iPos > subjectString.length) {
						iPos = subjectString.length;
					}
					iPos -= sSearchString.length;
					var lastIndex = subjectString.indexOf(sSearchString, iPos);
					return lastIndex !== -1 && lastIndex === iPos;
				};
			}

			var sSlug = "***" + encodeURIComponent(sFileName) + "***" + encodeURIComponent(sObjectType) + "***" + encodeURIComponent(sObjectId) +
				"***" + encodeURIComponent(sDocumentType) + "***";
			oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
				name: "SLUG",
				value: sSlug
			}));
			oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
				name: "x-csrf-token",
				value: token
			}));
			// set suitable mime type for emails
			if (sFileName.endsWith("msg")) {
				oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
					name: "Content-Type",
					value: "application/vnd.ms-outlook"
				}));
			}

			this.getAppViewModel().setProperty("/uploadEnabled", false);
		},

		/** 
		 * event by click on deleting of file
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onFileDeleted: function (oEvent) {
			var oUploadCollection = oEvent.getSource(),
				sFileId = oEvent.getParameter("documentId"),
				oUploadCollectionItem = oEvent.getParameter("item"),
				oModel = this.getModel("filesModel"),
				sObjectId = oUploadCollection.data("myObjectId"),
				sObjectType = oUploadCollection.data("myObjectType"),
				sDocumentType = oUploadCollection.data("myDocumentType"),
				sDocumentnumber = oUploadCollectionItem.data("myDocumentnumber"),
				sFilePath = "/" + oModel.createKey("DocObjFileSet", {
					Objecttype: encodeURIComponent(sObjectType),
					Objectkey: encodeURIComponent(sObjectId),
					Documenttype: encodeURIComponent(sDocumentType),
					Documentnumber: encodeURIComponent(sDocumentnumber),
					FileId: encodeURIComponent(sFileId)
				});
			this.startAppBusy();
			oModel.remove(sFilePath, {
				success: function (oData, oResponse) {
					this.stopAppBusy();
					oUploadCollection.getBinding("items").refresh();
					MessageToast.show(this.getResourceBundle().getText("fileUploader_FileRemovingSuccess"));
				}.bind(this),
				error: function (oError) {
					this.stopAppBusy();
					MessageToast.show(this.getResourceBundle().getText("fileUploader_ErrorFileProcess"));
				}.bind(this)
			});
		},

		/** 
		 * configures link to download file
		 * @param {string} sFileId the file id
		 * @param {string} sDocumentnumber the document number
		 * @param {string} sDocumenttype the document type 
		 * @param {boolean} bPermission user permission for file reading 
		 * @returns {string|undefined} link for the file
		 */
		getFileUrl: function (sFileId, sDocumentnumber, sDocumenttype, bPermission) {
			var oModel = this.getModel("filesModel"),
				sFilePath = "/" + oModel.createKey("DocumentFileSet", {
					FileId: encodeURIComponent(sFileId),
					Documentnumber: encodeURIComponent(sDocumentnumber),
					Documenttype: encodeURIComponent(sDocumenttype)
				}),
				sDownloadLink = oModel.sServiceUrl + sFilePath + "/$value";
			return bPermission ? sDownloadLink : undefined;
		},

		/** 
		 * filter the files based on the passed query string
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onSearchFile: function (oEvent) {
			var oSearchFiled = oEvent.getSource(),
				oUploadCollection = oSearchFiled.data("myTarget");
			var aFilters = [],
				sQuery = oEvent.getParameter("query");
			if (sQuery && sQuery.length > 0) {
				aFilters.push(new Filter("FileName", FilterOperator.Contains, sQuery));
			}
			oUploadCollection.getBinding("items").filter(aFilters, "Application");
		},

		/** 
		 * abstract method to get UploadCollection of block controller
		 * @returns {UploadCollection} UploadCollection of current view
		 */
		getFileUploaderObject: function () {
			return null;
		},

		/** 
		 * abstract method to get SearchField of block controller
		 * @returns {SearchField} SearchField current of current view
		 */
		getSearchFieldObject: function () {
			return null;
		},

		/** 
		 * Is called when it is needed to filter the file list
		 */
		updateFileUploaderFilter: function () {
			var oUploadCollection = this.getFileUploaderObject(),
				sObjectId = oUploadCollection.data("myObjectId"),
				sObjectType = oUploadCollection.data("myObjectType"),
				sDocumentType = oUploadCollection.data("myDocumentType");
			if (oUploadCollection) {
				var oSearchField = this.getSearchFieldObject();
				oSearchField.data("myTarget", oUploadCollection);
			}
			var aFilters = [];
			aFilters.push(new Filter("Objectkey", FilterOperator.EQ, sObjectId === undefined ? "" : sObjectId));
			aFilters.push(new Filter("Objecttype", FilterOperator.EQ, sObjectType === undefined ? "" : sObjectType));
			aFilters.push(new Filter("Documenttype", FilterOperator.EQ, sDocumentType === undefined ? "" : sDocumentType));
			if (oUploadCollection.getBinding("items")) {
				oUploadCollection.getBinding("items").filter(new Filter({
					filters: aFilters,
					and: true
				}));
			}
		},

		/** 
		 * opens viewer to show clicked file
		 * @param {sap.ui.base.Event} oEvent pattern match event
		 */
		onViewFileLinkPressed: function (oEvent) {
			var getUrl = window.location,
				baseUrl = getUrl.protocol + "//" + getUrl.host + "",
				oUploadCollectionItem = oEvent.getSource(),
				sUrl = baseUrl + oUploadCollectionItem.data("url"),
				sName = oUploadCollectionItem.data("name");

			if (!this._pdfViewer) {
				this._pdfViewer = new PDFViewer();
			}
			this._pdfViewer.setSource(sUrl);
			this._pdfViewer.setTitle(sName);
			this._pdfViewer.open();
		}

	});

});