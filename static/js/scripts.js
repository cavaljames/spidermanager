// Empty JS for your own code to be here
const flower_api = "/api/task/async-apply/tasks.net_crawler.facebook_scraper.task_entry_temp";
const username = "";
const password = "";

function refreshTaskList() {
    var search = $("#search").val();
    var job = window.sessionStorage.getItem('job');
    var type = $("#type_selection option:selected").val();
    var status = $("#status_selection option:selected").val();
    var disable = $("#disable_selection option:selected").val();
    var order = $("#order option:selected").val();
    window.sessionStorage.setItem('type', type);
    window.sessionStorage.setItem('status', status);
    window.sessionStorage.setItem('disable', disable);
    window.sessionStorage.setItem('order', order);
    window.sessionStorage.setItem('search', search);
    var params = "type=" + type + "&status=" + status + "&order=" + order + "&disable=" + disable
    if (search != "" & search != undefined){
        params = params + "&search=" + search
    }
    if (job != "" & job != undefined){
        params = params + "&job=" + job
    }
    $(location).prop("href", "/tasks?" + params);
}

function goToStats() {
    $(location).prop("href", "/tasks/stats");
}

function goBackTaskList() {
    $(location).prop("href", "/tasks");
}

function clickRootId(searchId) {
    var type = 'All';
    var status = 'ALL';
    var disable = 'ALL';
    var order = 'step';
    window.sessionStorage.setItem('type', type);
    window.sessionStorage.setItem('status', status);
    window.sessionStorage.setItem('disable', disable);
    window.sessionStorage.setItem('order', order);
    window.sessionStorage.setItem('search', searchId);
    window.sessionStorage.removeItem('job');
    $(location).prop("href", "/tasks?type=" + type + "&status=" + status + "&order=" + order + "&search=" + searchId + "&disable=" + disable);
}

function clickJobId(searchId) {
    var type = 'All';
    var status = 'ALL';
    var disable = 'ALL';
    var order = 'step';
    window.sessionStorage.setItem('type', type);
    window.sessionStorage.setItem('status', status);
    window.sessionStorage.setItem('disable', disable);
    window.sessionStorage.setItem('order', order);
    window.sessionStorage.setItem('job', searchId);
    window.sessionStorage.removeItem('search');
    $(location).prop("href", "/tasks?type=" + type + "&status=" + status + "&order=" + order + "&job=" + searchId + "&disable=" + disable);
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

//初始化
$(function() {
    var type = window.sessionStorage.getItem('type');
    var status = window.sessionStorage.getItem('status');
    var order = window.sessionStorage.getItem('order');
    var search = window.sessionStorage.getItem('search');
    var disable = window.sessionStorage.getItem('disable');
    $("#type_selection").find("option[value='" + type + "']").attr("selected", true);
    $("#status_selection").find("option[value='" + status + "']").attr("selected", true);
    $("#disable_selection").find("option[value='" + disable + "']").attr("selected", true);
    $("#order").find("option[value='" + order + "']").attr("selected", true);
    $("#search").attr("value", search);
})

//查询任务列表
$("#search_submit").click(function() {
    window.sessionStorage.removeItem('job');
    refreshTaskList();
});
//跳转到主页统计
$(".goto-stats-btn").click(function() {
    goToStats();
});
//返回主页列表
$(".goto-task-btn").click(function() {
    goBackTaskList();
});

//启动任务
$(".start-btn").click(function() {
    var task_id = $(this).val();
    var url = flower_api + ".fbspider_new_tasks";
    data = {
        "kwargs": {
            "run": "run",
            "task_id": task_id
        }
    }

    $.ajax({
        url: url,
        method: "POST",
        dataType: "json",
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
        cache: false,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
            xhr.setRequestHeader("X-Mobile", "false");
        },
        success: function(data) {
            var d = JSON.stringify(data);
            loading();
            sleep(1000).then(() => {
                refreshTaskList();
            })
        }
    });
});

//重置任务
$(".reset-btn").click(function() {
    var task_id = $(this).val();
    var url = flower_api + ".fbspider_new_tasks";
    data = {
        "kwargs": {
            "run": "reset",
            "task_id": task_id
        }
    }

    $.ajax({
        url: url,
        method: "POST",
        dataType: "json",
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
        cache: false,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
            xhr.setRequestHeader("X-Mobile", "false");
        },
        success: function(data) {
            var d = JSON.stringify(data);
            loading();
            sleep(1000).then(() => {
                refreshTaskList();
            })
        }
    });
});

//更新任务
$(".update-btn").click(function() {
    var task_id = $(this).val();
    var url = flower_api + ".fbspider_new_tasks";
    data = {
        "kwargs": {
            "run": "update",
            "task_id": task_id
        }
    }

    $.ajax({
        url: url,
        method: "POST",
        dataType: "json",
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
        cache: false,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
            xhr.setRequestHeader("X-Mobile", "false");
        },
        success: function(data) {
            var d = JSON.stringify(data);
            loading();
            sleep(1000).then(() => {
                refreshTaskList();
            })
        }
    });
});

//初始化任务
$(".clear-btn").click(function() {
    var job_id = $(this).val();
    var url = flower_api + ".fbspider_clear";
    data = {
        "kwargs": {
            "job_ids": [job_id]
        }
    }

    $.ajax({
        url: url,
        method: "POST",
        dataType: "json",
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
        cache: false,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
            xhr.setRequestHeader("X-Mobile", "false");
        },
        success: function(data) {
            var d = JSON.stringify(data);
            loading();
            sleep(1000).then(() => {
                refreshTaskList();
            })
        }
    });
});

