/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/mjzsoft/FileUploader0Auto/test/integration/PhoneJourneys"
	], function () {
		QUnit.start();
	});
});
