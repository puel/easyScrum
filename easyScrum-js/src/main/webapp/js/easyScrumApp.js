'use strict';
/* 
 * Copyright 2014 Paul.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//http://www.jquery4u.com/tutorials/jqueryhtml5-input-focus-cursor-positions/
$.fn.setCursorEnd = function(pos) {
    this.each(function(index, elem) {
        var length = elem.value ? elem.value.length : 0; 
        if (elem.setSelectionRange && length > 0) {
            try { elem.setSelectionRange(length, length);} catch (e) {/** ignore */};
        } else if (elem.createTextRange && length) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd('character', length);
            range.moveStart('character', length);
            range.select();
        }
    });
    return this;
};

// http://stackoverflow.com/questions/17494732/how-to-make-a-loading-indicator-for-every-asynchronous-action-using-q-in-an-a
// or https://gist.github.com/maikeldaloo/5140733
angular.module('RequestInterceptor', [])
  .config(function ($httpProvider) {
    $httpProvider.interceptors.push('requestInterceptor');
  })
  .factory('requestInterceptor', function ($q, $rootScope) {
        $rootScope.network = {
            pendingRequests: 0,
            lastRequestError: null,
            busy: false
        };
        function updateStatus(increment, error) {
            $rootScope.network.lastRequestError = error ? error : null;
            $rootScope.network.errorType = null;
            $rootScope.network.fieldErrors = {}; // reset field errors
            $rootScope.network.pendingRequests += increment;
            if ($rootScope.network.pendingRequests < 0) $rootScope.network.pendingRequests = 0;
            // check for error
            if (error && error.data && error.data.fieldErrors) {
                $rootScope.network.errorType = 'validation';
                console.info("User Input Error (validation):", error.data.fieldErrors);
                angular.forEach(error.data.fieldErrors, function(fieldError) {
                    $rootScope.network.fieldErrors[fieldError.field] = fieldError;
                });
            } else if (error) {
                $rootScope.network.errorType = 'unknown';
                console.warn("Server Error:", error);
            }
            $rootScope.network.busy = $rootScope.network.pendingRequests > 0;
        };
        return {
           'request': function (config) {
                updateStatus(1);
                return config || $q.when(config);
            },
            'requestError': function(rejection) {
                updateStatus(-1, rejection);
                return $q.reject(rejection);
            },
            'response': function(response) {
                updateStatus(-1);
                return response || $q.when(response);
            },
            'responseError': function(rejection) {
                updateStatus(-1, rejection);
                return $q.reject(rejection);
            }
        };
    }).
    directive('messages', function() {
        return {
            restrict: 'AC',
            templateUrl: 'directive/messages/messages.html'
        };
    }).
    directive('message', function() {
        function link (scope, element, attrs) {
            var bindTo = 'network.fieldErrors.' + attrs.message;
            if (attrs.message) {
                var formGroup = element.closest('.form-group');
                scope.$watch(bindTo, function(newValue) {
                    if (newValue) formGroup.addClass('has-error');
                    else formGroup.removeClass('has-error');
                });
            }
        }
        return {
            restrict: 'A',
            compile: function (element, attrs, transclude) {
                var bindTo = 'network.fieldErrors.' + attrs.message;
                if (attrs.message) {
                    element.parent().append('<span class="help-block" ng-show="' + bindTo + '.defaultMessage">{{ ' + bindTo + '.defaultMessage }}</span>');
                } else {
                    console.error("Message directive needs a value to bind to the validation error data.");
                }
                return link;
            }
        };
    });
    
// TODO replace most of the own directives with either:
// http://mgcrea.github.io/angular-strap/
// http://angular-ui.github.io/
            
