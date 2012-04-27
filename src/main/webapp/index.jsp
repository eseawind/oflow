﻿<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>oFlow流程管理平台导航主页</title>
    <link href="scripts/ligerUI/skins/Aqua/css/ligerui-all.css" rel="stylesheet" type="text/css" />
    <link href="styles/index.css" rel="stylesheet" type="text/css" />
    <link href="<c:url value="/scripts/ligerUI/skins/ligerui-icons.css" />" rel="stylesheet" type="text/css" />
    
    <script src="scripts/jquery/jquery-1.5.2.min.js" type="text/javascript"></script>
    <script src="scripts/ligerUI/js/core/base.js" type="text/javascript"></script>
    <script src="scripts/ligerUI/js/plugins/ligerAccordion.js" type="text/javascript"></script>
    <script src="scripts/ligerUI/js/plugins/ligerTab.js" type="text/javascript"></script>
    <script src="scripts/ligerUI/js/plugins/ligerTree.js" type="text/javascript"></script>
    <script src="scripts/ligerUI/js/plugins/ligerLayout.js" type="text/javascript"></script> 
    <script src="scripts/ligerUI/js/plugins/ligerMenu.js" type="text/javascript"></script>
    <script src="scripts/ligerUI/js/plugins/ligerMenuBar.js" type="text/javascript"></script>
    <script src="scripts/ligerUI/js/plugins/ligerWindow.js" type="text/javascript"></script>
    <!-- edit -->
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerForm.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerDateEditor.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerComboBox.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerCheckBox.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerButton.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerDialog.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerRadio.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerSpinner.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerTextBox.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerTip.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerToolBar.js" />" type="text/javascript"></script>
    <!-- list -->
    <script src="<c:url value="/scripts/ligerUI/js/plugins/ligerGrid.js" />" type="text/javascript"></script>
	<script src="<c:url value="/scripts/ligerUI/js/plugins/ligerToolBar.js" />" type="text/javascript"></script>
	<script src="<c:url value="/scripts/ligerUI/js/plugins/ligerResizable.js" />" type="text/javascript"></script>
	<script src="<c:url value="/scripts/ligerUI/js/plugins/ligerCheckBox.js" />" type="text/javascript"></script>
    
    <!-- validation -->
    <script src="<c:url value="/scripts/jquery-validation/jquery.validate.min.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/jquery-validation/jquery.metadata.js" />" type="text/javascript"></script>
    <script src="<c:url value="/scripts/jquery-validation/messages_cn.js" />" type="text/javascript"></script>
    
    <script type="text/javascript" src="<c:url value="/scripts/jqueryform/jquery.form-2.8.js" />"></script>
	<script type="text/javascript" src="<c:url value="/scripts/json2.js" />"></script>
	<script src="<c:url value="/scripts/oflow/oflow.util.js" />" type="text/javascript"></script>
    
    <style type="text/css"> 
    
	</style>
	<script type="text/javascript">
            var tab = null;
            var accordion = null;
            var tree = null;
            $(function ()
            {
                //布局
                $("#layout1").ligerLayout({ leftWidth: 190, height: '100%',heightDiff:-34,space:4, onHeightChanged: f_heightChanged });

                var height = $(".l-layout-center").height();

                //Tab
                $("#framecenter").ligerTab({ height: height });

                //面板
                $("#accordion1").ligerAccordion({ height: height - 24, speed: null });

                $(".l-link").hover(function ()
                {
                    $(this).addClass("l-link-over");
                }, function ()
                {
                    $(this).removeClass("l-link-over");
                });
                
                //树
                $("#tree1").ligerTree({
                	url: '<c:url value="/indexData" />',
                    // data : indexdata,
                    checkbox: false,
                    slide: false,
                    nodeWidth: 120,
                    attribute: ['nodename', 'url'],
                    onSelect: function (node)
                    {
                        if (!node.data.url) return;
                        var tabid = $(node.target).attr("tabid");
                        if (!tabid)
                        {
                            tabid = new Date().getTime();
                            $(node.target).attr("tabid", tabid)
                        } 
                        f_addTab(tabid, node.data.text, node.data.url);
                    }
                });

                tab = $("#framecenter").ligerGetTabManager();
                accordion = $("#accordion1").ligerGetAccordionManager();
                tree = $("#tree1").ligerGetTreeManager();
                $("#pageloading").hide();

            });
            function f_heightChanged(options)
            {
                if (tab)
                    tab.addHeight(options.diff);
                if (accordion && options.middleHeight - 24 > 0)
                    accordion.setHeight(options.middleHeight - 24);
            }
            function f_addTab(tabid, text, url, useFrame)
            { 
                tab.addTabItem({ tabid : tabid,text: text, url: url, useFrame: useFrame});
            } 
            function f_reloadTab(url) { // 重新加载tab
            	var tabid = tab.getSelectedTabItemID();
            	tab.reload(tabid, url);
            }
	</script> 
</head>

<body style="padding:0px;background:#EAEEF5;">
<div id="pageloading"></div>  
<div id="topmenu" class="l-topmenu">
    <div class="l-topmenu-logo">oFlow流程管理平台导航主页</div>
    <div class="l-topmenu-welcome">
        <a href="index.aspx" class="l-link2">服务器版本</a>
        <span class="space">|</span>
        <a href="https://me.alipay.com/daomi" class="l-link2" target="_blank">捐赠</a> 
        <span class="space">|</span>
         <a href="http://bbs.ligerui.com" class="l-link2" target="_blank">论坛</a>
    </div> 
</div>
  <div id="layout1" style="width:99.2%; margin:0 auto; margin-top:4px; "> 
        <div position="left"  title="主要菜单" id="accordion1"> 
	        <div title="功能列表" class="l-scroll">
	            <ul id="tree1" style="margin-top:3px;">
	       </div>
	       <div title="应用场景">
	       <div style=" height:7px;"></div>
	            <a class="l-link" href="javascript:f_addTab('listpage','列表页面','demos/case/listpage.htm')">列表页面</a> 
	            <a class="l-link" href="demos/dialog/win7.htm" target="_blank">模拟Window桌面</a> 
	       </div>    
	        <div title="实验室">
	       <div style=" height:7px;"></div>
	             <a class="l-link" href="lab/generate/index.htm" target="_blank">表格表单设计器</a> 
	       </div> 
        </div>
        <div position="center" id="framecenter"> 
            <div tabid="home" title="我的主页" style="height:300px" >
                <iframe frameborder="0" name="home" id="home" src="welcome.htm"></iframe>
            </div> 
        </div> 
    </div>
    <div  style="height:32px; line-height:32px; text-align:center;">
            Copyright © 2012-2013 www.yunbosoruce.com
    </div>
    <div style="display:none"></div>
</body>
</html>
