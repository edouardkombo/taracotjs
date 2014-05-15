var col_count = 5;
var items_per_page = 0;
var edit_modal = new $.UIkit.modal.Modal("#taracot-modal-edit");

var process_rows = [
    function(val, id) {
        return val;
    },
    function(val, id) {
        if (val == null) {
            val = '&mdash;';
        }
        return val;
    },
    function(val, id) {
        return val;
    },
    function(val, id) {
        return '<div style="text-align:center">' + val + '</div>';
    },
    function(val, id) {
        return '<div style="text-align:center"><button class="uk-icon-button uk-icon-edit taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button>&nbsp;<button class="uk-icon-button uk-icon-button-danger uk-icon-trash-o taracot-tableitem-delete" id="taracot-btndel-' + id + '" type="button"></button></div>';
    }
];

var render_table = function(data) {       
    $('#taracot_table > tbody').html('');
    for (var i=0; i < data.length; i++) {
        var table_data = '<tr>';
        var _id = data[i][0]        
        for (var j = 1; j <= col_count; j++) {            
            if (j < data[i].length) {
                table_data += '<td style="vertical-align:middle">' + process_rows[j-1](data[i][j], _id) + '</td>';
            } else {
                table_data += '<td style="vertical-align:middle">' + process_rows[j-1]('', _id) + '</td>';
            }            
        }
        table_data += '</tr>';
        $('#taracot_table > tbody').append(table_data);
        $('.taracot-tableitem-edit').unbind();
        $('.taracot-tableitem-edit').click(function() {
             var id = $(this).attr('id').replace('taracot-btnedt-', '');
             edit_user(id);
        })
    }
};

var render_pagination = function(page, total) {
    var pgnt = '';
    var page = parseInt(page);
    var max_pages = 10;
    var num_pages = Math.ceil(total / items_per_page);
    if (num_pages < 2) {
        return;
    }
    pgnt = '<ul class="uk-pagination uk-float-right" id="taracot-pgnt">';
    if (num_pages > max_pages) {
        if (page > 1) {
            pgnt += '<li id="taracot-pgnt-' + (page-1) + '"><a href="#"><i class="uk-icon-angle-double-left"></i></a></li>';
        }
        if (page > 3) {
            pgnt += '<li id="taracot-pgnt-1"><a href="#">1</i></a></li>';
        }
        var _st = page - 2;        
        if (_st < 1) {
            _st = 1;
        }
        if (_st - 1 > 1) {
            pgnt += '<li>...</li>';
        }
        var _en = page + 2;
        if (_en > num_pages) {
            _en = num_pages;
        }
        for (var i = _st; i <= _en; i++) {
            pgnt += '<li id="taracot-pgnt-' + i + '"><a href="#">' + i + '</a></li>';
        }
        if (_en < num_pages-1) {
            pgnt += '<li><span>...</span></li>';
        }
        if (page <= num_pages-3) {            
            pgnt += '<li id="taracot-pgnt-' + num_pages + '"><a href="#">' + num_pages + '</a></li>';
        }
        if (page < num_pages) {            
            pgnt += '<li id="taracot-pgnt-' + (page + 1) + '"><a href="#"><i class="uk-icon-angle-double-right"></i></a></li>';
        }
    } else {
        for (var i = 1; i <= num_pages; i++) {
            pgnt += '<li id="taracot-pgnt-' + i + '"><a href="#">' + i + '</a></li>';
        }    
    }
    pgnt += '</ul>';
    $('#taracot_table_pagination').html(pgnt);
    $('#taracot-pgnt-' + page).html('<span>' + page + '</span>');
    $('#taracot-pgnt-' + page).addClass('uk-active');
    $('#taracot-pgnt > li').click(pagination_handler);    
};

var taracot_table_loading_indicator = function(show) {
    if (show) {
        var destination = $('#taracot_table').offset();
        $('.taracot-loading').css({top: destination.top, left: destination.left, width: $('#taracot_table').width(), height: $('#taracot_table').height() });
        $('.taracot-loading').removeClass('uk-hidden');
        $('#taracot_table_pagination').hide();
    } else {
        $('.taracot-loading').addClass('uk-hidden');
        $('#taracot_table_pagination').show();
    }
};

var load_data = function(page) {
    var skip = (page-1) * items_per_page;
    taracot_table_loading_indicator(true);
    $.ajax({
        type: 'POST',
        url: '/cp/users/data/list',
        data: {
            skip: skip
        },
        dataType: "json",
        success: function (data) {
            taracot_table_loading_indicator(false);
            if (data.status == 1) {
                if (typeof data.users != undefined) {
                    items_per_page = data.ipp;
                    render_table(data.users);
                    render_pagination(page, data.total);
                }
            }
        },
        error: function () {
            taracot_table_loading_indicator(false);
        }
    });
};

var load_edit_data = function(id) {
    $('#taracot-modal-edit-wrap').addClass('uk-hidden');
    $('#taracot-modal-edit-loading').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    $.ajax({
        type: 'POST',
        url: '/cp/users/data/load',
        data: {
            id: id
        },
        dataType: "json",
        success: function (data) {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            if (data.status == 1) {
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                if (typeof data.user != undefined ) {
                    if (typeof data.user.username != undefined) {
                        $('#username').val('data.user.username');
                    }
                    if (typeof data.user.username != undefined) {
                        $('#username').val(data.user.username);
                    }
                    if (typeof data.user.realname != undefined) {
                        $('#realname').val(data.user.realname);
                    }
                    if (typeof data.user.email != undefined) {
                        $('#email').val(data.user.email);
                    }
                    if (typeof data.user.status != undefined) {
                        $('#status').val(data.user.status);
                    }
                }
                $('#username').focus();
            } else {
                $('#taracot-modal-edit-loading-error').removeClass('uk-hidden');
            }
        },
        error: function () {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            $('#taracot-modal-edit-loading-error').removeClass('uk-hidden');
        }
    });
};

// Pagination click

var pagination_handler = function() {
    if ($(this).hasClass('uk-active')) {
        return;
    }
    var page = $(this).attr('id').replace('taracot-pgnt-', '');
    load_data(page);
}

var edit_user = function(id) {
    edit_modal.show();
    load_edit_data(id);
}

load_data(1);