//新增主页
$(".add-btn").click(function() {
    var flag = true;
    var page_ids = $("#page-ids").val().split(',');
    for (let i in page_ids){
        if(!$.isNumeric(page_ids[i])){
            flag = false;
            alert("主页ID有误！！！")
            return false;
        }
        page_ids[i] = page_ids[i].trim();
    }
    if(!flag) {
        return;
    }
    var url = flower_api + ".fbspider_create";
    data = {
        "kwargs": {
            "page_ids": page_ids
        }
    }

    $.ajax({
        url: url,
        method: "POST",
        dataType: "json",
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
        cache: false,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
            xhr.setRequestHeader("X-Mobile", "false");
        },
        success: function(data) {
            var d = JSON.stringify(data);
            sleep(1000).then(() => {
                refreshTaskList();
            })
        }
    });
});


//修改post采集天数
$(".do-modify").click(function() {
    var flag = true;
    var task_id = $(this).attr("task");
    var days = $("#post-task-"+task_id).val();

    if(!$.isNumeric(days)){
        flag = false;
        alert("输入天数有误！！！")
        return false;
    }
    if(!flag) {
        return;
    }

    var url = flower_api + ".fbspider_modify_tasks";
    data = {
        "kwargs": {
            "task_id": task_id,
            "modify_dict": {
                "params": "{\\'time_start\\': "+days+"}"
            }
        }
    }

    $.ajax({
        url: url,
        method: "POST",
        dataType: "json",
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
        cache: false,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
            xhr.setRequestHeader("X-Mobile", "false");
        },
        success: function(data) {
            var d = JSON.stringify(data);
            sleep(1000).then(() => {
                refreshTaskList();
            })
        }
    });
});


function loading() {
    document.getElementById('light').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
}


$(function () {
    //显示成功百分比
    //hover某处显示悬浮框
    $(".progress-bar").mouseover(function(e){
        var __taskId = $(this).attr("id").substr($(this).attr("id").lastIndexOf("__"));
        //获取鼠标位置函数
        var mousePos = mousePosition(e);
        var  xOffset = 20;
        var  yOffset = 25;
        $("#success-tip"+__taskId).css("display","block")
        .css("position","absolute").css("top",(mousePos.y - yOffset) + "px")
        .css("left",(mousePos.x + xOffset) + "px");

     });
     //鼠标离开表格隐藏悬浮框
     $(".progress-bar").mouseout(function(){
        var __taskId = $(this).attr("id").substr($(this).attr("id").lastIndexOf("__"));
         $("#success-tip"+__taskId).css("display","none");
     });


    //显示失败百分比
    //hover某处显示悬浮框
    $(".progress-bar-1").mouseover(function(e){
        var __taskId = $(this).attr("id").substr($(this).attr("id").lastIndexOf("__"));
        //获取鼠标位置函数
        var mousePos = mousePosition(e);
        var  xOffset = 20;
        var  yOffset = 25;
        $("#fail-tip"+__taskId).css("display","block")
        .css("position","absolute").css("top",(mousePos.y - yOffset) + "px")
        .css("left",(mousePos.x + xOffset) + "px");

     });
     //鼠标离开表格隐藏悬浮框
     $(".progress-bar-1").mouseout(function(){
        var __taskId = $(this).attr("id").substr($(this).attr("id").lastIndexOf("__"));
        $("#fail-tip"+__taskId).css("display","none");
     });

    //显示0任务百分比
    //hover某处显示悬浮框
    $(".progress").mouseover(function(e){
        var __taskId = $(this).attr("id").substr($(this).attr("id").lastIndexOf("__"));
        //获取鼠标位置函数
        var mousePos = mousePosition(e);
        var  xOffset = 20;
        var  yOffset = 25;
        $("#success-tip"+__taskId).css("display","block")
        .css("position","absolute").css("top",(mousePos.y - yOffset) + "px")
        .css("left",(mousePos.x + xOffset) + "px");

     });
     //鼠标离开表格隐藏悬浮框
     $(".progress").mouseout(function(){
        var __taskId = $(this).attr("id").substr($(this).attr("id").lastIndexOf("__"));
         $("#success-tip"+__taskId).css("display","none");
     });
});


//获取鼠标坐标
function mousePosition(ev){
    ev = ev || window.event;
    if(ev.pageX || ev.pageY){
        return {x:ev.pageX, y:ev.pageY};
    }
    return {
        x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
        y:ev.clientY + document.body.scrollTop - document.body.clientTop
    };
}


$(document).ready(function(){
    $(".goto-add-btn").click(function(){
        $("#choiceWindow").slideDown(300);
        $("#backGround").show();
    });

    $("#x").click(function(){
        $("#choiceWindow").slideUp(300);
        $("#backGround").hide();
    })


    $(".modify-post").click(function(){
        var task_id = $(this).data("task-id")
        $("#choicePost-"+task_id).slideDown(300);
        $("#backGroundPost").show();
    });

    $('label[id^="x_post-"]').click(function(){
        var task_id = $(this).data("task-id")
        $("#choicePost-"+task_id).slideUp(300);
        $("#backGroundPost").hide();
    })
});