angular.module('easyScrum', ['ngRoute', 'restangular', 'RequestInterceptor']).
    config(['$routeProvider', 'RestangularProvider', function($routeProvider, RestangularProvider) {
        RestangularProvider.setBaseUrl('service/');
        $routeProvider.when('/home', {templateUrl: 'views/home.html', controller: 'HomeCtrl'});
        $routeProvider.when('/day', {templateUrl: 'views/day.html', controller: 'DayCtrl', reloadOnSearch: false});
        $routeProvider.when('/teams', {templateUrl: 'views/teams.html', controller: 'TeamsCtrl'});
        $routeProvider.otherwise({redirectTo: '/home'});
    }]).
    // http://stackoverflow.com/questions/13471129/angularjs-ng-repeat-finish-event
    directive('repeatDone', function() {
        return function(scope, element, attrs) {
            if (scope.$last) { // all are rendered
                console.log("repeatDone...");
                scope.$eval(attrs.repeatDone);
            }
        };
    }).
    directive('easyDialog', function() {
        return {
            restrict: 'AC',
            repalce: true,
            transclude: true,
            templateUrl: 'directive/dialog/dialog.html',
            scope: {
                show: "=", // bidi binding on object
                header: "@" // string
            },
            link: function (scope, element, attrs) {
                var dialog = null,
                    init = false;
                addEventHandler();
                if (element.children().length > 0) {
                    dialog = $(element.children()[0]);
                }
                scope.$watch("show", function(show) {
                    if (show === true) {
                        $(element.children()[0]).modal('show');
                    } else {
                        dialog && dialog.modal('hide');
                    }
                });
                scope.close = function() {
                    scope.show = false;
                };
                function addEventHandler() {
                    element.on('hidden.bs.modal', function () {
                        scope.$apply(function() {scope.show = false;});
                    });
                    element.on('shown.bs.modal', function () {
                        //dialog.find(".modal-body :input:visible:enabled:first").focus().setCursorEnd();
                        dialog && dialog.find(".modal-body .dialog-focus").focus().setCursorEnd();
                    });
                    //init = true;
                }
            }
        };
    }).
    /**
     * Directive which can be used instead of
     * requires: http://bootboxjs.com/ & bootstrap
     * @param {function} confirm-okay
     */
    directive('easyConfirmClick', function() {
        return {
            restrict: 'A',
            repalce: false,
            transclude: false,
            link: function (scope, element, attrs) {
                element.on('click', function(e) {
                    bootbox.confirm(attrs.easyConfirmClick, function(result) {
                        if (result) {
                            scope.$apply(attrs.confirmOkay);
                        }
                    });
                });
            }
        };
    }).
    directive('easyTooltip', function($timeout) {
        return {
            restrict: 'C',
            repalce: false,
            link: function (scope, element, attrs) {
                //console.log("tooltip attached to: ", element);
                $timeout(function() {element.tooltip(); }, 0, false);
            }
        };
    }).
    // requeries: http://eternicode.github.io/bootstrap-datepicker
    directive('easyDate', function() {
        return {
            restrict: 'AC',
            repalce: false,
            scope: {
                startDate: "@", // string
                endDate: "@" // string
            },
            link: function (scope, element, attrs) {
                //console.log(attrs);
                var datePicker = element.datepicker({
                    format: 'yyyy-mm-dd',
                    startDate: scope.startDate,
                    endDate: scope.endDate,
                    autoclose: true
                }); 
                
                scope.$watch('startDate', function(newVal){ 
                    datePicker.datepicker('setStartDate', newVal ? new Date(newVal) : null); 
                });
                scope.$watch('endDate', function(newVal){ 
                    datePicker.datepicker('setEndDate', newVal ? new Date(newVal) : null); 
                });
            }
        };
    }).
    // requeries: https://github.com/adangel/simple-burndown-chart
    // see also: http://docs.angularjs.org/api/ng/type/ngModel.NgModelController
    directive('easyBurndown', function($filter) {
        var burndowns = 0;
        return {
            restrict: 'E',
            repalce: false,
            require: '?ngModel',
            scope: {
                showGrid: "@", // string
                showComments: "@" // string
            },
            link: function (scope, element, attrs, ngModel) {
                if(!ngModel) {
                    log.warn('easyBurndown requires a ngModel to render.');
                    return; // do nothing if no ng-model
                }
                var id = "easyBurndown_" + (++burndowns);
                ngModel.$render = render;
                $(window).bind("resize", render);

                var rendering = null;
                function render() {
                    element.empty();
                    if (ngModel.$viewValue) {
                        if (rendering) clearTimeout(rendering);
                        rendering = setTimeout(function() {
                            element.html('<div style="easyBurndown" id="' + id + '"></div>');
                            // copy is needed as d3.js does change the data inside
                            var data = angular.copy(ngModel.$viewValue);
                            if (!data.timeDomain) { // no timedomain, lets create one
                                var start = new Date(data.start),
                                    end = new Date(data.end);
                                data.timeDomain = [];
                                while(start <= end) {
                                    data.timeDomain.push($filter('date')(start, 'yyyy-MM-dd'));
                                    start.setDate(start.getDate() + 1); // next day
                                }
                            }
                                
                            console.log('render burndown for:', ngModel.$viewValue, ' full data: ', data);
                            SBD.render(data, {
                                chartNodeSelector: '#' + id, 
                                showGrid: scope.showGrid || true, 
                                showComments: scope.showComments || true,
                                dateFormat: "%Y-%m-%d",
                                width: $(element).parent().width()
                            }); 
                        }, 70);
                    }
                }
            }
        };
    });