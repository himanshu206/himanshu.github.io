/*! file-browser - v1.0.0 - 2018-09-02 */
(function (angular) {
	'use strict';

	angular
		.module('file-browser.api-client', []);

})(angular);

(function (angular) {
	'use strict';

	angular
		.module('file-browser', [
			'ui.router',
			'file-browser.api-client',
			'file-browser.folder',
			'file-browser.file'
		]);
})(angular);

(function (angular) {
	'use strict';

	angular
		.module('file-browser.file', []);
})(angular);
(function (angular) {
	'use strict';

	angular
		.module('file-browser.folder', []);
})(angular);

(function (angular) {
	'use strict';

	angular
		.module('file-browser.api-client')
		.service('file-browser.api-client.APIClientService', APIClientService);

	APIClientService.$inject = ['$http'];

	function APIClientService($http) {
		var self = this;

		self.get = get;

		function get(url, params) {
			return $http.get(url, params).then(function (response) {
				return response.data;
			});
		}
	}
})(angular);

(function (angular) {
	'use strict';

	angular
		.module('file-browser.folder')
		.service('file-browser.folder.folderService', FolderService);

	FolderService.$inject = [
		'file-browser.api-client.APIClientService',
		'file-browser.folder.FolderModel'
	];

	function FolderService(apiClientService, Folder) {
		var self = this;

		self.folders = [];
		self.selectedFolder = null;

		self.getFolders = getFolders;
		self.setSelectedFolder = setSelectedFolder;
		self.getSelectedFolder = getSelectedFolder;

		function getFolders() {
			return apiClientService.get('http://hck.re/jimM8z').then(function (data) {
				return createFolderObjects(data);
			});
		}

		function createFolderObjects(data) {
			if (!data || data.length === 0) {
				return;
			}

			for (var i = 0; i < data.length; ++i) {
				var folder = new Folder(data[i]);
				folder.buildSubFolderChain(data[i]);

				self.folders.push(folder);
			}

			return self.folders;
		}

		function setSelectedFolder(folder) {
			self.selectedFolder = folder;
		}

		function getSelectedFolder() {
			return self.selectedFolder;
		}
	}
})(angular);

(function (angular) {
	'use strict';

	angular
		.module('file-browser.file')
		.factory('file-browser.file.FileModel', FileModel);

	function FileModel() {

		function File(modelData) {
			this.name = modelData.file_name || '';
			this.type = modelData.type || '';
		}

		return File;
	}
})(angular);

(function (angular) {
	'use strict';

	angular
		.module('file-browser.folder')
		.factory('file-browser.folder.FolderModel', FolderModel);

	FolderModel.$inject = ['file-browser.file.FileModel'];

	function FolderModel(File) {

		function Folder(modelData) {
			this.title = modelData.title || '';
			this.files = [];
			this.subFolders = [];
			this.state = -1; // -1 -> closed, 1 -> open
		}

		Folder.prototype.buildSubFolderChain = function (modelData) {
			var folder = new Folder({title: 'Game play resources'});
			this.insertSubFolder(folder);

			var resources = modelData['Game play resources'];

			for(var key in resources) {
				var f = new Folder({title: key});
				var files = resources[key];

				for (var i = 0; i < files.length; ++i) {
					var file = new File(files[i]);
					f.insertFile(file);
				}

				folder.insertSubFolder(f);
			}
		};

		Folder.prototype.insertFiles = function (files) {
			if (!files || files.length === 0) {
				return;
			}

			for (var i = 0; i < files.length; ++i) {
				this.insertFile(files[i]);
			}
		};

		Folder.prototype.insertFile = function (file) {
			if (!file) {
				return;
			}

			this.files.push(file);
		};

		Folder.prototype.insertSubFolders = function (folders) {
			if (!folders || folders.length === 0) {
				return;
			}

			for (var i = 0; i < folders.length; ++i) {
				this.insertSubFolder(folders[i]);
			}
		};

		Folder.prototype.insertSubFolder = function (folder) {
			if (!folder) {
				return;
			}

			this.subFolders.push(folder);
		};

		Folder.prototype.isEmpty = function () {
			return this.files.length === 0;
		};

		Folder.prototype.toggleState = function () {
			this.state = this.state * -1;
		};

		Folder.prototype.isOpened = function () {
			return this.state === 1;
		};

		Folder.prototype.hasSubFolders = function () {
			return this.subFolders.length > 0;
		};

		Folder.prototype.hasFiles = function () {
			return this.files.length > 0;
		};

		return Folder;
	}
})(angular);

(function (angular) {
	'use strict';

	angular
		.module('file-browser')
		.controller('file-browser.folder.FolderDetailViewCtrl', FolderDetailViewCtrl);

	FolderDetailViewCtrl.$inject = [
		'$rootScope',
		'$scope',
		'file-browser.folder.folderService',
		'file-browser.folder.FolderModel',
		'file-browser.file.FileModel'
	];

	function FolderDetailViewCtrl($rootScope, $scope, folderService, Folder, File) {
		$scope.folder = null;

		$scope.folderData = {
			name: null,
			fileName: null
		};

		$scope.addNewFolder = addNewFolder;
		$scope.addNewFile = addNewFile;

		$rootScope.$on('folder-selected-event', function () {
			$scope.folder = folderService.getSelectedFolder();
		});

		function addNewFolder() {
			var name = $scope.folderData.name || 'New Folder';

			var f = new Folder(99, {title: name});
			$scope.folder.insertSubFolder(f);

			clearFolderObject();
		}

		function addNewFile() {
			var name = $scope.folderData.fileName || 'New File';

			var f = new File({file_name: name, type: 'a.iso'});
			$scope.folder.insertFile(f);

			clearFolderObject();
		}

		function clearFolderObject() {
			$scope.folderData.name = null;
			$scope.folderData.fileName = null;
		}
	}
})(angular);

(function (angular) {
	'use strict';

	angular
		.module('file-browser')
		.controller('file-browser.SidebarCtrl', SidebarCtrl);

	SidebarCtrl.$inject = [
		'$scope',
		'file-browser.folder.folderService'
	];

	function SidebarCtrl($scope, folderService) {
		$scope.folders = [];

		(function init() {
			folderService.getFolders().then(function (folders) {
				$scope.folders = folders;
				console.log($scope.folders);
			})
		})();
	}
})(angular);

(function (angular) {
	'use strict';

	angular
		.module('file-browser')
		.config(AppConfig)
		.run(AppRun);

	AppConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

	function AppConfig($stateProvider, $urlRouterProvider) {
		$stateProvider
			.state('body', {
				url: '/',
				views: {
					sidebar: {
						templateUrl: 'src/sidebar/templates/sidebar.html',
						controller: 'file-browser.SidebarCtrl'
					},
					content: {
						templateUrl: 'src/folder/templates/folder-detail-view.html',
						controller: 'file-browser.folder.FolderDetailViewCtrl'
					}
				}
			});

		$urlRouterProvider.otherwise('/');
	}

	AppRun.$inject = ['file-browser.folder.folderService'];

	function AppRun(folderService) {
	}
})(angular);

//# sourceMappingURL=file-browser.js.map