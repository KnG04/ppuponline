var CurrentPage = function () {

    var _$filterForm = null;
    var _auditLogService = abp.services.app.auditLog;
    var _selectedDateRange = {
        startDate: moment().startOf('day'),
        endDate: moment().endOf('day')
    };

    function createRequestParams() {
        var prms = {};
        _$filterForm.serializeArray().map(function (x) { prms[abp.utils.toCamelCase(x.name)] = x.value; });
        return $.extend(prms, _selectedDateRange);
    }

    var handleAuditLogs = function () {
        _$filterForm = $('#AuditLogFilterForm');

        _$filterForm.find('input.date-range-picker').daterangepicker(
            $.extend(true, app.createDateRangePickerOptions(), _selectedDateRange),
            function (start, end, label) {
                _selectedDateRange.startDate = start.format('YYYY-MM-DDT00:00:00Z');
                _selectedDateRange.endDate = end.format('YYYY-MM-DDT23:59:59.999Z');
            });

        $('.grid-container').on('click', '.btn-show-details', function () {
            var data = $(this).data('rowdata');
            showDetails(data);
        });

        $('#ShowAdvancedFiltersSpan').click(function () {
            $('#ShowAdvancedFiltersSpan').hide();
            $('#HideAdvancedFiltersSpan').show();
            $('#AdvacedAuditFiltersArea').slideDown();
        });

        $('#HideAdvancedFiltersSpan').click(function () {
            $('#HideAdvancedFiltersSpan').hide();
            $('#ShowAdvancedFiltersSpan').show();
            $('#AdvacedAuditFiltersArea').slideUp();
        });

        _$filterForm.keydown(function (e) {
            if (e.which === 13) {
                e.preventDefault();
                refreshAuditLogs();
            }
        });

        $('#RefreshAuditLogsButton').click(function (e) {
            e.preventDefault();
            refreshAuditLogs();
        });

        $('#ExportAuditLogsToExcelButton').click(function (e) {
            e.preventDefault();
            _auditLogService.getAuditLogsToExcel(createRequestParams())
                .done(function (result) {
                    app.downloadTempFile(result);
                });
        });
    }

    // grid datasource
    var auditLogsSource = new DevExpress.data.CustomStore({
        load: function (loadOptions) {
            var deferred = $.Deferred(),
                args = {};

            if (loadOptions.sort) {
                args.orderby = loadOptions.sort[0].selector;
                if (loadOptions.sort[0].desc)
                    args.orderby += " desc";
            }

            var inputFilter = createRequestParams();
            inputFilter.maxResultCount = loadOptions.take || 10;
            inputFilter.skipCount = loadOptions.skip || 0;

            if (loadOptions.sort) {
                inputFilter.sorting = loadOptions.sort[0].selector + " " + (loadOptions.sort[0].desc ? 'desc' : 'asc');
            }

            _auditLogService.getAuditLogs(inputFilter).done(function (result) {
                deferred.resolve(result.items, { totalCount: result.totalCount });
            }).fail(function () {
                deferred.reject("Data Loading Error");
            });

            return deferred.promise();
        }
    });

    // refresh grid datasource
    function refreshAuditLogs() {
        var ds = $("#AuditLogsTable").dxDataGrid("getDataSource");
        ds.load();
    };

    function getFormattedParameters(parameters) {
        try {
            var json = JSON.parse(parameters);
            return JSON.stringify(json, null, 4);
        } catch (e) {
            return parameters;
        }
    }

    function showDetails(auditLog) {
        $('#AuditLogDetailModal_UserName').html(auditLog.userName);
        $('#AuditLogDetailModal_ClientIpAddress').html(auditLog.clientIpAddress);
        $('#AuditLogDetailModal_ClientName').html(auditLog.clientName);
        $('#AuditLogDetailModal_BrowserInfo').html(auditLog.browserInfo);
        $('#AuditLogDetailModal_ServiceName').html(auditLog.serviceName);
        $('#AuditLogDetailModal_MethodName').html(auditLog.methodName);
        $('#AuditLogDetailModal_ExecutionTime').html(moment(auditLog.executionTime).fromNow() + ' (' + moment(auditLog.executionTime).format('YYYY-MM-DD hh:mm:ss') + ')');
        $('#AuditLogDetailModal_Duration').html(app.localize('Xms', auditLog.executionDuration));
        $('#AuditLogDetailModal_Parameters').html(getFormattedParameters(auditLog.parameters));

        if (auditLog.impersonatorUserId) {
            $('#AuditLogDetailModal_ImpersonatorInfo').show();
        } else {
            $('#AuditLogDetailModal_ImpersonatorInfo').hide();
        }

        if (auditLog.exception) {
            $('#AuditLogDetailModal_Success').hide();
            $('#AuditLogDetailModal_Exception').show();
            $('#AuditLogDetailModal_Exception').html(auditLog.exception);
        } else {
            $('#AuditLogDetailModal_Exception').hide();
            $('#AuditLogDetailModal_Success').show();
        }

        if (auditLog.customData) {
            $('#AuditLogDetailModal_CustomData_None').hide();
            $('#AuditLogDetailModal_CustomData').show();
            $('#AuditLogDetailModal_CustomData').html(auditLog.customData);
        } else {
            $('#AuditLogDetailModal_CustomData').hide();
            $('#AuditLogDetailModal_CustomData_None').show();
        }

        $('#AuditLogDetailModal').modal('show');
    }

    return {
        init: function () {
            handleAuditLogs();
        },
        getAuditLogsSource: function () {
            return auditLogsSource;
        },
        cellPrepared: function (options) {
            if (options.rowType == 'data') {
                if (options.columnIndex === 0) {
                    var $fieldHtml = $('<div>', { 'class': 'text-center ng-tns-c3-1' })
                        .append($('<button>', { 'class': 'btn m-btn m-btn--hover-accent m-btn--icon m-btn--icon-only m-btn--pill' })
                            .append($('<i>', { 'class': 'la la-search' })))
                        .click(function () {
                            showDetails(options.data);
                        });

                    options.cellElement.html($fieldHtml);
                }
            }
        }
    };
}();

$(function () {
    CurrentPage.init();
});
